import { Response } from 'express';
import { Task, User, Streak } from '../models';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

interface RecommendedTask {
  task: {
    _id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string;
  };
  score: number;
  reasons: string[];
}

/**
 * GET /api/tasks/recommended - Obter tarefas recomendadas
 */
export const getRecommendedTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new AppError('Não autenticado', 401);
    }

    // Buscar tarefas pendentes do utilizador
    const userTasks = await Task.find({
      $or: [{ assignedTo: userId }, { createdBy: userId }],
      status: { $ne: 'completed' },
    })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .lean();

    // Buscar streak do utilizador
    const streak = await Streak.findOne({ user: userId, type: 'daily_tasks' }).lean();

    // Calcular score para cada tarefa
    const recommendedTasks: RecommendedTask[] = userTasks.map((task) => {
      const reasons: string[] = [];
      let score = 0;

      // Prioridade alta aumenta score
      if (task.priority === 'high') {
        score += 30;
        reasons.push('Prioridade alta');
      } else if (task.priority === 'medium') {
        score += 15;
        reasons.push('Prioridade média');
      }

      // Tarefas próximas do deadline aumentam score
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0) {
          score += 50; // Atrasado
          reasons.push('Tarefa atrasada');
        } else if (daysUntilDue <= 1) {
          score += 40;
          reasons.push('Prazo muito próximo');
        } else if (daysUntilDue <= 3) {
          score += 25;
          reasons.push('Prazo próximo');
        }
      }

      // Tarefas com mais pontos aumentam score
      if (task.points && task.points > 0) {
        score += Math.min(task.points / 10, 20);
        reasons.push(`Vale ${task.points} pontos`);
      }

      // Streak em risco aumenta score de tarefas fáceis
      if (streak && streak.consecutiveDays > 0) {
        const lastActivity = new Date(streak.lastActivity);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        lastActivity.setHours(0, 0, 0, 0);

        const daysSinceLastActivity = Math.floor(
          (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastActivity >= 1) {
          score += 35;
          reasons.push('Manter streak ativo');
        }
      }

      // Tarefas criadas recentemente têm prioridade
      const createdAt = new Date(task.createdAt);
      const daysSinceCreation = Math.floor(
        (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceCreation <= 1) {
        score += 10;
        reasons.push('Tarefa recente');
      }

      return {
        task,
        score,
        reasons: reasons.length > 0 ? reasons : ['Tarefa pendente'],
      };
    });

    // Ordenar por score (maior primeiro)
    recommendedTasks.sort((a, b) => b.score - a.score);

    // Retornar top 10
    const topRecommended = recommendedTasks.slice(0, 10);

    res.json({
      success: true,
      data: topRecommended,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Erro ao buscar tarefas recomendadas' });
  }
};

