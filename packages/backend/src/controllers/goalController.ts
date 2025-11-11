import { Response } from 'express';
import { Goal } from '../models';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const createGoalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['individual', 'team']),
  target: z.number().int().min(1),
  unit: z.string().default('unidades'),
  dueDate: z.string().datetime().optional(),
  participants: z.array(z.string()).optional(),
  milestones: z
    .array(
      z.object({
        target: z.number().int().min(1),
        reward: z.string(),
      })
    )
    .optional(),
});

const updateGoalSchema = createGoalSchema.partial().extend({
  currentProgress: z.number().int().min(0).optional(),
  status: z.enum(['active', 'completed', 'cancelled']).optional(),
});

export const getGoals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const { type, status } = req.query;

    const query: Record<string, unknown> = {};

    if (type) {
      query.type = type;
    }
    if (status) {
      query.status = status;
    }

    // Filtrar por participante ou criador
    const goals = await Goal.find({
      ...query,
      $or: [{ createdBy: userId }, { participants: userId }],
    })
      .populate('createdBy', 'name email avatar')
      .populate('participants', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();

    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar metas' });
  }
};

export const getGoalById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const goal = await Goal.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('participants', 'name email avatar')
      .lean();

    if (!goal) {
      res.status(404).json({ error: 'Meta não encontrada' });
      return;
    }

    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar meta' });
  }
};

export const createGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createGoalSchema.parse(req.body);
    const userId = req.user?._id?.toString();

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const goal = new Goal({
      ...data,
      createdBy: userId,
      currentProgress: 0,
      status: 'active',
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      participants: data.participants || [],
      milestones: data.milestones || [],
    });

    await goal.save();
    await goal.populate([
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'participants', select: 'name email avatar' },
    ]);

    res.status(201).json(goal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'Erro ao criar meta' });
  }
};

export const updateGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = updateGoalSchema.parse(req.body);
    const userId = req.user?._id?.toString();

    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      res.status(404).json({ error: 'Meta não encontrada' });
      return;
    }

    // Verificar permissões
    if (goal.createdBy.toString() !== userId) {
      res.status(403).json({ error: 'Sem permissão para atualizar esta meta' });
      return;
    }

    Object.assign(goal, {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : goal.dueDate,
    });

    // Verificar se completou
    if (goal.currentProgress >= goal.target && goal.status === 'active') {
      goal.status = 'completed';
      goal.completedAt = new Date();
    }

    await goal.save();
    await goal.populate([
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'participants', select: 'name email avatar' },
    ]);

    res.json(goal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'Erro ao atualizar meta' });
  }
};

export const deleteGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      res.status(404).json({ error: 'Meta não encontrada' });
      return;
    }

    if (goal.createdBy.toString() !== userId) {
      res.status(403).json({ error: 'Sem permissão para deletar esta meta' });
      return;
    }

    await Goal.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar meta' });
  }
};

