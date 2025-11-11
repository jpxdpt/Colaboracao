import { Response } from 'express';
import { Ranking, Points } from '../models';
import { RankingType } from '@taskify/shared';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * GET /api/gamification/rankings - Lista rankings por tipo
 */
export const getRankings = async (req: AuthRequest, res: Response): Promise<void> => {
  const typeParam = (req.query.type as string) ?? 'weekly';
  const limitParam = (req.query.limit as string) ?? '100';
  const limitNum = parseInt(limitParam, 10) || 100;

  try {

    // Calcular período baseado no tipo
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date = now;

    switch (typeParam) {
      case 'weekly':
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all-time':
        periodStart = new Date(0); // Desde sempre
        break;
      default:
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - 7);
    }

    // Buscar rankings do período
    const rankings = await Ranking.find({
      type: typeParam as RankingType,
      periodStart: { $lte: periodEnd },
      periodEnd: { $gte: periodStart },
    })
      .populate('user', 'name email avatar')
      .sort({ position: 1 })
      .limit(limitNum)
      .lean();

    res.json({ rankings, type: typeParam, periodStart, periodEnd });
  } catch (error) {
    logger.error('Erro ao buscar rankings', {
      error: error instanceof Error ? error.message : 'Unknown error',
      type: typeParam,
    });
    res.status(500).json({ error: 'Erro ao buscar rankings' });
  }
};

/**
 * GET /api/gamification/rankings/user - Posição do utilizador atual
 */
export const getUserRanking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const typeParam = (req.query.type as string) ?? 'weekly';

    // Calcular período
    const now = new Date();
    let periodStart: Date;

    switch (typeParam) {
      case 'weekly':
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all-time':
        periodStart = new Date(0);
        break;
      default:
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - 7);
    }

    // Buscar ranking do utilizador
    const ranking = await Ranking.findOne({
      type: typeParam as RankingType,
      user: userId,
      periodStart: { $lte: now },
      periodEnd: { $gte: periodStart },
    })
      .populate('user', 'name email avatar')
      .sort({ periodStart: -1 })
      .lean();

    if (!ranking) {
      // Se não há ranking calculado, calcular pontos do período
      const points = await Points.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            timestamp: { $gte: periodStart, $lte: now },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const totalPoints = points[0]?.total || 0;

      // Contar quantos utilizadores têm mais pontos
      const usersWithMorePoints = await Points.aggregate([
        {
          $match: {
            timestamp: { $gte: periodStart, $lte: now },
          },
        },
        {
          $group: {
            _id: '$user',
            total: { $sum: '$amount' },
          },
        },
        {
          $match: {
            total: { $gt: totalPoints },
          },
        },
        {
          $count: 'count',
        },
      ]);

      const position = (usersWithMorePoints[0]?.count || 0) + 1;

      res.json({
        position,
        points: totalPoints,
        type: typeParam,
        periodStart,
        periodEnd: now,
      });
      return;
    }

    res.json(ranking);
  } catch (error) {
    logger.error('Erro ao buscar ranking do utilizador', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?._id,
      type: req.query.type
    });
    res.status(500).json({ error: 'Erro ao buscar ranking do utilizador' });
  }
};

/**
 * GET /api/gamification/rankings/top - Top N utilizadores
 */
export const getTopRankings = async (req: AuthRequest, res: Response): Promise<void> => {
  const typeParam = (req.query.type as string) ?? 'weekly';
  const limitParam = (req.query.limit as string) ?? '10';
  const limitNum = parseInt(limitParam, 10) || 10;

  try {

    const now = new Date();
    let periodStart: Date;

    switch (typeParam) {
      case 'weekly':
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all-time':
        periodStart = new Date(0);
        break;
      default:
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - 7);
    }

    // Buscar top rankings
    const rankings = await Ranking.find({
      type: typeParam as RankingType,
      periodStart: { $lte: now },
      periodEnd: { $gte: periodStart },
    })
      .populate('user', 'name email avatar')
      .sort({ position: 1 })
      .limit(limitNum)
      .lean();

    res.json({ rankings, type: typeParam, periodStart, periodEnd: now });
  } catch (error) {
    logger.error('Erro ao buscar top rankings', {
      error: error instanceof Error ? error.message : 'Unknown error',
      type: typeParam,
      limit: limitNum,
    });
    res.status(500).json({ error: 'Erro ao buscar top rankings' });
  }
};

