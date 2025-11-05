import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import { AuthRequest, requireAdmin, authenticateToken } from '../middleware/auth.js';
import { io } from '../server.js';
import { logActivity } from '../utils/activityLogger.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// GET /api/tasks - Listar tarefas com filtros avançados
router.get(
  '/',
  authenticateToken,
  [
    query('status').optional().isIn(['pending', 'in_progress', 'completed']),
    query('priority').optional().isIn(['low', 'medium', 'high']),
    query('assigned_to').optional().isString(),
    query('tags').optional().isString(),
    query('search').optional().isString(),
    query('parent_task_id').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, priority, assigned_to, tags, search, parent_task_id } = req.query;
      const user = req.user!;

      // Construir query MongoDB
      const queryFilter: any = {};

      // User comum só vê suas tarefas (assigned_to é agora um array)
      if (user.role !== 'admin') {
        queryFilter.assigned_to = { $in: [new Types.ObjectId(user.userId)] };
      }

      // Filtros opcionais
      if (status) {
        queryFilter.status = status;
      }

      if (priority) {
        queryFilter.priority = priority;
      }

      if (assigned_to && user.role === 'admin') {
        queryFilter.assigned_to = { $in: [new Types.ObjectId(assigned_to as string)] };
      }

      if (tags) {
        const tagArray = (tags as string).split(',');
        queryFilter.tags = { $in: tagArray };
      }

      if (search) {
        queryFilter.$or = [
          { title: { $regex: search as string, $options: 'i' } },
          { description: { $regex: search as string, $options: 'i' } },
        ];
      }

      if (parent_task_id) {
        queryFilter.parent_task_id = new Types.ObjectId(parent_task_id as string);
      } else {
        // Por padrão, mostrar apenas tarefas principais (sem parent)
        queryFilter.parent_task_id = null;
      }

      const tasks = await Task.find(queryFilter)
        .populate('assigned_to', 'name email')
        .populate('created_by', 'name email')
        .populate('parent_task_id', 'title')
        .sort({ created_at: -1 })
        .lean();

      // Formatar resposta
      const formattedTasks = tasks.map((task: any) => {
        const assignedToArray = Array.isArray(task.assigned_to) ? task.assigned_to : [];
        const assignedUsers = assignedToArray
          .filter((user: any) => user && user._id)
          .map((user: any) => ({
            id: user._id.toString(),
            name: user.name,
            email: user.email,
          }));

        return {
          id: task._id.toString(),
          title: task.title,
          description: task.description,
          assigned_to: assignedUsers.map((u: any) => u.id),
          created_by: task.created_by._id.toString(),
          status: task.status,
          priority: task.priority,
          deadline: task.deadline || null,
          start_date: task.start_date || null,
          tags: task.tags || [],
          parent_task_id: task.parent_task_id?._id?.toString() || null,
          created_at: task.created_at,
          updated_at: task.updated_at,
          assigned_users: assignedUsers,
          assigned_user: assignedUsers.length > 0 ? assignedUsers[0] : undefined, // Para compatibilidade
          created_by_user: task.created_by
            ? {
                id: task.created_by._id.toString(),
                name: task.created_by.name,
                email: task.created_by.email,
              }
            : undefined,
          parent_task: task.parent_task_id
            ? {
                id: task.parent_task_id._id.toString(),
                title: task.parent_task_id.title,
              }
            : undefined,
        };
      });

      res.json({ tasks: formattedTasks });
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({ error: 'Erro ao buscar tarefas' });
    }
  }
);

// GET /api/tasks/:id - Obter tarefa específica com histórico
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const taskId = req.params.id;
    const user = req.user!;

    if (!Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const task = await Task.findById(taskId)
      .populate('assigned_to', 'name email')
      .populate('created_by', 'name email')
      .populate('parent_task_id', 'title')
      .lean();

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    // Verificar permissões
    if (
      user.role !== 'admin' &&
      task.assigned_to?._id?.toString() !== user.userId &&
      task.created_by._id.toString() !== user.userId
    ) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Buscar comentários
    const comments = await Comment.find({ task_id: taskId })
      .populate('user_id', 'name email')
      .sort({ created_at: 1 })
      .lean();

    // Buscar histórico de atividades
    const { getActivityLogs } = await import('../utils/activityLogger.js');
    const activityLogs = await getActivityLogs(taskId);

    // Buscar subtarefas
    const subtasks = await Task.find({ parent_task_id: taskId })
      .populate('assigned_to', 'name email')
      .sort({ created_at: 1 })
      .lean();

    const assignedToArray = Array.isArray(task.assigned_to) ? task.assigned_to : [];
    const assignedUsers = assignedToArray
      .filter((user: any) => user && user._id)
      .map((user: any) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      }));

    const formattedTask = {
        id: task._id.toString(),
        title: task.title,
        description: task.description,
        assigned_to: assignedUsers.map((u: any) => u.id),
        created_by: task.created_by._id.toString(),
        status: task.status,
        priority: task.priority,
        deadline: task.deadline || null,
        start_date: task.start_date || null,
        tags: task.tags || [],
        parent_task_id: task.parent_task_id?._id?.toString() || null,
        created_at: task.created_at,
        updated_at: task.updated_at,
        assigned_users: assignedUsers,
        assigned_user: assignedUsers.length > 0 ? assignedUsers[0] : undefined, // Para compatibilidade
        created_by_user: {
          id: task.created_by._id.toString(),
          name: task.created_by.name,
          email: task.created_by.email,
        },
      parent_task: task.parent_task_id
        ? {
            id: task.parent_task_id._id.toString(),
            title: task.parent_task_id.title,
          }
        : undefined,
      comments: comments.map((c: any) => ({
        id: c._id.toString(),
        task_id: c.task_id.toString(),
        user_id: c.user_id._id.toString(),
        content: c.content,
        created_at: c.created_at,
        user_name: c.user_id.name,
        user_email: c.user_id.email,
      })),
      activity_logs: activityLogs,
      subtasks: subtasks.map((st: any) => ({
        id: st._id.toString(),
        title: st.title,
        status: st.status,
        priority: st.priority,
        assigned_to: st.assigned_to?._id?.toString() || null,
      })),
    };

    res.json({ task: formattedTask });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefa' });
  }
});

// POST /api/tasks - Criar tarefa (todos os utilizadores autenticados podem criar)
router.post(
  '/',
  authenticateToken,
  [
    body('title').trim().notEmpty().withMessage('Título é obrigatório'),
    body('description').optional().trim(),
    body('assigned_to').optional().custom((value) => {
      if (Array.isArray(value)) {
        return value.every((id) => typeof id === 'string');
      }
      return typeof value === 'string' || value === undefined;
    }),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('deadline').optional().isISO8601(),
    body('start_date').optional().isISO8601(),
    body('tags').optional().isArray(),
    body('parent_task_id').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        title,
        description,
        assigned_to,
        priority,
        deadline,
        start_date,
        tags,
        parent_task_id,
      } = req.body;
      const created_by = req.user!.userId;

      // Verificar se parent_task existe se fornecido
      if (parent_task_id && !Types.ObjectId.isValid(parent_task_id)) {
        return res.status(400).json({ error: 'ID da tarefa pai inválido' });
      }

      const taskData: any = {
        title,
        description: description || null,
        created_by: new Types.ObjectId(created_by),
        priority: priority || 'medium',
        tags: tags || [],
      };

      if (assigned_to) {
        // Suporta tanto array quanto string única (para compatibilidade)
        if (Array.isArray(assigned_to)) {
          taskData.assigned_to = assigned_to.map((id: string) => new Types.ObjectId(id));
        } else {
          taskData.assigned_to = [new Types.ObjectId(assigned_to)];
        }
      } else {
        taskData.assigned_to = [];
      }

      if (deadline) {
        taskData.deadline = new Date(deadline);
      }

      if (start_date) {
        taskData.start_date = new Date(start_date);
      }

      if (parent_task_id) {
        taskData.parent_task_id = new Types.ObjectId(parent_task_id);
      }

      const task = await Task.create(taskData);

      // Log de atividade
      await logActivity({
        taskId: task._id.toString(),
        userId: created_by,
        action: 'created',
      });

      // Notificações para utilizadores atribuídos
      if (taskData.assigned_to && taskData.assigned_to.length > 0 && io) {
        const assignedUserIds = Array.isArray(taskData.assigned_to) 
          ? taskData.assigned_to 
          : [taskData.assigned_to];
        
        for (const userId of assignedUserIds) {
          const notification = await Notification.create({
            user_id: userId,
            task_id: task._id,
            type: 'task_assigned',
            title: 'Nova Tarefa Atribuída',
            message: `Foi atribuída uma nova tarefa: ${title}`,
          });

          io.to(`user-${userId.toString()}`).emit('new-task', {
            task: task.toObject(),
            notification,
          });
        }
      }

      const populatedTask = await Task.findById(task._id)
        .populate('assigned_to', 'name email')
        .populate('created_by', 'name email')
        .populate('parent_task_id', 'title')
        .lean();

      const assignedToArray = Array.isArray(populatedTask!.assigned_to) ? populatedTask!.assigned_to : [];
      const assignedUsers = assignedToArray
        .filter((user: any) => user && user._id)
        .map((user: any) => ({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        }));

      const formattedTask = {
        id: populatedTask!._id.toString(),
        title: populatedTask!.title,
        description: populatedTask!.description,
        assigned_to: assignedUsers.map((u: any) => u.id),
        created_by: populatedTask!.created_by._id.toString(),
        status: populatedTask!.status,
        priority: populatedTask!.priority,
        deadline: populatedTask!.deadline || null,
        start_date: populatedTask!.start_date || null,
        tags: populatedTask!.tags || [],
        parent_task_id: populatedTask!.parent_task_id?._id?.toString() || null,
        created_at: populatedTask!.created_at,
        updated_at: populatedTask!.updated_at,
        assigned_users: assignedUsers,
        assigned_user: assignedUsers.length > 0 ? assignedUsers[0] : undefined, // Para compatibilidade
        created_by_user: {
          id: populatedTask!.created_by._id.toString(),
          name: populatedTask!.created_by.name,
          email: populatedTask!.created_by.email,
        },
      };

      res.status(201).json({ task: formattedTask });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ error: 'Erro ao criar tarefa' });
    }
  }
);

// PUT /api/tasks/:id - Atualizar tarefa
router.put(
  '/:id',
  authenticateToken,
  [
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('assigned_to').optional().custom((value) => {
      if (Array.isArray(value)) {
        return value.every((id) => typeof id === 'string');
      }
      return typeof value === 'string' || value === undefined;
    }),
    body('status').optional().isIn(['pending', 'in_progress', 'completed']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('deadline').optional().isISO8601(),
    body('start_date').optional().isISO8601(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const taskId = req.params.id;
      const user = req.user!;

      if (!Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const existingTask = await Task.findById(taskId);

      if (!existingTask) {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
      }

      // Verificar permissões
      if (user.role !== 'admin') {
        const assignedToArray = Array.isArray(existingTask.assigned_to) 
          ? existingTask.assigned_to.map((id: any) => id.toString())
          : existingTask.assigned_to 
            ? [existingTask.assigned_to.toString()] 
            : [];
        
        if (
          !assignedToArray.includes(user.userId) &&
          existingTask.created_by.toString() !== user.userId
        ) {
          return res.status(403).json({ error: 'Acesso negado' });
        }

        // User comum só pode atualizar status
        const allowedFields = ['status'];
        const updateFields = Object.keys(req.body).filter((key) =>
          allowedFields.includes(key)
        );

        if (updateFields.length === 0) {
          return res.status(403).json({
            error: 'Utilizadores comuns só podem atualizar o status',
          });
        }
      }

      // Preparar atualizações
      const updateData: any = {};
      const oldValues: any = {};

      const allowedFields = [
        'title',
        'description',
        'status',
        'priority',
        'deadline',
        'start_date',
        'tags',
        'assigned_to',
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          oldValues[field] = existingTask.get(field);
          if (field === 'deadline' || field === 'start_date') {
            updateData[field] = req.body[field] ? new Date(req.body[field]) : null;
          } else if (field === 'assigned_to') {
            if (req.body[field]) {
              // Suporta tanto array quanto string única
              if (Array.isArray(req.body[field])) {
                updateData[field] = req.body[field].map((id: string) => new Types.ObjectId(id));
              } else {
                updateData[field] = [new Types.ObjectId(req.body[field])];
              }
            } else {
              updateData[field] = [];
            }
          } else {
            updateData[field] = req.body[field];
          }
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar' });
      }

      // Detectar mudanças específicas para logging
      const statusChanged = updateData.status && updateData.status !== existingTask.status;
      const assignedChanged = updateData.assigned_to && 
        JSON.stringify(updateData.assigned_to.map((id: any) => id.toString()).sort()) !==
        JSON.stringify((Array.isArray(existingTask.assigned_to) 
          ? existingTask.assigned_to.map((id: any) => id.toString())
          : existingTask.assigned_to 
            ? [existingTask.assigned_to.toString()] 
            : []).sort());

      // Atualizar tarefa
      Object.assign(existingTask, updateData);
      await existingTask.save();

      // Log de atividades
      for (const [field, newValue] of Object.entries(updateData)) {
        await logActivity({
          taskId: existingTask._id,
          userId: user.userId,
          action: statusChanged ? 'status_changed' : assignedChanged ? 'assigned' : 'updated',
          field,
          oldValue: oldValues[field],
          newValue,
        });
      }

      // Notificações
      if (statusChanged && io) {
        io.emit('task-status-changed', {
          taskId: existingTask._id.toString(),
          newStatus: updateData.status,
        });
      }

      if (assignedChanged && updateData.assigned_to && io) {
        const assignedUserIds = Array.isArray(updateData.assigned_to)
          ? updateData.assigned_to
          : [updateData.assigned_to];
        
        for (const userId of assignedUserIds) {
          const notification = await Notification.create({
            user_id: userId,
            task_id: existingTask._id,
            type: 'task_assigned',
            title: 'Tarefa Atribuída',
            message: `Foi atribuída a tarefa: ${existingTask.title}`,
          });

          io.to(`user-${userId.toString()}`).emit('task-assigned', {
            task: existingTask.toObject(),
            notification,
          });
        }
      }

      const updatedTask = await Task.findById(existingTask._id)
        .populate('assigned_to', 'name email')
        .populate('created_by', 'name email')
        .populate('parent_task_id', 'title')
        .lean();

      const assignedToArray = Array.isArray(updatedTask!.assigned_to) ? updatedTask!.assigned_to : [];
      const assignedUsers = assignedToArray
        .filter((user: any) => user && user._id)
        .map((user: any) => ({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        }));

      const formattedTask = {
        id: updatedTask!._id.toString(),
        title: updatedTask!.title,
        description: updatedTask!.description,
        assigned_to: assignedUsers.map((u: any) => u.id),
        created_by: updatedTask!.created_by._id.toString(),
        status: updatedTask!.status,
        priority: updatedTask!.priority,
        deadline: updatedTask!.deadline || null,
        start_date: updatedTask!.start_date || null,
        tags: updatedTask!.tags || [],
        parent_task_id: updatedTask!.parent_task_id?._id?.toString() || null,
        created_at: updatedTask!.created_at,
        updated_at: updatedTask!.updated_at,
        assigned_users: assignedUsers,
        assigned_user: assignedUsers.length > 0 ? assignedUsers[0] : undefined,
        created_by_user: {
          id: updatedTask!.created_by._id.toString(),
          name: updatedTask!.created_by.name,
          email: updatedTask!.created_by.email,
        },
      };

      res.json({ task: formattedTask });
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({ error: 'Erro ao atualizar tarefa' });
    }
  }
);

// DELETE /api/tasks/:id - Eliminar tarefa
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const taskId = req.params.id;
    const user = req.user!;

    if (!Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    // Log antes de eliminar
    await logActivity({
      taskId: task._id,
      userId: user.userId,
      action: 'deleted',
    });

    // Eliminar tarefa e subtarefas
    await Task.deleteMany({
      $or: [{ _id: task._id }, { parent_task_id: task._id }],
    });

    // Eliminar comentários relacionados
    await Comment.deleteMany({ task_id: task._id });

    // Notificar via Socket.io
    if (io) {
      io.emit('task-deleted', { taskId });
    }

    res.json({ message: 'Tarefa eliminada com sucesso' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Erro ao eliminar tarefa' });
  }
});

export default router;
