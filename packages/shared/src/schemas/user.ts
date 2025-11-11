import { z } from 'zod';
import { UserRole } from '../constants/enums';

/**
 * Schema para preferências de notificação
 */
export const notificationPreferencesSchema = z.object({
  achievements: z.boolean().default(true),
  tasks: z.boolean().default(true),
  goals: z.boolean().default(true),
  challenges: z.boolean().default(true),
  recognition: z.boolean().default(true),
  streaks: z.boolean().default(true),
  levelUps: z.boolean().default(true),
  email: z.boolean().default(true),
});

/**
 * Schema para configurações de privacidade
 */
export const privacySettingsSchema = z.object({
  showProfile: z.boolean().default(true),
  showStats: z.boolean().default(true),
  showBadges: z.boolean().default(true),
});

/**
 * Schema para preferências do utilizador
 */
export const userPreferencesSchema = z.object({
  notifications: notificationPreferencesSchema.default({}),
  theme: z.enum(['light', 'dark']).default('light'),
  language: z.string().default('pt'),
  privacy: privacySettingsSchema.default({}),
});

/**
 * Schema para registo de utilizador
 */
export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Password deve ter pelo menos 8 caracteres'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  department: z.string().min(1, 'Departamento é obrigatório'),
});

/**
 * Schema para login
 */
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Password é obrigatória'),
});

/**
 * Schema para atualização de perfil
 */
export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  department: z.string().min(1).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  preferences: userPreferencesSchema.optional(),
});

/**
 * Schema para atualização de preferências
 */
export const updatePreferencesSchema = userPreferencesSchema.partial();

/**
 * Schema para alteração de password
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password atual é obrigatória'),
  newPassword: z.string().min(8, 'Nova password deve ter pelo menos 8 caracteres'),
});

/**
 * Schema para recuperação de password
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

/**
 * Schema para reset de password
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string().min(8, 'Password deve ter pelo menos 8 caracteres'),
});



