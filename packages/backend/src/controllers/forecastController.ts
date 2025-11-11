import { Response } from 'express';
import { Points, Task, Streak, Goal } from '../models';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

interface ForecastData {
  metric: string;
  current: number;
  forecast: Array<{
    date: string;
    value: number;
    confidence: number;
  }>;
  trend: 'up' | 'down' | 'stable';
}

/**
 * GET /api/reports/forecast/:metric - Obter previsão para uma métrica
 */
export const getForecast = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new AppError('Não autenticado', 401);
    }

    const { metric } = req.params;
    const { days = 30 } = req.query;

    const forecastDays = Math.min(parseInt(days as string) || 30, 90);

    let forecastData: ForecastData;

    switch (metric) {
      case 'points':
        forecastData = await forecastPoints(userId, forecastDays);
        break;
      case 'tasks':
        forecastData = await forecastTasks(userId, forecastDays);
        break;
      case 'streak':
        forecastData = await forecastStreak(userId, forecastDays);
        break;
      default:
        throw new AppError('Métrica inválida. Use: points, tasks, streak', 400);
    }

    res.json({
      success: true,
      data: forecastData,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Erro ao gerar previsão' });
  }
};

/**
 * Previsão de pontos
 */
const forecastPoints = async (userId: string, days: number): Promise<ForecastData> => {
  // Buscar histórico dos últimos 30 dias
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const pointsHistory = await Points.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Calcular média diária
  const dailyAverages = pointsHistory.map((item) => item.total);
  const avgDaily = dailyAverages.length > 0
    ? dailyAverages.reduce((a, b) => a + b, 0) / dailyAverages.length
    : 0;

  // Calcular tendência
  const recentAvg = dailyAverages.slice(-7).reduce((a, b) => a + b, 0) / Math.max(dailyAverages.slice(-7).length, 1);
  const olderAvg = dailyAverages.slice(0, -7).reduce((a, b) => a + b, 0) / Math.max(dailyAverages.slice(0, -7).length, 1);
  const trend = recentAvg > olderAvg * 1.1 ? 'up' : recentAvg < olderAvg * 0.9 ? 'down' : 'stable';

  // Gerar previsão
  const forecast = [];
  const today = new Date();
  let cumulative = pointsHistory.reduce((sum, item) => sum + item.total, 0);

  for (let i = 1; i <= days; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i);
    
    // Previsão com variação aleatória de ±20%
    const variance = 1 + (Math.random() * 0.4 - 0.2);
    const predictedValue = Math.round(avgDaily * variance);
    cumulative += predictedValue;

    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      value: cumulative,
      confidence: Math.max(0.6, 1 - (i / days) * 0.4), // Confiança diminui com o tempo
    });
  }

  return {
    metric: 'points',
    current: cumulative - forecast[forecast.length - 1]?.value + (forecast[0]?.value || 0),
    forecast,
    trend,
  };
};

/**
 * Previsão de tarefas
 */
const forecastTasks = async (userId: string, days: number): Promise<ForecastData> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const tasksHistory = await Task.aggregate([
    {
      $match: {
        $or: [
          { assignedTo: new mongoose.Types.ObjectId(userId) },
          { createdBy: new mongoose.Types.ObjectId(userId) },
        ],
        status: 'completed',
        completedAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const dailyCounts = tasksHistory.map((item) => item.count);
  const avgDaily = dailyCounts.length > 0
    ? dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length
    : 0;

  const recentAvg = dailyCounts.slice(-7).reduce((a, b) => a + b, 0) / Math.max(dailyCounts.slice(-7).length, 1);
  const olderAvg = dailyCounts.slice(0, -7).reduce((a, b) => a + b, 0) / Math.max(dailyCounts.slice(0, -7).length, 1);
  const trend = recentAvg > olderAvg * 1.1 ? 'up' : recentAvg < olderAvg * 0.9 ? 'down' : 'stable';

  const forecast = [];
  const today = new Date();
  let cumulative = dailyCounts.reduce((sum, count) => sum + count, 0);

  for (let i = 1; i <= days; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i);
    
    const variance = 1 + (Math.random() * 0.4 - 0.2);
    const predictedValue = Math.round(avgDaily * variance);
    cumulative += predictedValue;

    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      value: cumulative,
      confidence: Math.max(0.6, 1 - (i / days) * 0.4),
    });
  }

  return {
    metric: 'tasks',
    current: cumulative - forecast[forecast.length - 1]?.value + (forecast[0]?.value || 0),
    forecast,
    trend,
  };
};

/**
 * Previsão de streak
 */
const forecastStreak = async (userId: string, days: number): Promise<ForecastData> => {
  const streak = await Streak.findOne({ user: userId, type: 'daily_tasks' }).lean();
  const currentStreak = streak?.consecutiveDays || 0;

  // Simular previsão baseada em probabilidade de manter streak
  const forecast = [];
  const today = new Date();
  let predictedStreak = currentStreak;
  const maintainProbability = 0.85; // 85% de chance de manter por dia

  for (let i = 1; i <= days; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i);
    
    // Se mantiver streak, incrementar; senão, resetar
    if (Math.random() < maintainProbability) {
      predictedStreak += 1;
    } else {
      predictedStreak = 1; // Reset
    }

    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      value: predictedStreak,
      confidence: Math.max(0.5, maintainProbability ** i),
    });
  }

  const trend = currentStreak > 0 ? 'up' : 'stable';

  return {
    metric: 'streak',
    current: currentStreak,
    forecast,
    trend,
  };
};

