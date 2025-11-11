import { Response } from 'express';
import { Activity } from '../models/Activity';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

/**
 * GET /api/activities - Buscar atividades do utilizador autenticado
 */
export const getActivities = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  const userId = req.user._id.toString();
  const { page = '1', limit = '20', type } = req.query;

  const parsedPage = Math.max(parseInt(page as string, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit as string, 10) || 20, 1), 100);
  const skip = (parsedPage - 1) * parsedLimit;

  const filters: Record<string, unknown> = { user: userId };

  if (type && typeof type === 'string') {
    filters.type = type;
  }

  const [activities, total] = await Promise.all([
    Activity.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
    Activity.countDocuments(filters),
  ]);

  const pages = Math.ceil(total / parsedLimit);

  res.json({
    success: true,
    data: activities,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      pages,
    },
  });
};

/**
 * GET /api/activities/feed - Buscar feed de atividades (próprias + equipas)
 */
export const getActivityFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  const userId = req.user._id.toString();
  const { page = '1', limit = '30' } = req.query;

  const parsedPage = Math.max(parseInt(page as string, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit as string, 10) || 30, 1), 100);
  const skip = (parsedPage - 1) * parsedLimit;

  // Buscar atividades do utilizador e de membros das suas equipas
  const { TeamMember } = await import('../models');
  const userTeams = await TeamMember.find({ user: userId, active: true })
    .select('team')
    .lean();

  const teamIds = userTeams.map((tm) => tm.team.toString());

  // Buscar utilizadores das mesmas equipas
  const teamMembers = await TeamMember.find({
    team: { $in: teamIds },
    active: true,
  })
    .select('user')
    .lean();

  const userIds = [
    userId,
    ...new Set(teamMembers.map((tm) => tm.user.toString())),
  ];

  const [activities, total] = await Promise.all([
    Activity.find({ user: { $in: userIds } })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
    Activity.countDocuments({ user: { $in: userIds } }),
  ]);

  const pages = Math.ceil(total / parsedLimit);

  res.json({
    success: true,
    data: activities,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      pages,
    },
  });
};

