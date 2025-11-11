import { Response } from 'express';
import { getUserKPIs } from '../services/kpiService';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

/**
 * GET /api/kpis - KPIs do utilizador
 */
export const getUserKPIsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const kpis = await getUserKPIs(userId);
    res.json(kpis);
  } catch (error) {
    logger.error('Erro ao buscar KPIs do utilizador', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?._id
    });
    res.status(500).json({ error: 'Erro ao buscar KPIs' });
  }
};

