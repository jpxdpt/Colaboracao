import { Points, Badge, UserBadge, BadgeCriteria, Level, GamificationConfig, User } from '../models';
import mongoose from 'mongoose';

/**
 * Serviço de gamificação - gerencia pontos, badges, níveis e rankings
 */

interface AwardPointsParams {
  userId: string;
  amount: number;
  source: string;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Atribui pontos a um utilizador
 */
export const awardPoints = async (params: AwardPointsParams): Promise<void> => {
  const { userId, amount, source, description, metadata } = params;

  // Criar registro de pontos
  const pointsRecord = new Points({
    user: userId,
    amount,
    source,
    description,
    metadata,
    timestamp: new Date(),
    audited: false,
  });

  await pointsRecord.save();

  // Verificar badges e nível após atribuir pontos
  await checkBadges(userId, source);
  await checkLevelUp(userId);
};

/**
 * Calcula pontos totais de um utilizador
 */
export const getTotalPoints = async (userId: string): Promise<number> => {
  const result = await Points.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  return result[0]?.total || 0;
};

/**
 * Busca configuração de pontos para uma ação/departamento
 */
export const getPointsConfig = async (
  action: string,
  department?: string
): Promise<number> => {
  // Buscar configuração específica do departamento primeiro
  if (department) {
    const deptConfig = await GamificationConfig.findOne({
      department,
      action,
      active: true,
    });

    if (deptConfig) {
      return deptConfig.basePoints;
    }
  }

  // Buscar configuração global
  const globalConfig = await GamificationConfig.findOne({
    department: null,
    action,
    active: true,
  });

  return globalConfig?.basePoints || 0;
};

/**
 * Verifica e atribui badges automaticamente
 */
export const checkBadges = async (userId: string, source?: string): Promise<void> => {
  // Buscar todos os badges ativos
  const badges = await Badge.find().populate('criteria').lean();

  for (const badge of badges) {
    // Verificar se utilizador já tem o badge
    const hasBadge = await UserBadge.findOne({
      user: userId,
      badge: badge._id,
    });

    if (hasBadge) {
      continue;
    }

    // Buscar critério do badge
    const criteria = await BadgeCriteria.findById(badge.criteria);
    if (!criteria) {
      continue;
    }

    // Verificar progresso baseado no tipo de critério
    let progress = 0;

    switch (criteria.type) {
      case 'count':
        // Contar ações do tipo especificado
        progress = await Points.countDocuments({
          user: userId,
          source: criteria.description.split(':')[0] || source,
        });
        break;

      case 'threshold':
        // Verificar pontos totais
        progress = await getTotalPoints(userId);
        break;

      case 'combo':
        // Lógica de combo (ex: completar 5 tarefas em sequência)
        // Implementação simplificada
        progress = await Points.countDocuments({
          user: userId,
          source: criteria.description.split(':')[0] || source,
        });
        break;
    }

    // Atualizar progresso do critério
    criteria.currentProgress = progress;
    await criteria.save();

    // Se atingiu o valor necessário, atribuir badge
    if (progress >= criteria.value) {
      const userBadge = new UserBadge({
        user: userId,
        badge: badge._id,
        earnedAt: new Date(),
      });

      await userBadge.save();

      // Atribuir pontos extras por badge (opcional)
      await awardPoints({
        userId,
        amount: getBadgePoints(badge.rarity),
        source: 'badge_earned',
        description: `Badge conquistado: ${badge.name}`,
        metadata: { badgeId: badge._id.toString() },
      });
    }
  }
};

/**
 * Retorna pontos baseados na raridade do badge
 */
const getBadgePoints = (rarity: string): number => {
  const pointsMap: Record<string, number> = {
    common: 10,
    rare: 50,
    epic: 150,
    legendary: 500,
  };

  return pointsMap[rarity] || 0;
};

/**
 * Verifica e atualiza nível do utilizador
 */
export const checkLevelUp = async (userId: string): Promise<number | null> => {
  const totalPoints = await getTotalPoints(userId);

  // Buscar nível atual do utilizador
  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  // Buscar todos os níveis ordenados
  const levels = await Level.find().sort({ level: 1 }).lean();

  // Encontrar nível atual baseado em pontos
  let currentLevel = 0;
  for (const level of levels) {
    if (totalPoints >= level.pointsRequired) {
      currentLevel = level.level;
    } else {
      break;
    }
  }

  // Se subiu de nível, retornar novo nível
  // Em produção, comparar com nível anterior salvo no utilizador
  return currentLevel;
};

/**
 * Calcula progresso até próximo nível
 */
export const getLevelProgress = async (userId: string): Promise<{
  currentLevel: number;
  nextLevel: number | null;
  pointsCurrent: number;
  pointsNext: number | null;
  progress: number;
}> => {
  const totalPoints = await getTotalPoints(userId);
  const levels = await Level.find().sort({ level: 1 }).lean();

  let currentLevel = 0;
  let nextLevel: typeof levels[0] | null = null;

  for (let i = 0; i < levels.length; i++) {
    if (totalPoints >= levels[i].pointsRequired) {
      currentLevel = levels[i].level;
      nextLevel = levels[i + 1] || null;
    } else {
      if (i === 0) {
        nextLevel = levels[0];
      }
      break;
    }
  }

  const currentLevelData = levels.find((l) => l.level === currentLevel);
  const pointsCurrent = currentLevelData?.pointsRequired || 0;
  const pointsNext = nextLevel?.pointsRequired || null;

  const progress =
    pointsNext && pointsCurrent
      ? ((totalPoints - pointsCurrent) / (pointsNext - pointsCurrent)) * 100
      : 100;

  return {
    currentLevel,
    nextLevel: nextLevel?.level || null,
    pointsCurrent,
    pointsNext,
    progress: Math.min(100, Math.max(0, progress)),
  };
};

interface PointHistoryEntry {
  _id: string;
  points: number;
  reason: string;
  timestamp: Date;
  task?: string;
}

interface UserBadgeEntry {
  _id: string;
  badge: {
    _id: string;
    name: string;
    description: string;
    icon: string;
    rarity: string;
  };
  earnedAt: Date;
}

/**
 * Busca histórico de pontos do utilizador
 */
export const getPointsHistory = async (
  userId: string,
  limit = 50
): Promise<PointHistoryEntry[]> => {
  return Points.find({ user: userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean() as Promise<PointHistoryEntry[]>;
};

/**
 * Busca badges do utilizador
 */
export const getUserBadges = async (userId: string): Promise<UserBadgeEntry[]> => {
  return UserBadge.find({ user: userId })
    .populate('badge')
    .sort({ earnedAt: -1 })
    .lean() as Promise<UserBadgeEntry[]>;
};

