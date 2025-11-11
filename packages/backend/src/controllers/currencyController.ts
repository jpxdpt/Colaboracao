import { Response } from 'express';
import {
  getBalance,
  getTransactionHistory,
  convertPointsToCurrency,
  hasSufficientBalance,
} from '../services/currencyService';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const convertPointsSchema = z.object({
  points: z.number().int().min(1),
  rate: z.number().min(1).optional(),
});

/**
 * GET /api/gamification/currency - Saldo atual
 */
export const getCurrencyBalance = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const balance = await getBalance(userId);
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar saldo' });
  }
};

/**
 * GET /api/gamification/currency/history - Histórico de transações
 */
export const getCurrencyHistory = async (
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
    const history = await getTransactionHistory(userId, limit);

    if (!history) {
      res.json({ balance: 0, transactions: [] });
      return;
    }

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
};

/**
 * POST /api/gamification/currency/convert - Converter pontos em moeda
 */
export const convertPoints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const data = convertPointsSchema.parse(req.body);
    const result = await convertPointsToCurrency(
      userId,
      data.points,
      data.rate
    );

    res.json({
      success: true,
      currencyEarned: result.currencyEarned,
      newBalance: result.currency.balance,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao converter pontos',
    });
  }
};

