import { Response } from 'express';
import { Reward, RewardRedemption } from '../models';
import { addTransaction, getBalance } from '../services/currencyService';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const redeemRewardSchema = z.object({
  quantity: z.number().int().min(1).default(1),
});

/**
 * GET /api/gamification/rewards - Lista recompensas disponíveis
 */
export const getRewards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, type, active } = req.query;

    const query: Record<string, unknown> = {};

    if (category) {
      query.category = category;
    }
    if (type) {
      query.type = type;
    }
    if (active !== undefined) {
      query.active = active === 'true';
    } else {
      query.active = true; // Por padrão, mostrar apenas ativas
    }

    const rewards = await Reward.find(query).sort({ cost: 1, createdAt: -1 }).lean();

    res.json(rewards);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar recompensas' });
  }
};

/**
 * GET /api/gamification/rewards/:id - Busca recompensa por ID
 */
export const getRewardById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reward = await Reward.findById(req.params.id).lean();

    if (!reward) {
      res.status(404).json({ error: 'Recompensa não encontrada' });
      return;
    }

    res.json(reward);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar recompensa' });
  }
};

/**
 * POST /api/gamification/rewards/:id/redeem - Resgatar recompensa
 */
export const redeemReward = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const rewardId = req.params.id;
    const data = redeemRewardSchema.parse(req.body);

    const reward = await Reward.findById(rewardId);
    if (!reward) {
      res.status(404).json({ error: 'Recompensa não encontrada' });
      return;
    }

    if (!reward.active) {
      res.status(400).json({ error: 'Recompensa não está disponível' });
      return;
    }

    // Verificar stock (se aplicável)
    if (reward.stock !== undefined && reward.stock < data.quantity) {
      res.status(400).json({ error: 'Stock insuficiente' });
      return;
    }

    // Verificar saldo de moeda virtual
    const balance = await getBalance(userId);
    const totalCost = reward.cost * data.quantity;

    if (balance < totalCost) {
      res.status(400).json({
        error: 'Saldo insuficiente',
        balance,
        required: totalCost,
      });
      return;
    }

    // Criar resgate
    const redemption = new RewardRedemption({
      user: userId,
      reward: rewardId,
      quantity: data.quantity,
      status: 'pending',
    });

    await redemption.save();

    // Deduzir moeda virtual usando o serviço
    const { newBalance } = await addTransaction({
      userId,
      type: 'spend',
      amount: totalCost,
      source: 'reward_redemption',
      description: `Resgate: ${reward.name} (x${data.quantity})`,
      metadata: { redemptionId: redemption._id.toString(), rewardId },
    });

    // Atualizar stock (se aplicável)
    if (reward.stock !== undefined) {
      reward.stock -= data.quantity;
      await reward.save();
    }

    await redemption.populate('reward');
    await redemption.populate('user', 'name email avatar');

    res.status(201).json({
      success: true,
      redemption,
      newBalance,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'Erro ao resgatar recompensa' });
  }
};

/**
 * GET /api/gamification/rewards/redemptions - Histórico de resgates do utilizador
 */
export const getRedemptions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { status, limit = 50 } = req.query;

    const query: Record<string, unknown> = { user: userId };
    if (status) {
      query.status = status;
    }

    const redemptions = await RewardRedemption.find(query)
      .populate('reward')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .lean();

    res.json(redemptions);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar histórico de resgates' });
  }
};

