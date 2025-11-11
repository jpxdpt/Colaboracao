import { Response } from 'express';
import { Training, TrainingProgress } from '../models';
import { z } from 'zod';
import { awardPoints } from '../services/gamificationService';
import { updateStreak } from '../services/streakService';
import { AuthRequest } from '../middleware/auth';
import { escapeRegex } from '../utils/logger';
import { mongoIdSchema } from '@taskify/shared';

const createTrainingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  category: z.string().min(1),
  content: z.object({
    type: z.enum(['text', 'video', 'quiz']),
    data: z.unknown(),
  }),
  estimatedDuration: z.number().int().min(1),
  pointsOnCompletion: z.number().int().min(0).default(0),
  relatedBadges: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
});

/**
 * GET /api/training - Lista formações disponíveis
 */
export const getTrainings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, search, active } = req.query;

    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (active !== undefined) query.active = active === 'true';

    if (search) {
      const safeSearch = escapeRegex(search as string);
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const trainings = await Training.find(query)
      .populate('relatedBadges')
      .populate('prerequisites')
      .sort({ createdAt: -1 })
      .lean();

    res.json(trainings);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar formações' });
  }
};

/**
 * GET /api/training/:id - Busca formação por ID
 */
export const getTrainingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: mongoIdSchema }).parse(req.params);
    const training = await Training.findById(id)
      .populate('relatedBadges')
      .populate('prerequisites')
      .lean();

    if (!training) {
      res.status(404).json({ error: 'Formação não encontrada' });
      return;
    }

    res.json(training);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar formação' });
  }
};

/**
 * GET /api/training/progress - Progresso do utilizador
 */
export const getTrainingProgress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const progress = await TrainingProgress.find({ user: userId })
      .populate('training')
      .sort({ lastActivity: -1 })
      .lean();

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar progresso' });
  }
};

/**
 * POST /api/training/:id/start - Iniciar formação
 */
export const startTraining = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: mongoIdSchema }).parse(req.params);
    const userId = req.user?._id?.toString();
    const trainingId = id;

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    // Verificar se já existe progresso
    const existing = await TrainingProgress.findOne({
      user: userId,
      training: trainingId,
    });

    if (existing) {
      res.json(existing);
      return;
    }

    // Criar novo progresso
    const progress = new TrainingProgress({
      user: userId,
      training: trainingId,
      progress: 0,
      completedModules: [],
      completed: false,
      certificateIssued: false,
      pointsEarned: 0,
    });

    await progress.save();
    await progress.populate('training');

    res.status(201).json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar formação' });
  }
};

/**
 * PUT /api/training/:id/progress - Atualizar progresso
 */
export const updateTrainingProgress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = z.object({ id: mongoIdSchema }).parse(req.params);
    const userId = req.user?._id?.toString();
    const trainingId = id;
    const { progress, completedModules } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const trainingProgress = await TrainingProgress.findOne({
      user: userId,
      training: trainingId,
    });

    if (!trainingProgress) {
      res.status(404).json({ error: 'Progresso não encontrado' });
      return;
    }

    const wasCompleted = trainingProgress.completed;

    trainingProgress.progress = Math.min(100, Math.max(0, progress || trainingProgress.progress));
    trainingProgress.completedModules = completedModules || trainingProgress.completedModules;
    trainingProgress.lastActivity = new Date();

    // Verificar se completou
    if (trainingProgress.progress >= 100 && !wasCompleted) {
      trainingProgress.completed = true;
      trainingProgress.completedAt = new Date();

      // Buscar training para obter pontos
      const training = await Training.findById(trainingId);
      if (training) {
        const points = training.pointsOnCompletion;
        trainingProgress.pointsEarned = points;

        // Atribuir pontos
        if (points > 0) {
          await awardPoints({
            userId,
            amount: points,
            source: 'training_completed',
            description: `Formação completada: ${training.title}`,
            metadata: { trainingId: training._id.toString() },
          });
        }

        // Atualizar streak de formação
        await updateStreak({
          userId,
          type: 'training',
        });
      }
    }

    await trainingProgress.save();
    await trainingProgress.populate('training');

    res.json(trainingProgress);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar progresso' });
  }
};

