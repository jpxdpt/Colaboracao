import { Response } from 'express';
import {
  awardPoints,
  getTotalPoints,
  getLevelProgress,
  getPointsHistory,
  getUserBadges,
} from '../services/gamificationService';
import { Badge, Level, GamificationConfig } from '../models';
import { AuthRequest } from '../middleware/auth';

/**
 * GET /api/gamification/points - Pontos totais do utilizador
 */
export const getUserPoints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const total = await getTotalPoints(userId);
    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pontos' });
  }
};

/**
 * GET /api/gamification/points/history - Histórico de pontos
 */
export const getPointsHistoryHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const history = await getPointsHistory(userId, limit);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar histórico de pontos' });
  }
};

/**
 * GET /api/gamification/badges - Lista todos os badges disponíveis
 */
export const getAllBadges = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const badges = await Badge.find().populate('criteria').lean();
    res.json(badges);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar badges' });
  }
};

/**
 * GET /api/gamification/badges/user - Badges do utilizador
 */
export const getUserBadgesHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const badges = await getUserBadges(userId);
    res.json(badges);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar badges do utilizador' });
  }
};

/**
 * GET /api/gamification/levels - Lista todos os níveis
 */
export const getAllLevels = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const levels = await Level.find().sort({ level: 1 }).lean();
    res.json(levels);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar níveis' });
  }
};

/**
 * GET /api/gamification/levels/progress - Progresso do utilizador
 */
export const getLevelProgressHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const progress = await getLevelProgress(userId);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar progresso de nível' });
  }
};

/**
 * GET /api/gamification/config - Configurações de gamificação (admin)
 */
export const getGamificationConfig = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const configs = await GamificationConfig.find().lean();
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
};

