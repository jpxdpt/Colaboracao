import { Response } from 'express';
import { Task, User } from '../models';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { UserRole } from '@gamify/shared';

interface TaskTemplate {
  name: string;
  department: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  points: number;
  dueDateDays: number; // Dias até o prazo a partir da criação
}

/**
 * GET /api/tasks/templates - Lista modelos de tarefa por departamento
 */
export const getTaskTemplates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { department } = req.query;

    // Templates pré-definidos por departamento
    const templates: TaskTemplate[] = [];

    if (!department || department === 'IT') {
      templates.push(
        {
          name: 'Code Review',
          department: 'IT',
          title: 'Revisar código',
          description: 'Revisar código de pull request',
          priority: 'high',
          points: 50,
          dueDateDays: 1,
        },
        {
          name: 'Bug Fix',
          department: 'IT',
          title: 'Corrigir bug',
          description: 'Identificar e corrigir bug reportado',
          priority: 'high',
          points: 75,
          dueDateDays: 2,
        },
        {
          name: 'Documentation',
          department: 'IT',
          title: 'Atualizar documentação',
          description: 'Atualizar documentação técnica',
          priority: 'medium',
          points: 30,
          dueDateDays: 5,
        }
      );
    }

    if (!department || department === 'Marketing') {
      templates.push(
        {
          name: 'Campaign Analysis',
          department: 'Marketing',
          title: 'Analisar campanha',
          description: 'Analisar resultados da campanha de marketing',
          priority: 'medium',
          points: 40,
          dueDateDays: 3,
        },
        {
          name: 'Content Creation',
          department: 'Marketing',
          title: 'Criar conteúdo',
          description: 'Criar novo conteúdo para redes sociais',
          priority: 'medium',
          points: 35,
          dueDateDays: 2,
        }
      );
    }

    if (!department || department === 'Sales') {
      templates.push(
        {
          name: 'Client Follow-up',
          department: 'Sales',
          title: 'Follow-up com cliente',
          description: 'Fazer follow-up com cliente potencial',
          priority: 'high',
          points: 50,
          dueDateDays: 1,
        },
        {
          name: 'Sales Report',
          department: 'Sales',
          title: 'Relatório de vendas',
          description: 'Preparar relatório semanal de vendas',
          priority: 'medium',
          points: 40,
          dueDateDays: 7,
        }
      );
    }

    // Filtrar por departamento se especificado
    const filteredTemplates = department
      ? templates.filter((t) => t.department === department)
      : templates;

    res.json({
      success: true,
      data: filteredTemplates,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar modelos de tarefa' });
  }
};

/**
 * POST /api/tasks/templates/:templateName - Criar tarefa a partir de modelo
 */
export const createTaskFromTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new AppError('Não autenticado', 401);
    }

    const templateName = req.params.templateName;
    const { assignedTo, customizations } = req.body;

    // Buscar template (em produção, isso viria do banco de dados)
    const templates = await getTaskTemplatesData();
    const template = templates.find((t) => t.name === templateName);

    if (!template) {
      throw new AppError('Modelo não encontrado', 404);
    }

    // Verificar se utilizador pertence ao departamento ou é admin
    const user = await User.findById(userId).lean();
    if (user?.role !== UserRole.ADMIN && user?.department !== template.department) {
      throw new AppError('Não tem permissão para usar este modelo', 403);
    }

    // Criar tarefa baseada no modelo
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + template.dueDateDays);

    const task = new Task({
      title: customizations?.title || template.title,
      description: customizations?.description || template.description,
      priority: customizations?.priority || template.priority,
      points: customizations?.points || template.points,
      dueDate: customizations?.dueDate || dueDate,
      assignedTo: assignedTo || userId,
      createdBy: userId,
      status: 'pending',
    });

    await task.save();
    await task.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
    ]);

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Erro ao criar tarefa a partir do modelo' });
  }
};

/**
 * Helper para obter templates (em produção, viria do banco de dados)
 */
const getTaskTemplatesData = (): TaskTemplate[] => {
  return [
    {
      name: 'Code Review',
      department: 'IT',
      title: 'Revisar código',
      description: 'Revisar código de pull request',
      priority: 'high',
      points: 50,
      dueDateDays: 1,
    },
    {
      name: 'Bug Fix',
      department: 'IT',
      title: 'Corrigir bug',
      description: 'Identificar e corrigir bug reportado',
      priority: 'high',
      points: 75,
      dueDateDays: 2,
    },
    {
      name: 'Documentation',
      department: 'IT',
      title: 'Atualizar documentação',
      description: 'Atualizar documentação técnica',
      priority: 'medium',
      points: 30,
      dueDateDays: 5,
    },
    {
      name: 'Campaign Analysis',
      department: 'Marketing',
      title: 'Analisar campanha',
      description: 'Analisar resultados da campanha de marketing',
      priority: 'medium',
      points: 40,
      dueDateDays: 3,
    },
    {
      name: 'Content Creation',
      department: 'Marketing',
      title: 'Criar conteúdo',
      description: 'Criar novo conteúdo para redes sociais',
      priority: 'medium',
      points: 35,
      dueDateDays: 2,
    },
    {
      name: 'Client Follow-up',
      department: 'Sales',
      title: 'Follow-up com cliente',
      description: 'Fazer follow-up com cliente potencial',
      priority: 'high',
      points: 50,
      dueDateDays: 1,
    },
    {
      name: 'Sales Report',
      department: 'Sales',
      title: 'Relatório de vendas',
      description: 'Preparar relatório semanal de vendas',
      priority: 'medium',
      points: 40,
      dueDateDays: 7,
    },
  ];
};

