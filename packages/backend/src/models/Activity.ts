import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from './BaseDocument';

export interface IActivity extends IBaseDocument {
  user: mongoose.Types.ObjectId;
  type: 'task_completed' | 'badge_earned' | 'streak_milestone' | 'goal_achieved' | 'level_up' | 'points_awarded' | 'team_joined' | 'challenge_completed';
  title: string;
  description: string;
  icon?: string;
  metadata?: {
    taskId?: string;
    badgeId?: string;
    streakDays?: number;
    goalId?: string;
    level?: number;
    points?: number;
    teamId?: string;
    challengeId?: string;
  };
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'task_completed',
        'badge_earned',
        'streak_milestone',
        'goal_achieved',
        'level_up',
        'points_awarded',
        'team_joined',
        'challenge_completed',
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para queries frequentes
ActivitySchema.index({ user: 1, createdAt: -1 });
ActivitySchema.index({ type: 1, createdAt: -1 });
ActivitySchema.index({ createdAt: -1 });

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);


