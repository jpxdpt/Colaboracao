import { UserRole } from '../constants/enums';

/**
 * Tipo de utilizador base
 */
export interface User {
  _id: string;
  email: string;
  name: string;
  department: string;
  role: UserRole;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Preferências do utilizador
 */
export interface UserPreferences {
  notifications: NotificationPreferences;
  theme: 'light' | 'dark';
  language: string;
  privacy: PrivacySettings;
}

/**
 * Preferências de notificação granulares
 */
export interface NotificationPreferences {
  achievements: boolean;
  tasks: boolean;
  goals: boolean;
  challenges: boolean;
  recognition: boolean;
  streaks: boolean;
  levelUps: boolean;
  email: boolean;
}

/**
 * Configurações de privacidade
 */
export interface PrivacySettings {
  showProfile: boolean;
  showStats: boolean;
  showBadges: boolean;
}



