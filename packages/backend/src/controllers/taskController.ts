import { Response } from 'express';
import { Task, User } from '../models';
import { createTaskSchema, updateTaskSchema, taskFiltersSchema } from '@gamify/shared';
import { z } from 'zod';
import { awardPoints, getPointsConfig } from '../services/gamificationService';
import { updateStreak } from '../services/streakService';
import { updateTeamChallengeProgress } from '../services/challengeService';
import { TaskStatus } from '@gamify/shared';
import { AuthRequest } from '../middleware/auth';
import { TeamMember } from '../models';

/**
 * GET /api/tasks - Lista tarefas com filtros
 */
export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters = taskFiltersSchema.parse(req.query);
    const userId = req.user?._id?.toString();

    const query: Record<string, unknown> = {};

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.assignedTo) {
      query.assignedTo = filters.assignedTo;
    }
    if (filters.priority) {
      query.priority = filters.priority;
    }
    if (filters.dueDateFrom || filters.dueDateTo) {
      query.dueDate = {};
      if (filters.dueDateFrom) {
        query.dueDate.$gte = new Date(filters.dueDateFrom);
      }
      if (filters.dueDateTo) {
        query.dueDate.$lte = new Date(filters.dueDateTo);
      }
    }

    const sort: Record<string, 1 | -1> = {};
    sort[filters.sortBy] = filters.sortOrder === 'asc' ? 1 : -1;

    const skip = (filters.page - 1) * filters.limit;

    // Se não especificar parentTask e não incluir subtarefas, mostrar apenas tarefas principais
    if (!filters.parentTask && !filters.includeSubtasks) {
      query.parentTask = { $exists: false };
    } else if (filters.parentTask) {
      query.parentTask = filters.parentTask;
    }

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email avatar')
        .populate('supervisor', 'name email')
        .populate('parentTask', 'title status')
        .sort(sort)
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      Task.countDocuments(query),
    ]);

    res.json({
      tasks,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Filtros inválidos', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
};

/**
 * GET /api/tasks/:id - Busca tarefa por ID
 */
export const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('supervisor', 'name email')
      .populate('parentTask', 'title status')
      .lean();

    if (!task) {
      res.status(404).json({ error: 'Tarefa não encontrada' });
      return;
    }

    // Buscar subtarefas
    const subtasks = await Task.find({ parentTask: req.params.id })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: 1 })
      .lean();

    res.json({ ...task, subtasks });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tarefa' });
  }
};

/**
 * GET /api/tasks/:id/subtasks - Busca subtarefas de uma tarefa
 */
export const getSubtasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subtasks = await Task.find({ parentTask: req.params.id })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: 1 })
      .lean();

    res.json({ subtasks });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar subtarefas' });
  }
};

/**
 * POST /api/tasks - Cria nova tarefa
 */
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createTaskSchema.parse(req.body);
    const userId = req.user?._id?.toString();
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    // Determinar para quem atribuir a tarefa
    let assignedTo: string | undefined;
    
    if (userRole === 'admin') {
      // Admin pode escolher quem atribuir, se não escolher, atribui para ele mesmo
      assignedTo = data.assignedTo || userId;
    } else {
      // Usuário normal só pode criar tarefas para ele mesmo
      assignedTo = userId;
    }

    const task = new Task({
      ...data,
      assignedTo,
      createdBy: userId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });

    await task.save();
    await task.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'supervisor', select: 'name email' },
      { path: 'parentTask', select: 'title status' },
    ]);

    res.status(201).json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
};

/**
 * PUT /api/tasks/:id - Atualiza tarefa
 */
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = updateTaskSchema.parse(req.body);
    const userId = req.user?._id?.toString();

    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404).json({ error: 'Tarefa não encontrada' });
      return;
    }

    // Verificar permissões (criador ou supervisor)
    if (
      task.createdBy.toString() !== userId &&
      task.supervisor?.toString() !== userId
    ) {
      res.status(403).json({ error: 'Sem permissão para atualizar esta tarefa' });
      return;
    }

    const wasCompleted = task.status === TaskStatus.COMPLETED;
    Object.assign(task, {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : task.dueDate,
    });

    // Se mudou para completed, registrar timestamp e atribuir pontos
    if (data.status === TaskStatus.COMPLETED && !wasCompleted) {
      task.completedAt = new Date();

      // Atribuir pontos ao utilizador que completou
      const pointsUserId = task.assignedTo?.toString() || userId;
      
      if (pointsUserId) {
        // Se a tarefa tem pontos definidos, usar esses pontos
        // Caso contrário, usar a configuração padrão
        let finalPoints = 0;
        
        if (task.points && task.points > 0) {
          // Usar os pontos definidos na tarefa
          finalPoints = task.points;
        } else {
          // Buscar utilizador para obter departamento
          const user = await User.findById(task.assignedTo || task.createdBy);
          const department = user?.department;

          // Buscar pontos configurados para completar tarefa
          const basePoints = await getPointsConfig('task_completed', department);
          
          // Aplicar multiplicadores baseados na prioridade
          const priorityMultiplier: Record<string, number> = {
            low: 0.8,
            medium: 1.0,
            high: 1.5,
          };
          
          finalPoints = Math.round(
            basePoints * (priorityMultiplier[task.priority] || 1.0)
          );
        }

        // Atualizar streak de tarefas diárias (sempre que uma tarefa é completada)
        await updateStreak({
          userId: pointsUserId,
          type: 'daily_tasks',
        });

        // Atualizar progresso de desafios de equipa
        const userTeamMemberships = await TeamMember.find({
          user: pointsUserId,
          active: true,
        }).lean();

        for (const membership of userTeamMemberships) {
          // Buscar desafios ativos da equipa
          const { Team } = await import('../models');
          const team = await Team.findById(membership.team).lean();
          if (team && team.activeChallenges && team.activeChallenges.length > 0) {
            for (const challengeId of team.activeChallenges) {
              await updateTeamChallengeProgress(
                challengeId.toString(),
                membership.team.toString(),
                'task_completed',
                1
              );
            }
          }
        }

        // Atribuir pontos apenas se houver pontos para atribuir
        if (finalPoints > 0) {
          await awardPoints({
            userId: pointsUserId,
            amount: finalPoints,
            source: 'task_completed',
            description: `Tarefa completada: ${task.title}`,
            metadata: {
              taskId: task._id.toString(),
              priority: task.priority,
              points: finalPoints,
              taskPoints: task.points,
            },
          });
        }
      }
    }

    await task.save();
    await task.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'supervisor', select: 'name email' },
    ]);

    res.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
};

/**
 * DELETE /api/tasks/:id - Remove tarefa
 */
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404).json({ error: 'Tarefa não encontrada' });
      return;
    }

    // Apenas criador pode deletar
    if (task.createdBy.toString() !== userId) {
      res.status(403).json({ error: 'Sem permissão para deletar esta tarefa' });
      return;
    }

    await Task.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar tarefa' });
  }
};

