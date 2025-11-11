import { HydratedDocument } from 'mongoose';
import { Streak, IStreak } from '../models';
import { awardPoints } from './gamificationService';

/**
 * Serviço de Streaks - Sistema crítico para retenção (inspirado em Duolingo)
 */

interface UpdateStreakParams {
  userId: string;
  type: string;
  activityDate?: Date;
}

/**
 * Atualiza ou cria streak para um utilizador
 */
export const updateStreak = async (params: UpdateStreakParams): Promise<{
  streak: HydratedDocument<IStreak>;
  isNewRecord: boolean;
  reward?: string;
}> => {
  const { userId, type, activityDate = new Date() } = params;

  // Buscar streak existente
  let streak = await Streak.findOne({ user: userId, type });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activityDay = new Date(activityDate);
  activityDay.setHours(0, 0, 0, 0);

  if (!streak) {
    // Criar novo streak
    streak = new Streak({
      user: userId,
      type,
      consecutiveDays: 1,
      lastActivity: activityDay,
      longestStreak: 1,
      rewardsReceived: [],
    });
    await streak.save();
    return { streak, isNewRecord: false };
  }

  const lastActivityDay = new Date(streak.lastActivity);
  lastActivityDay.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor(
    (activityDay.getTime() - lastActivityDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  let isNewRecord = false;
  let reward: string | undefined;

  if (daysDiff === 0) {
    // Mesmo dia - atualizar lastActivity mas não incrementar
    streak.lastActivity = activityDay;
    await streak.save();
    return { streak, isNewRecord: false };
  } else if (daysDiff === 1) {
    // Dia consecutivo - incrementar
    streak.consecutiveDays += 1;
    streak.lastActivity = activityDay;

    // Verificar se é novo record
    if (streak.consecutiveDays > streak.longestStreak) {
      streak.longestStreak = streak.consecutiveDays;
      isNewRecord = true;
    }

    // Verificar recompensas de milestones
    reward = checkMilestoneRewards(streak.consecutiveDays, streak.rewardsReceived);
    if (reward) {
      streak.rewardsReceived.push({
        day: streak.consecutiveDays,
        reward,
        receivedAt: new Date(),
      });

      // Atribuir pontos bônus
      const bonusPoints = getMilestonePoints(streak.consecutiveDays);
      if (bonusPoints > 0) {
        await awardPoints({
          userId,
          amount: bonusPoints,
          source: 'streak_milestone',
          description: `Streak de ${streak.consecutiveDays} dias: ${reward}`,
          metadata: { streakType: type, days: streak.consecutiveDays },
        });
      }
    }
  } else {
    // Streak quebrado - resetar
    streak.consecutiveDays = 1;
    streak.lastActivity = activityDay;
  }

  await streak.save();
  return { streak, isNewRecord, reward };
};

/**
 * Verifica se há recompensa de milestone
 */
const checkMilestoneRewards = (
  days: number,
  rewardsReceived: Array<{ day: number }>
): string | undefined => {
  const milestones = [3, 7, 14, 30, 60, 100, 365];
  const milestone = milestones.find((m) => days === m);

  if (!milestone) {
    return undefined;
  }

  // Verificar se já recebeu esta recompensa
  const alreadyReceived = rewardsReceived.some((r) => r.day === milestone);
  if (alreadyReceived) {
    return undefined;
  }

  return `Streak de ${milestone} dias!`;
};

/**
 * Retorna pontos bônus para milestone
 */
const getMilestonePoints = (days: number): number => {
  const pointsMap: Record<number, number> = {
    3: 10,
    7: 25,
    14: 50,
    30: 100,
    60: 250,
    100: 500,
    365: 1000,
  };

  return pointsMap[days] || 0;
};

/**
 * Busca streak atual do utilizador
 */
export const getCurrentStreak = async (
  userId: string,
  type: string
): Promise<(IStreak & { _id: string }) | null> => {
  const result = await Streak.findOne({ user: userId, type }).lean();
  return result as (IStreak & { _id: string }) | null;
};

/**
 * Busca todos os streaks do utilizador
 */
export const getUserStreaks = async (userId: string): Promise<Array<IStreak & { _id: string }>> => {
  const results = await Streak.find({ user: userId }).sort({ consecutiveDays: -1 }).lean();
  return results as unknown as Array<IStreak & { _id: string }>;
};

/**
 * Verifica se streak está em risco (última atividade foi ontem)
 */
export const isStreakAtRisk = async (userId: string, type: string): Promise<boolean> => {
  const streak = await Streak.findOne({ user: userId, type });
  if (!streak || streak.consecutiveDays === 0) {
    return false;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const lastActivity = new Date(streak.lastActivity);
  lastActivity.setHours(0, 0, 0, 0);

  return lastActivity.getTime() === yesterday.getTime();
};

