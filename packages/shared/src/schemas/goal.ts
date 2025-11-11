import { z } from 'zod';
import { GoalType } from '../constants/enums';

/**
 * Schema para criação de meta
 */
export const createGoalSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  description: z.string().max(2000).optional(),
  type: z.nativeEnum(GoalType).default(GoalType.INDIVIDUAL),
  target: z.number().positive('Meta deve ser um número positivo'),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  dueDate: z.string().datetime().optional(),
  participants: z.array(z.string()).default([]),
  milestones: z.array(z.object({
    value: z.number().positive(),
    label: z.string(),
  })).optional(),
});

/**
 * Schema para atualização de meta
 */
export const updateGoalSchema = createGoalSchema.partial();

/**
 * Schema para atualização de progresso de meta
 */
export const updateGoalProgressSchema = z.object({
  goalId: z.string().min(1),
  currentProgress: z.number().min(0),
});


