import { z } from 'zod';
import { TaskStatus } from '../constants/enums';

/**
 * Schema para criação de tarefa
 */
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().max(2000, 'Descrição muito longa').optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  supervisor: z.string().optional(),
  parentTask: z.string().optional(),
  requiresValidation: z.boolean().default(false),
  points: z.number().int().min(0).default(0),
});

/**
 * Schema para atualização de tarefa
 */
export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.nativeEnum(TaskStatus).optional(),
});

/**
 * Schema para filtros de tarefas
 */
export const taskFiltersSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  assignedTo: z.string().optional(),
  department: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  parentTask: z.string().optional(),
  includeSubtasks: z.coerce.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['dueDate', 'priority', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema para conclusão de tarefa
 */
export const completeTaskSchema = z.object({
  taskId: z.string().min(1, 'ID da tarefa é obrigatório'),
  notes: z.string().max(500).optional(),
});


