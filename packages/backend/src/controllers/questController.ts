import { Response } from 'express';
import { Quest, QuestProgress } from '../models';
import { z } from 'zod';
import { awardPoints } from '../services/gamificationService';
import { AuthRequest } from '../middleware/auth';

/**
 * GET /api/gamification/quests - Lista quests disponíveis
 */
export const getQuests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const quests = await Quest.find(query)
      .populate('rewards.badges')
      .populate('createdBy', 'name email avatar')
      .populate('prerequisites')
      .sort({ createdAt: -1 })
      .lean();

    res.json(quests);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar quests' });
  }
};

/**
 * GET /api/gamification/quests/:id - Busca quest por ID
 */
export const getQuestById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quest = await Quest.findById(req.params.id)
      .populate('rewards.badges')
      .populate('createdBy', 'name email avatar')
      .populate('prerequisites')
      .lean();

    if (!quest) {
      res.status(404).json({ error: 'Quest não encontrada' });
      return;
    }

    res.json(quest);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar quest' });
  }
};

/**
 * POST /api/gamification/quests/:id/start - Iniciar quest
 */
export const startQuest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const questId = req.params.id;

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const quest = await Quest.findById(questId);
    if (!quest) {
      res.status(404).json({ error: 'Quest não encontrada' });
      return;
    }

    // Verificar se já existe progresso
    const existing = await QuestProgress.findOne({
      quest: questId,
      user: userId,
    });

    if (existing) {
      res.json(existing);
      return;
    }

    // Criar progresso inicial
    const progress = new QuestProgress({
      quest: questId,
      user: userId,
      objectivesProgress: quest.objectives.map((_, index) => ({
        objectiveIndex: index,
        current: 0,
        completed: false,
      })),
      status: 'in-progress',
    });

    await progress.save();
    await progress.populate('quest');

    res.status(201).json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar quest' });
  }
};

/**
 * PUT /api/gamification/quests/:id/progress - Atualizar progresso da quest
 */
export const updateQuestProgress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const questId = req.params.id;
    const { objectiveIndex, current } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const progress = await QuestProgress.findOne({
      quest: questId,
      user: userId,
    });

    if (!progress) {
      res.status(404).json({ error: 'Progresso não encontrado' });
      return;
    }

    // Atualizar objetivo específico
    const objective = progress.objectivesProgress.find(
      (obj) => obj.objectiveIndex === objectiveIndex
    );

    if (objective) {
      objective.current = current;

      // Buscar quest para verificar target
      const quest = await Quest.findById(questId);
      if (quest && quest.objectives[objectiveIndex]) {
        const target = quest.objectives[objectiveIndex].target;
        objective.completed = current >= target;
      }
    }

    // Verificar se todos objetivos estão completos
    const allCompleted = progress.objectivesProgress.every((obj) => obj.completed);

    if (allCompleted && progress.status !== 'completed') {
      progress.status = 'completed';
      progress.completedAt = new Date();

      // Atribuir recompensas
      const quest = await Quest.findById(questId);
      if (quest && quest.rewards) {
        if (quest.rewards.points) {
          await awardPoints({
            userId,
            amount: quest.rewards.points,
            source: 'quest_completed',
            description: `Quest completada: ${quest.title}`,
            metadata: { questId: quest._id.toString() },
          });
        }
      }
    }

    await progress.save();
    await progress.populate('quest');

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar progresso' });
  }
};

