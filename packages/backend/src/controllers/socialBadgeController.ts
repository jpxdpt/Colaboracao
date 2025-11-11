import { Response } from 'express';
import { Badge, UserBadge, PeerRecognition, User } from '../models';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

/**
 * GET /api/gamification/badges/social - Lista badges sociais disponíveis
 */
export const getSocialBadges = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const badges = await Badge.find({ socialBadge: true })
      .sort({ rarity: 1, name: 1 })
      .lean();

    res.json({
      success: true,
      data: badges,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar badges sociais' });
  }
};

/**
 * POST /api/gamification/badges/:badgeId/give - Dar badge social a outro utilizador
 */
export const giveSocialBadge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const badgeId = req.params.badgeId;
    const { toUserId, message } = req.body;

    if (!userId) {
      throw new AppError('Não autenticado', 401);
    }

    if (!toUserId) {
      throw new AppError('ID do utilizador destinatário é obrigatório', 400);
    }

    if (toUserId === userId) {
      throw new AppError('Não pode dar badge a si mesmo', 400);
    }

    // Verificar se badge é social
    const badge = await Badge.findById(badgeId);
    if (!badge) {
      throw new AppError('Badge não encontrado', 404);
    }

    if (!badge.socialBadge) {
      throw new AppError('Este badge não é um badge social', 400);
    }

    // Verificar se já deu este badge hoje (limite de 1 por dia)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingBadge = await UserBadge.findOne({
      user: toUserId,
      badge: badgeId,
      earnedAt: { $gte: today },
    });

    if (existingBadge) {
      throw new AppError('Já deu este badge hoje. Tente novamente amanhã.', 400);
    }

    // Criar user badge
    const userBadge = new UserBadge({
      user: toUserId,
      badge: badgeId,
      earnedAt: new Date(),
    });

    await userBadge.save();

    // Criar reconhecimento associado
    if (message) {
      const recognition = new PeerRecognition({
        from: userId,
        to: toUserId,
        type: 'appreciation',
        message: message || `Badge "${badge.name}" recebido`,
        public: true,
      });
      await recognition.save();
    }

    // Atribuir pontos ao destinatário
    const badgePoints = getBadgePoints(badge.rarity);
    if (badgePoints > 0) {
      const { awardPoints } = await import('../services/gamificationService');
      await awardPoints({
        userId: toUserId,
        amount: badgePoints,
        source: 'social_badge',
        description: `Badge social recebido: ${badge.name}`,
        metadata: {
          badgeId: badgeId,
          from: userId,
        },
      });
    }

    await userBadge.populate('badge');
    await userBadge.populate('user', 'name email avatar');

    res.status(201).json({
      success: true,
      data: userBadge,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Erro ao dar badge social' });
  }
};

/**
 * GET /api/gamification/badges/user/:userId/social - Badges sociais recebidos por um utilizador
 */
export const getUserSocialBadges = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = req.params.userId;

    const userBadges = await UserBadge.find({ user: targetUserId })
      .populate({
        path: 'badge',
        match: { socialBadge: true },
      })
      .lean();

    const socialBadges = userBadges.filter((ub) => ub.badge && (ub.badge as any).socialBadge);

    res.json({
      success: true,
      data: socialBadges,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar badges sociais do utilizador' });
  }
};

const getBadgePoints = (rarity: string): number => {
  const pointsMap: Record<string, number> = {
    common: 10,
    rare: 50,
    epic: 150,
    legendary: 500,
  };
  return pointsMap[rarity] || 0;
};

