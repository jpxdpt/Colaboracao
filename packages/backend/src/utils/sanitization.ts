import { IUser } from '../models/User';
import { ITask } from '../models/Task';

/**
 * Sanitiza dados do usuário para resposta da API
 */
export const sanitizeUser = (user: IUser) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  department: user.department,
  role: user.role,
  createdAt: user.createdAt,
  stats: user.stats,
});

/**
 * Sanitiza dados da tarefa para resposta da API
 */
export const sanitizeTask = (task: ITask) => ({
  _id: task._id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  points: task.points,
  dueDate: task.dueDate,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
  assignedTo: task.assignedTo ? sanitizeUser(task.assignedTo as IUser) : null,
  createdBy: sanitizeUser(task.createdBy as IUser),
  tags: task.tags,
});

/**
 * Escapa caracteres especiais para queries de texto
 */
export const escapeRegex = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
