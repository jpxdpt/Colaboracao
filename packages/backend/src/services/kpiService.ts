import { Task, Points, Streak, Goal } from '../models';
import { UserBadge } from '../models/Badge';
import mongoose from 'mongoose';

interface KPIData {
  tasks: {
    total: number;
    completed: number;
    completedThisWeek: number;
    completedThisMonth: number;
    completionRate: number;
    averageCompletionTime: number; // em horas
  };
  points: {
    total: number;
    earnedThisWeek: number;
    earnedThisMonth: number;
    averagePerDay: number;
  };
  badges: {
    total: number;
    earnedThisWeek: number;
    earnedThisMonth: number;
  };
  streaks: {
    current: number;
    longest: number;
    activeStreaks: number;
  };
  goals: {
    total: number;
    completed: number;
    inProgress: number;
    completionRate: number;
  };
  productivity: {
    tasksPerDay: number;
    pointsPerDay: number;
    activeDays: number;
  };
}

/**
 * Calcula KPIs do utilizador
 */
export const getUserKPIs = async (userId: string): Promise<KPIData> => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  // Datas para filtros
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Domingo
  startOfWeek.setHours(0, 0, 0, 0);
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  // Tarefas
  const [totalTasks, completedTasks, completedThisWeek, completedThisMonth, tasksWithDates] = await Promise.all([
    Task.countDocuments({ createdBy: userObjectId }),
    Task.countDocuments({ createdBy: userObjectId, status: 'completed' }),
    Task.countDocuments({
      createdBy: userObjectId,
      status: 'completed',
      completedAt: { $gte: startOfWeek },
    }),
    Task.countDocuments({
      createdBy: userObjectId,
      status: 'completed',
      completedAt: { $gte: startOfMonth },
    }),
    Task.find({
      createdBy: userObjectId,
      status: 'completed',
      completedAt: { $exists: true },
      createdAt: { $exists: true },
    })
      .select('createdAt completedAt')
      .lean(),
  ]);

  // Calcular tempo médio de conclusão
  let averageCompletionTime = 0;
  if (tasksWithDates.length > 0) {
    const completionTimes = tasksWithDates
      .map((task) => {
        if (task.completedAt && task.createdAt) {
          const created = new Date(task.createdAt);
          const completed = new Date(task.completedAt);
          return (completed.getTime() - created.getTime()) / (1000 * 60 * 60); // horas
        }
        return 0;
      })
      .filter((time) => time > 0);
    
    if (completionTimes.length > 0) {
      averageCompletionTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
    }
  }

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Pontos
  const [pointsTotal, pointsThisWeek, pointsThisMonth] = await Promise.all([
    Points.aggregate([
      { $match: { user: userObjectId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Points.aggregate([
      {
        $match: {
          user: userObjectId,
          createdAt: { $gte: startOfWeek },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Points.aggregate([
      {
        $match: {
          user: userObjectId,
          createdAt: { $gte: startOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const totalPoints = pointsTotal[0]?.total || 0;
  const pointsWeek = pointsThisWeek[0]?.total || 0;
  const pointsMonth = pointsThisMonth[0]?.total || 0;

  // Calcular pontos por dia (últimos 30 dias)
  const pointsLast30Days = await Points.aggregate([
    {
      $match: {
        user: userObjectId,
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const pointsPerDay = (pointsLast30Days[0]?.total || 0) / 30;

  // Badges
  const [totalBadges, badgesThisWeek, badgesThisMonth] = await Promise.all([
    UserBadge.countDocuments({ user: userObjectId }),
    UserBadge.countDocuments({
      user: userObjectId,
      earnedAt: { $gte: startOfWeek },
    }),
    UserBadge.countDocuments({
      user: userObjectId,
      earnedAt: { $gte: startOfMonth },
    }),
  ]);

  // Streaks
  const streaks = await Streak.find({ user: userObjectId }).lean();
  const currentStreak = streaks.length > 0 ? Math.max(...streaks.map((s) => s.consecutiveDays || 0)) : 0;
  const longestStreak = streaks.length > 0 ? Math.max(...streaks.map((s) => s.longestStreak || 0)) : 0;
  const activeStreaks = streaks.filter((s) => (s.consecutiveDays || 0) > 0).length;

  // Metas
  const [totalGoals, completedGoals, inProgressGoals] = await Promise.all([
    Goal.countDocuments({ createdBy: userObjectId }),
    Goal.countDocuments({ createdBy: userObjectId, status: 'completed' }),
    Goal.countDocuments({ createdBy: userObjectId, status: 'active' }),
  ]);
  const goalsCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  // Produtividade (tarefas e pontos por dia nos últimos 30 dias)
  const tasksLast30Days = await Task.countDocuments({
    createdBy: userObjectId,
    createdAt: { $gte: thirtyDaysAgo },
  });
  const tasksPerDay = tasksLast30Days / 30;

  // Dias ativos (dias com pelo menos uma tarefa completada)
  const activeDaysData = await Task.aggregate([
    {
      $match: {
        createdBy: userObjectId,
        status: 'completed',
        completedAt: { $gte: thirtyDaysAgo, $exists: true },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$completedAt' },
        },
      },
    },
    { $count: 'activeDays' },
  ]);
  const activeDays = activeDaysData[0]?.activeDays || 0;

  return {
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      completedThisWeek,
      completedThisMonth,
      completionRate: Math.round(completionRate * 10) / 10,
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
    },
    points: {
      total: totalPoints,
      earnedThisWeek: pointsWeek,
      earnedThisMonth: pointsMonth,
      averagePerDay: Math.round(pointsPerDay * 10) / 10,
    },
    badges: {
      total: totalBadges,
      earnedThisWeek: badgesThisWeek,
      earnedThisMonth: badgesThisMonth,
    },
    streaks: {
      current: currentStreak,
      longest: longestStreak,
      activeStreaks,
    },
    goals: {
      total: totalGoals,
      completed: completedGoals,
      inProgress: inProgressGoals,
      completionRate: Math.round(goalsCompletionRate * 10) / 10,
    },
    productivity: {
      tasksPerDay: Math.round(tasksPerDay * 10) / 10,
      pointsPerDay: Math.round(pointsPerDay * 10) / 10,
      activeDays,
    },
  };
};

