// Zod schemas will be exported from here
export * from './user';
export * from './task';
export * from './goal';
export * from './report';

// Common validation schemas
import { z } from 'zod';

export const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID MongoDB inválido');

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const searchSchema = z.object({
  search: z.string().min(1).max(100).optional(),
});

