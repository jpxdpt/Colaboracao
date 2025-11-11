import { Response } from 'express';
import { Task, Goal, Points, User, Streak } from '../models';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

interface ReportWidget {
  type: 'chart' | 'table' | 'metric' | 'list';
  title: string;
  config: Record<string, unknown>;
  data: unknown;
}

interface CustomReport {
  name: string;
  description?: string;
  widgets: ReportWidget[];
  createdAt: Date;
}

/**
 * POST /api/reports/custom - Criar relatório customizado
 */
export const createCustomReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new AppError('Não autenticado', 401);
    }

    const { name, description, widgets } = req.body;

    if (!name || !widgets || !Array.isArray(widgets)) {
      throw new AppError('Nome e widgets são obrigatórios', 400);
    }

    // Processar widgets e buscar dados
    const processedWidgets = await Promise.all(
      widgets.map(async (widget: ReportWidget) => {
        return await processWidget(widget, userId);
      })
    );

    const report: CustomReport = {
      name,
      description,
      widgets: processedWidgets,
      createdAt: new Date(),
    };

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Erro ao criar relatório customizado' });
  }
};

/**
 * Processa um widget e retorna dados
 */
const processWidget = async (widget: ReportWidget, userId: string): Promise<ReportWidget> => {
  switch (widget.type) {
    case 'metric':
      return await processMetricWidget(widget, userId);
    case 'chart':
      return await processChartWidget(widget, userId);
    case 'table':
      return await processTableWidget(widget, userId);
    case 'list':
      return await processListWidget(widget, userId);
    default:
      return widget;
  }
};

/**
 * Processa widget de métrica
 */
const processMetricWidget = async (
  widget: ReportWidget,
  userId: string
): Promise<ReportWidget> => {
  const { metricType } = widget.config as { metricType: string };

  let value = 0;

  switch (metricType) {
    case 'total_points':
      const pointsResult = await Points.aggregate([
        { $match: { user: userId } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      value = pointsResult[0]?.total || 0;
      break;

    case 'completed_tasks':
      value = await Task.countDocuments({
        $or: [{ assignedTo: userId }, { createdBy: userId }],
        status: 'completed',
      });
      break;

    case 'active_streak':
      const streak = await Streak.findOne({ user: userId, type: 'daily_tasks' }).lean();
      value = streak?.consecutiveDays || 0;
      break;

    case 'active_goals':
      value = await Goal.countDocuments({
        owner: userId,
        status: { $ne: 'completed' },
      });
      break;
  }

  return {
    ...widget,
    data: { value },
  };
};

/**
 * Processa widget de gráfico
 */
const processChartWidget = async (
  widget: ReportWidget,
  userId: string
): Promise<ReportWidget> => {
  const { chartType, period } = widget.config as { chartType: string; period: string };

  let data: unknown = [];

  switch (chartType) {
    case 'points_timeline':
      const startDate = getStartDate(period);
      const pointsData = await Points.aggregate([
        {
          $match: {
            user: userId,
            createdAt: { $gte: startDate },
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
      data = pointsData.map((item) => ({
        date: item._id,
        value: item.total,
      }));
      break;

    case 'tasks_by_status':
      const tasksByStatus = await Task.aggregate([
        {
          $match: {
            $or: [{ assignedTo: userId }, { createdBy: userId }],
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);
      data = tasksByStatus.map((item) => ({
        label: item._id,
        value: item.count,
      }));
      break;
  }

  return {
    ...widget,
    data,
  };
};

/**
 * Processa widget de tabela
 */
const processTableWidget = async (
  widget: ReportWidget,
  userId: string
): Promise<ReportWidget> => {
  const { tableType } = widget.config as { tableType: string };

  let data: unknown = [];

  switch (tableType) {
    case 'recent_tasks':
      const tasks = await Task.find({
        $or: [{ assignedTo: userId }, { createdBy: userId }],
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .lean();
      data = tasks.map((task) => ({
        title: task.title,
        status: task.status,
        priority: task.priority,
        createdAt: task.createdAt,
      }));
      break;

    case 'points_history':
      const points = await Points.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
      data = points.map((point) => ({
        amount: point.amount,
        source: point.source,
        description: point.description,
        createdAt: point.createdAt,
      }));
      break;
  }

  return {
    ...widget,
    data,
  };
};

/**
 * Processa widget de lista
 */
const processListWidget = async (
  widget: ReportWidget,
  userId: string
): Promise<ReportWidget> => {
  const { listType } = widget.config as { listType: string };

  let data: unknown = [];

  switch (listType) {
    case 'top_achievements':
      // Implementar lógica de top achievements
      data = [];
      break;
  }

  return {
    ...widget,
    data,
  };
};

/**
 * Helper para obter data de início baseado no período
 */
const getStartDate = (period: string): Date => {
  const now = new Date();
  switch (period) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
};

/**
 * GET /api/reports/widgets/types - Lista tipos de widgets disponíveis
 */
export const getWidgetTypes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const widgetTypes = [
      {
        type: 'metric',
        name: 'Métrica',
        configOptions: {
          metricType: {
            type: 'select',
            options: ['total_points', 'completed_tasks', 'active_streak', 'active_goals'],
          },
        },
      },
      {
        type: 'chart',
        name: 'Gráfico',
        configOptions: {
          chartType: {
            type: 'select',
            options: ['points_timeline', 'tasks_by_status'],
          },
          period: {
            type: 'select',
            options: ['week', 'month', 'year'],
          },
        },
      },
      {
        type: 'table',
        name: 'Tabela',
        configOptions: {
          tableType: {
            type: 'select',
            options: ['recent_tasks', 'points_history'],
          },
        },
      },
    ];

    res.json({
      success: true,
      data: widgetTypes,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tipos de widgets' });
  }
};

