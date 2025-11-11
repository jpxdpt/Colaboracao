import { GoalType } from '../constants/enums';

/**
 * Milestone de uma meta
 */
export interface GoalMilestone {
  value: number;
  label: string;
  achieved: boolean;
  achievedAt?: Date;
}

/**
 * Tipo de meta
 */
export interface Goal {
  _id: string;
  title: string;
  description?: string;
  type: GoalType;
  currentProgress: number;
  target: number;
  unit: string;
  dueDate?: Date;
  createdBy: string;
  participants: string[];
  status: 'active' | 'completed' | 'cancelled';
  milestones?: GoalMilestone[];
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}


