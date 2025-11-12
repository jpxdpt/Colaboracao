import { Response } from 'express';
import { Task, Points, Goal, User } from '../models';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

/**
 * GET /api/reports/export/csv - Exportar dados para CSV
 */
export const exportDataToCsv = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new AppError('Não autenticado', 401);
    }

    const { type } = req.query;

    let csvContent = '';
    let filename = '';

    switch (type) {
      case 'tasks':
        const tasks = await Task.find({
          $or: [{ assignedTo: userId }, { createdBy: userId }],
        })
          .populate('assignedTo', 'name email')
          .populate('createdBy', 'name email')
          .lean();

        csvContent = [
          'Título,Descrição,Status,Prioridade,Pontos,Data de Vencimento,Atribuído a,Criado por,Data de Criação',
          ...tasks.map((task) =>
            [
              `"${task.title}"`,
              `"${task.description || ''}"`,
              task.status,
              task.priority,
              task.points || 0,
              task.dueDate ? new Date(task.dueDate).toISOString() : '',
              task.assignedTo?.name || '',
              task.createdBy.name,
              new Date(task.createdAt).toISOString(),
            ].join(',')
          ),
        ].join('\n');
        filename = 'tasks.csv';
        break;

      case 'points':
        const points = await Points.find({ user: userId })
          .sort({ createdAt: -1 })
          .lean();

        csvContent = [
          'Data,Quantidade,Fonte,Descrição',
          ...points.map((point) =>
            [
              new Date(point.createdAt).toISOString(),
              point.amount,
              point.source,
              `"${point.description}"`,
            ].join(',')
          ),
        ].join('\n');
        filename = 'points.csv';
        break;

      case 'goals': {
        const goals = await Goal.find({ createdBy: userId }).lean();

        csvContent = [
          'Título,Descrição,Status,Progresso,Data de Criação',
          ...goals.map((goal) => {
            const progress =
              goal.target > 0
                ? Math.min(100, Math.round((goal.currentProgress / goal.target) * 100))
                : 0;

            return [
              `"${goal.title}"`,
              `"${goal.description || ''}"`,
              goal.status,
              `${progress}%`,
              new Date(goal.createdAt).toISOString(),
            ].join(',');
          }),
        ].join('\n');
        filename = 'goals.csv';
        break;
      }

      default:
        throw new AppError('Tipo inválido. Use: tasks, points, goals', 400);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
};

/**
 * GET /api/reports/export/json - Exportar dados para JSON (compatível com PowerBI)
 */
export const exportDataToJson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new AppError('Não autenticado', 401);
    }

    const { type } = req.query;

    let data: unknown = {};

    switch (type) {
      case 'tasks':
        const tasks = await Task.find({
          $or: [{ assignedTo: userId }, { createdBy: userId }],
        })
          .populate('assignedTo', 'name email')
          .populate('createdBy', 'name email')
          .lean();

        data = tasks.map((task) => ({
          id: task._id.toString(),
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          points: task.points || 0,
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
          assignedTo: task.assignedTo?.name || null,
          createdBy: task.createdBy.name,
          createdAt: new Date(task.createdAt).toISOString(),
        }));
        break;

      case 'points':
        const points = await Points.find({ user: userId })
          .sort({ createdAt: -1 })
          .lean();

        data = points.map((point) => ({
          id: point._id.toString(),
          amount: point.amount,
          source: point.source,
          description: point.description,
          createdAt: new Date(point.createdAt).toISOString(),
        }));
        break;

      case 'all':
        // Exportar tudo
        const [allTasks, allPoints, allGoals] = await Promise.all([
          Task.find({
            $or: [{ assignedTo: userId }, { createdBy: userId }],
          })
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .lean(),
          Points.find({ user: userId }).sort({ createdAt: -1 }).lean(),
          Goal.find({ owner: userId }).lean(),
        ]);

        data = {
          tasks: allTasks,
          points: allPoints,
          goals: allGoals,
          exportedAt: new Date().toISOString(),
        };
        break;

      default:
        throw new AppError('Tipo inválido. Use: tasks, points, all', 400);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="gamify-export-${type}-${Date.now()}.json"`);
    res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
};

