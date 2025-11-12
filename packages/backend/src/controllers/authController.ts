import { Response } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import {
  generateTokens,
  blacklistToken,
  isTokenBlacklisted,
  verifyRefreshToken,
} from '../services/authService';
import { registerSchema, loginSchema, changePasswordSchema } from '@taskify/shared';
import { validateQuery, userFilterSchema } from '../middleware/validation';
import { sanitizeUser, escapeRegex } from '../utils/sanitization';
import { AuditLog } from '../models/AuditLog';
import { UserRole } from '@taskify/shared';
import { Task, Goal, Points, UserBadge, TeamMember, Team, Level } from '../models';
import mongoose from 'mongoose';

interface UserStats {
  totalPoints: number;
  currentLevel: number;
  badgesCount: number;
}

interface UserWithStats {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  avatar?: string | null;
  department: string;
  role: UserRole;
  createdAt: Date;
  stats: UserStats;
}

interface UsersWithStatsResult {
  users: UserWithStats[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const buildUserFilters = (
  req: AuthRequest
): {
  filters: Record<string, unknown>;
  sortField: string;
  sortOrder: 1 | -1;
  page: number;
  limit: number;
} => {
  const validatedQuery = (req as any).validatedQuery as z.infer<typeof userFilterSchema>;
  const {
    search,
    role,
    department,
    sortBy = 'name',
    order = 'asc',
    includeDeleted,
    page = 1,
    limit = 10
  } = validatedQuery;

  const filters: Record<string, unknown> = {};

  // Filtro de utilizadores eliminados (sempre aplicar primeiro)
  const showDeleted = includeDeleted === 'true';
  if (!showDeleted) {
    // Incluir apenas utilizadores não eliminados
    filters.isDeleted = { $ne: true };
  }

  // Filtro de busca (com sanitização)
  if (search && search.trim()) {
    const escapedSearch = escapeRegex(search.trim());
    const regex = new RegExp(escapedSearch, 'i');
    filters.$or = [{ name: regex }, { email: regex }, { department: regex }];
  }

  // Filtro de role
  if (role) {
    filters.role = role;
  }

  // Filtro de departamento
  if (department) {
    filters.department = department;
  }

  const sortField = sortBy || 'name';
  const sortOrder = order === 'desc' ? -1 : 1;
  const pageNum = page || 1;
  const limitNum = Math.min(limit || 10, 100);

  return {
    filters,
    sortField,
    sortOrder,
    page: pageNum,
    limit: limitNum,
  };
};

const fetchUsersWithStats = async (
  filters: Record<string, unknown>,
  sortField: string,
  sortOrder: 1 | -1,
  page: number,
  limit: number
): Promise<UsersWithStatsResult> => {
  // Se ordenar por stats, buscar todos e ordenar depois
  const shouldSortByStats = sortField.startsWith('stats.');

  // Buscar usuários com paginação
  const skip = (page - 1) * limit;
  const users = await User.find(filters, 'name email avatar department role createdAt')
    .sort(shouldSortByStats ? { name: 1 } : { [sortField]: sortOrder })
    .skip(skip)
    .limit(limit)
    .lean();

  // Buscar total para paginação
  const total = await User.countDocuments(filters);

  const pages = Math.max(1, Math.ceil(total / limit));

  if (users.length === 0) {
    return {
      users: [],
      pagination: { page, limit, total, pages },
    };
  }

  const userIds = users.map((user) => user._id as mongoose.Types.ObjectId);

  // Buscar pontos totais usando agregação (otimizado)
  const pointsAggregation = await Points.aggregate([
    { $match: { user: { $in: userIds } } },
    { $group: { _id: '$user', total: { $sum: '$amount' } } },
  ]);

  const pointsMap = new Map(
    pointsAggregation.map(item => [item._id.toString(), item.total || 0])
  );

  // Buscar contagem de badges usando agregação (otimizado)
  const badgesAggregation = await UserBadge.aggregate([
    { $match: { user: { $in: userIds } } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
  ]);

  const badgesMap = new Map(
    badgesAggregation.map(item => [item._id.toString(), item.count || 0])
  );

  // Buscar níveis uma vez (cache)
  const levels = await Level.find().sort({ level: 1 }).lean();

  // Combinar dados
  const usersWithStats: UserWithStats[] = users.map((user) => {
    const userId = (user._id as mongoose.Types.ObjectId).toString();
    const totalPoints = pointsMap.get(userId) || 0;
    const badgesCount = badgesMap.get(userId) || 0;

    // Calcular nível baseado nos pontos (otimizado)
    let currentLevel = 1;
    for (const level of levels) {
      if (totalPoints >= level.pointsRequired) {
        currentLevel = level.level;
      } else {
        break;
      }
    }

    return {
      ...user,
      stats: {
        totalPoints,
        currentLevel,
        badgesCount,
      },
    };
  });

  // Ordenar por stats se necessário
  if (shouldSortByStats) {
    const statField = sortField.replace('stats.', '') as keyof UserStats;
    usersWithStats.sort((a, b) => {
      const aValue = a.stats?.[statField] ?? 0;
      const bValue = b.stats?.[statField] ?? 0;
      return sortOrder === 1 ? aValue - bValue : bValue - aValue;
    });
  }

  return {
    users: usersWithStats.map(user => sanitizeUser(user as any)),
    pagination: {
      page,
      limit,
      total,
      pages,
    },
  };
};

/**
 * Registo de novo utilizador
 */
export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  // Validar dados
  const validatedData = registerSchema.parse(req.body);

  // Verificar se email já existe
  const existingUser = await User.findOne({ email: validatedData.email });
  if (existingUser) {
    throw new AppError('Email já está em uso', 400);
  }

  // Criar utilizador
  const user = new User({
    email: validatedData.email,
    password: validatedData.password,
    name: validatedData.name,
    department: validatedData.department,
  });

  await user.save();

  // Gerar tokens
  const tokens = generateTokens(user);

  // Log de auditoria
  await AuditLog.create({
    action: 'user_registered',
    userId: user._id.toString(),
    resourceType: 'User',
    resourceId: user._id.toString(),
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(201).json({
    success: true,
    data: {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        department: user.department,
        role: user.role,
        avatar: user.avatar,
        preferences: user.preferences,
      },
      tokens,
    },
  });
};

/**
 * Login de utilizador
 */
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  // Validar dados
  const validatedData = loginSchema.parse(req.body);

  // Buscar utilizador com password
  const user = await User.findOne({ email: validatedData.email }).select('+password');

  if (!user) {
    throw new AppError('Credenciais inválidas', 401);
  }

  // Verificar password
  const isPasswordValid = await user.comparePassword(validatedData.password);
  if (!isPasswordValid) {
    throw new AppError('Credenciais inválidas', 401);
  }

  // Gerar tokens
  const tokens = generateTokens(user);

  // Log de auditoria
  await AuditLog.create({
    action: 'user_login',
    userId: user._id.toString(),
    resourceType: 'User',
    resourceId: user._id.toString(),
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({
    success: true,
    data: {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        department: user.department,
        role: user.role,
        avatar: user.avatar,
        preferences: user.preferences,
      },
      tokens,
    },
  });
};

/**
 * Refresh token
 */
export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token é obrigatório', 400);
  }

  // Verificar se token está na blacklist
  const isBlacklisted = await isTokenBlacklisted(refreshToken);
  if (isBlacklisted) {
    throw new AppError('Token revogado', 401);
  }

  // Verificar e decodificar token
  const decoded = verifyRefreshToken(refreshToken);

  // Buscar utilizador
  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new AppError('Utilizador não encontrado', 401);
  }

  // Adicionar token antigo à blacklist
  const { config } = await import('../config');
  await blacklistToken(refreshToken, config.jwt.refreshExpiresIn);

  // Gerar novos tokens
  const tokens = generateTokens(user);

  res.json({
    success: true,
    data: { tokens },
  });
};

/**
 * Logout
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Adicionar token à blacklist
    const { config } = await import('../config');
    await blacklistToken(token, config.jwt.accessExpiresIn);
  }

  // Log de auditoria
  if (req.user) {
    await AuditLog.create({
      action: 'user_logout',
      userId: req.user._id.toString(),
      resourceType: 'User',
      resourceId: req.user._id.toString(),
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  res.json({
    success: true,
    message: 'Logout realizado com sucesso',
  });
};

/**
 * Obter perfil do utilizador autenticado
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('Utilizador não encontrado', 404);
  }

  res.json({
    success: true,
    data: {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        department: user.department,
        role: user.role,
        avatar: user.avatar,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
  });
};

/**
 * Alterar password
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  const validatedData = changePasswordSchema.parse(req.body);

  // Buscar utilizador com password
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw new AppError('Utilizador não encontrado', 404);
  }

  // Verificar password atual
  const isPasswordValid = await user.comparePassword(validatedData.currentPassword);
  if (!isPasswordValid) {
    throw new AppError('Password atual incorreta', 400);
  }

  // Atualizar password
  user.password = validatedData.newPassword;
  await user.save();

  // Log de auditoria
  await AuditLog.create({
    action: 'password_changed',
    userId: user._id.toString(),
    resourceType: 'User',
    resourceId: user._id.toString(),
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({
    success: true,
    message: 'Password alterada com sucesso',
  });
};

/**
 * Listar utilizadores (apenas para admins)
 */
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  // Apenas admins podem listar usuários
  if (req.user.role !== UserRole.ADMIN) {
    throw new AppError('Acesso negado. Apenas administradores podem listar usuários.', 403);
  }

  const { filters, sortField, sortOrder, page, limit } = buildUserFilters(req);
  const result = await fetchUsersWithStats(filters, sortField, sortOrder, page, limit);

  res.json({
    success: true,
    data: result.users,
    pagination: result.pagination,
  });
};

/**
 * Atualizar role de um utilizador (apenas admins)
 */
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  if (req.user.role !== UserRole.ADMIN) {
    throw new AppError('Acesso negado. Apenas administradores podem atualizar roles.', 403);
  }

  const { id } = req.params;
  const { role } = req.body as { role?: UserRole };

  if (!role || !Object.values(UserRole).includes(role)) {
    throw new AppError('Role inválido', 400);
  }

  if (req.user._id.toString() === id) {
    throw new AppError('Não é possível alterar o próprio role.', 400);
  }

  const user = await User.findById(id);

  if (!user) {
    throw new AppError('Utilizador não encontrado', 404);
  }

  user.role = role;
  await user.save();

  await AuditLog.create({
    action: 'user_role_updated',
    userId: req.user._id.toString(),
    resourceType: 'User',
    resourceId: user._id.toString(),
    metadata: { newRole: role },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
};

/**
 * Reset de password por admin
 */
export const resetUserPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  if (req.user.role !== UserRole.ADMIN) {
    throw new AppError('Acesso negado. Apenas administradores podem resetar passwords.', 403);
  }

  const { id } = req.params;
  const user = await User.findById(id).select('+password');

  if (!user) {
    throw new AppError('Utilizador não encontrado', 404);
  }

  const temporaryPassword = crypto.randomBytes(5).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);

  user.password = temporaryPassword;
  await user.save();

  await AuditLog.create({
    action: 'user_password_reset',
    userId: req.user._id.toString(),
    resourceType: 'User',
    resourceId: user._id.toString(),
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({
    success: true,
    data: {
      temporaryPassword,
    },
  });
};

/**
 * Exportar utilizadores em CSV
 */
export const exportUsersCsv = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  if (req.user.role !== UserRole.ADMIN) {
    throw new AppError('Acesso negado. Apenas administradores podem exportar utilizadores.', 403);
  }

  const { filters, sortField, sortOrder, page, limit } = buildUserFilters(req);
  const { users: usersWithStats } = await fetchUsersWithStats(filters, sortField, sortOrder, page, limit);

  const headers = ['Nome', 'Email', 'Departamento', 'Role', 'Pontos', 'Nível', 'Badges', 'Criado em'];
  const rows = usersWithStats.map((user: UserWithStats) => [
    `"${user.name}"`,
    `"${user.email}"`,
    `"${user.department}"`,
    `"${user.role}"`,
    user.stats.totalPoints ?? 0,
    user.stats.currentLevel ?? 1,
    user.stats.badgesCount ?? 0,
    new Date(user.createdAt).toISOString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => String(cell)).join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
  res.send(csvContent);
};

/**
 * Exportar dados pessoais do utilizador
 */
export const exportMyData = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  const userId = req.user._id.toString();

  const user = await User.findById(userId).lean();
  if (!user) {
    throw new AppError('Utilizador não encontrado', 404);
  }

  const [
    tasksCreated,
    tasksAssigned,
    goals,
    pointsHistory,
    badges,
    teamMemberships,
    auditLogs,
  ] = await Promise.all([
    Task.find({ createdBy: userId }).lean(),
    Task.find({ assignedTo: userId }).lean(),
    Goal.find({ createdBy: userId }).lean(),
    Points.find({ user: userId }).sort({ createdAt: -1 }).lean(),
    UserBadge.find({ user: userId }).populate('badge').lean(),
    TeamMember.find({ user: userId }).populate('team').lean(),
    AuditLog.find({ userId }).sort({ createdAt: -1 }).limit(200).lean(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      department: user.department,
      role: user.role,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    tasks: {
      created: tasksCreated,
      assigned: tasksAssigned,
    },
    goals,
    pointsHistory,
    badges,
    teams: teamMemberships.map((membership) => ({
      team: membership.team,
      role: membership.role,
      pointsContributed: membership.pointsContributed,
      joinedAt: membership.createdAt,
    })),
    auditLogs,
  };

  const json = JSON.stringify(payload, null, 2);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="gamify-data-${userId}-${Date.now()}.json"`
  );
  res.send(json);
};

/**
 * Eliminar conta do utilizador
 */
export const deleteMyAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw new AppError('Utilizador não encontrado', 404);
  }

  user.isDeleted = true;
  user.deletedAt = new Date();
  user.email = `deleted+${user._id}@gamify.local`;
  user.name = 'Conta eliminada';
  user.department = 'Removido';
  user.avatar = undefined;
  user.password = crypto.randomBytes(12).toString('hex');

  await user.save();

  await Promise.all([
    Task.updateMany({ assignedTo: user._id }, { $unset: { assignedTo: '' } }),
    Team.updateMany({ members: user._id }, { $pull: { members: user._id } }),
    TeamMember.updateMany({ user: user._id }, { active: false }),
  ]);

  await AuditLog.create({
    action: 'user_deleted',
    userId: req.user._id.toString(),
    resourceType: 'User',
    resourceId: req.user._id.toString(),
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(204).send();
};

