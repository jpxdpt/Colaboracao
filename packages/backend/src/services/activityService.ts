import { Activity } from '../models/Activity';
import { User } from '../models/User';

interface CreateActivityParams {
  userId: string;
  type: 'task_completed' | 'badge_earned' | 'streak_milestone' | 'goal_achieved' | 'level_up' | 'points_awarded' | 'team_joined' | 'challenge_completed';
  title: string;
  description: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Cria uma atividade no feed
 */
export const createActivity = async (params: CreateActivityParams): Promise<void> => {
  const { userId, type, title, description, icon, metadata } = params;

  const activity = new Activity({
    user: userId,
    type,
    title,
    description,
    icon,
    metadata,
  });

  await activity.save();
};

/**
 * Cria atividade quando uma tarefa é completada
 */
export const createTaskCompletedActivity = async (
  userId: string,
  taskTitle: string,
  points: number,
  taskId: string
): Promise<void> => {
  const user = await User.findById(userId).select('name').lean();
  await createActivity({
    userId,
    type: 'task_completed',
    title: 'Tarefa Completada',
    description: `${user?.name || 'Utilizador'} completou a tarefa "${taskTitle}" e ganhou ${points} pontos!`,
    icon: '✅',
    metadata: {
      taskId,
      points,
    },
  });
};

/**
 * Cria atividade quando um badge é ganho
 */
export const createBadgeEarnedActivity = async (
  userId: string,
  badgeName: string,
  badgeId: string
): Promise<void> => {
  const user = await User.findById(userId).select('name').lean();
  await createActivity({
    userId,
    type: 'badge_earned',
    title: 'Badge Ganho',
    description: `${user?.name || 'Utilizador'} ganhou o badge "${badgeName}"! 🏆`,
    icon: '🏆',
    metadata: {
      badgeId,
    },
  });
};

/**
 * Cria atividade quando um streak atinge um marco
 */
export const createStreakMilestoneActivity = async (
  userId: string,
  streakDays: number
): Promise<void> => {
  const user = await User.findById(userId).select('name').lean();
  await createActivity({
    userId,
    type: 'streak_milestone',
    title: 'Marco de Sequência',
    description: `${user?.name || 'Utilizador'} atingiu ${streakDays} dias consecutivos! 🔥`,
    icon: '🔥',
    metadata: {
      streakDays,
    },
  });
};

/**
 * Cria atividade quando uma meta é alcançada
 */
export const createGoalAchievedActivity = async (
  userId: string,
  goalTitle: string,
  goalId: string
): Promise<void> => {
  const user = await User.findById(userId).select('name').lean();
  await createActivity({
    userId,
    type: 'goal_achieved',
    title: 'Meta Alcançada',
    description: `${user?.name || 'Utilizador'} alcançou a meta "${goalTitle}"! 🎯`,
    icon: '🎯',
    metadata: {
      goalId,
    },
  });
};

/**
 * Cria atividade quando um nível é alcançado
 */
export const createLevelUpActivity = async (
  userId: string,
  level: number
): Promise<void> => {
  const user = await User.findById(userId).select('name').lean();
  await createActivity({
    userId,
    type: 'level_up',
    title: 'Subiu de Nível',
    description: `${user?.name || 'Utilizador'} subiu para o nível ${level}! ⬆️`,
    icon: '⬆️',
    metadata: {
      level,
    },
  });
};

/**
 * Cria atividade quando pontos são atribuídos
 */
export const createPointsAwardedActivity = async (
  userId: string,
  points: number,
  source: string
): Promise<void> => {
  // Só criar atividade para pontos significativos (>= 50) para evitar spam
  if (points < 50) {
    return;
  }

  const user = await User.findById(userId).select('name').lean();
  await createActivity({
    userId,
    type: 'points_awarded',
    title: 'Pontos Atribuídos',
    description: `${user?.name || 'Utilizador'} ganhou ${points} pontos! 💰`,
    icon: '💰',
    metadata: {
      points,
      source,
    },
  });
};

/**
 * Cria atividade quando um utilizador se junta a uma equipa
 */
export const createTeamJoinedActivity = async (
  userId: string,
  teamName: string,
  teamId: string
): Promise<void> => {
  const user = await User.findById(userId).select('name').lean();
  await createActivity({
    userId,
    type: 'team_joined',
    title: 'Juntou-se a uma Equipa',
    description: `${user?.name || 'Utilizador'} juntou-se à equipa "${teamName}"! 👥`,
    icon: '👥',
    metadata: {
      teamId,
    },
  });
};

