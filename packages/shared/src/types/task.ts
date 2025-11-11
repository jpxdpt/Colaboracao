import { TaskStatus } from '../constants/enums';

/**
 * Tipo de tarefa
 */
export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  assignedTo?: string;
  createdBy: string;
  supervisor?: string;
  requiresValidation: boolean;
  points: number;
  completedAt?: Date;
  validatedAt?: Date;
  validatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}


