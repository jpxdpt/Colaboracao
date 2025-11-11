import { Response } from 'express';
import { AuditLog } from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  const {
    page = '1',
    limit = '20',
    action,
    userId,
    resourceType,
    resourceId,
    from,
    to,
    search,
  } = req.query;

  const parsedPage = Math.max(parseInt(page as string, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit as string, 10) || 20, 1), 200);
  const skip = (parsedPage - 1) * parsedLimit;

  const filters: Record<string, unknown> = {};

  if (action && typeof action === 'string') {
    filters.action = action;
  }

  if (userId && typeof userId === 'string') {
    filters.userId = userId;
  }

  if (resourceType && typeof resourceType === 'string') {
    filters.resourceType = resourceType;
  }

  if (resourceId && typeof resourceId === 'string') {
    filters.resourceId = resourceId;
  }

  if (from || to) {
    const dateFilter: { $gte?: Date; $lte?: Date } = {};
    if (from && typeof from === 'string') {
      dateFilter.$gte = new Date(from);
    }
    if (to && typeof to === 'string') {
      dateFilter.$lte = new Date(to);
    }
    if (Object.keys(dateFilter).length > 0) {
      filters.createdAt = dateFilter;
    }
  }

  if (search && typeof search === 'string' && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filters.$or = [
      { action: regex },
      { resourceType: regex },
      { resourceId: regex },
      { ip: regex },
      { userAgent: regex },
    ];
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .populate('userId', 'name email role')
      .lean(),
    AuditLog.countDocuments(filters),
  ]);

  const pages = Math.ceil(total / parsedLimit);

  res.json({
    success: true,
    data: logs,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      pages,
    },
  });
};


