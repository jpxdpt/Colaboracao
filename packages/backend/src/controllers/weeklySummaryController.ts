import { Response } from 'express';
import { User, Task, Goal, Points, Streak } from '../models';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { getTotalPoints, getLevelProgress } from '../services/gamificationService';

interface WeeklySummary {
  userId: string;
  week: string;
  pointsEarned: number;
  tasksCompleted: number;
  goalsAchieved: number;
  streakDays: number;
  levelProgress: {
    currentLevel: number;
    pointsToNextLevel: number;
    progressPercentage: number;
  };
  topAchievements: Array<{
    type: string;
    description: string;
    date: Date;
  }>;
  recommendations: string[];
}

/**
 * GET /api/reports/weekly-summary - Obter resumo semanal de performance
 */
export const getWeeklySummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new AppError('Não autenticado', 401);
    }

    // Calcular início da semana (segunda-feira)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Ajustar para segunda-feira = 0
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);

    // Buscar dados da semana
    const [pointsEarned, tasksCompleted, goalsAchieved, streak, levelProgress, totalPointsOverall] = await Promise.all([
      Points.aggregate([
        {
          $match: {
            user: userId,
            createdAt: { $gte: weekStart },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
      Task.countDocuments({
        $or: [{ assignedTo: userId }, { createdBy: userId }],
        status: 'completed',
        completedAt: { $gte: weekStart },
      }),
      Goal.countDocuments({
        createdBy: userId,
        status: 'completed',
        updatedAt: { $gte: weekStart },
      }),
      Streak.findOne({ user: userId, type: 'daily_tasks' }).lean(),
      getLevelProgress(userId),
      getTotalPoints(userId),
    ]);

    const totalPoints = pointsEarned[0]?.total || 0;

    // Buscar top achievements da semana
    const topAchievements = await Points.find({
      user: userId,
      createdAt: { $gte: weekStart },
      amount: { $gte: 50 }, // Apenas achievements significativos
    })
      .sort({ amount: -1 })
      .limit(5)
      .lean();

    const achievements = topAchievements.map((point) => ({
      type: point.source,
      description: point.description,
      date: point.createdAt,
    }));

    // Gerar recomendações
    const recommendations: string[] = [];
    
    if (totalPoints < 100) {
      recommendations.push('Complete mais tarefas para ganhar pontos esta semana!');
    }
    
    if (streak && streak.consecutiveDays > 0) {
      const lastActivity = new Date(streak.lastActivity);
      const daysSinceLastActivity = Math.floor(
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastActivity >= 1) {
        recommendations.push('Complete uma tarefa hoje para manter seu streak ativo!');
      }
    } else {
      recommendations.push('Comece um streak completando tarefas diariamente!');
    }

    if (tasksCompleted === 0) {
      recommendations.push('Você ainda não completou nenhuma tarefa esta semana. Vamos começar!');
    }

    const summary: WeeklySummary = {
      userId,
      week: weekStart.toISOString().split('T')[0],
      pointsEarned: totalPoints,
      tasksCompleted,
      goalsAchieved,
      streakDays: streak?.consecutiveDays || 0,
      levelProgress: {
        currentLevel: levelProgress.currentLevel,
        pointsToNextLevel: levelProgress.pointsNext
          ? Math.max(0, levelProgress.pointsNext - totalPointsOverall)
          : 0,
        progressPercentage: levelProgress.progress,
      },
      topAchievements: achievements,
      recommendations,
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Erro ao gerar resumo semanal' });
  }
};

/**
 * POST /api/reports/weekly-summary/send-email - Enviar resumo semanal por email (futuro)
 */
export const sendWeeklySummaryEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // TODO: Implementar envio de email
    res.json({
      success: true,
      message: 'Funcionalidade de email será implementada em breve',
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar resumo por email' });
  }
};

