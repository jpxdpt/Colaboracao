import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from './errorHandler';

// Schemas de validação
export const userFilterSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['user', 'admin', 'supervisor']).optional(),
  department: z.string().optional(),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  includeDeleted: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const taskUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'completed', 'validated']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Middleware de validação genérico
 */
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      next(new AppError(`Dados inválidos: ${errors.map(e => `${e.field} - ${e.message}`).join(', ')}`, 400));
      return;
    }

    // Substituir req.body pelos dados validados
    req.body = result.data;
    next();
  };
};

/**
 * Middleware de validação de query parameters
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      next(new AppError(`Parâmetros inválidos: ${errors.map(e => `${e.field} - ${e.message}`).join(', ')}`, 400));
      return;
    }

    // Substituir req.query pelos dados validados
    (req as any).validatedQuery = result.data;
    next();
  };
};
