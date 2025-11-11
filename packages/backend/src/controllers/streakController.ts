import { Response } from 'express';
import {
  getCurrentStreak,
  getUserStreaks,
  isStreakAtRisk,
} from '../services/streakService';
import { AuthRequest } from '../middleware/auth';

/**
 * GET /api/gamification/streaks - Lista todos os streaks do utilizador
 */
export const getUserStreaksHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const streaks = await getUserStreaks(userId);
    res.json(streaks);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar streaks' });
  }
};

/**
 * GET /api/gamification/streaks/:type - Busca streak específico
 */
export const getStreakByType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const { type } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const streak = await getCurrentStreak(userId, type);
    if (!streak) {
      res.json({ consecutiveDays: 0, longestStreak: 0, type });
      return;
    }

    // Verificar se está em risco
    const atRisk = await isStreakAtRisk(userId, type);

    res.json({
      ...streak.toObject(),
      atRisk,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar streak' });
  }
};

