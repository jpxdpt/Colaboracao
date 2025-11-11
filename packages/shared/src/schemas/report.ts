import { z } from 'zod';

/**
 * Schema para criação de reporte
 */
export const createReportSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').max(5000),
  category: z.enum([
    'safety',
    'quality',
    'equipment',
    'process',
    'compliance',
    'other',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  attachments: z.array(z.string().url()).default([]),
  assignedTo: z.string().optional(),
});

/**
 * Schema para atualização de reporte
 */
export const updateReportSchema = z.object({
  status: z.enum(['open', 'in-progress', 'resolved', 'closed']).optional(),
  assignedTo: z.string().optional(),
  resolutionNotes: z.string().max(2000).optional(),
});

/**
 * Schema para filtros de reportes
 */
export const reportFiltersSchema = z.object({
  status: z.enum(['open', 'in-progress', 'resolved', 'closed']).optional(),
  category: z.enum([
    'safety',
    'quality',
    'equipment',
    'process',
    'compliance',
    'other',
  ]).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  reportedBy: z.string().optional(),
  assignedTo: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});



