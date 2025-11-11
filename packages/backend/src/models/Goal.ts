import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from './BaseDocument';
import { GoalType } from '@taskify/shared';

export interface IGoal extends IBaseDocument {
  title: string;
  description?: string;
  type: GoalType;
  currentProgress: number;
  target: number;
  unit: string;
  dueDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  status: 'active' | 'completed' | 'cancelled';
  milestones: Array<{
    target: number;
    reward: string;
    achieved: boolean;
    achievedAt?: Date;
  }>;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: Object.values(GoalType),
      required: true,
      index: true,
    },
    currentProgress: {
      type: Number,
      default: 0,
      min: 0,
    },
    target: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      required: true,
      default: 'unidades',
    },
    dueDate: {
      type: Date,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
    milestones: [
      {
        target: { type: Number, required: true },
        reward: { type: String, required: true },
        achieved: { type: Boolean, default: false },
        achievedAt: { type: Date },
      },
    ],
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

GoalSchema.index({ status: 1, createdBy: 1 });
GoalSchema.index({ type: 1, status: 1 });

export const Goal = mongoose.model<IGoal>('Goal', GoalSchema);


