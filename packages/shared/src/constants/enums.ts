/**
 * Enums partilhados entre frontend e backend
 */

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  VALIDATED = 'validated',
}

export enum GoalType {
  INDIVIDUAL = 'individual',
  TEAM = 'team',
}

export enum BadgeRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum RankingType {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all-time',
}

export enum NotificationType {
  ACHIEVEMENT = 'achievement',
  TASK = 'task',
  GOAL = 'goal',
  CHALLENGE = 'challenge',
  RECOGNITION = 'recognition',
  STREAK = 'streak',
  LEVEL_UP = 'level_up',
}

export enum UserRole {
  USER = 'user',
  SUPERVISOR = 'supervisor',
  ADMIN = 'admin',
}



