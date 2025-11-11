import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from './BaseDocument';

export interface IGamificationConfig extends IBaseDocument {
  department?: string; // null = global
  action: string; // task_completed, report_submitted, etc
  basePoints: number;
  multipliers: Record<string, number>; // Ex: { priority_high: 1.5, priority_low: 0.8 }
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GamificationConfigSchema = new Schema<IGamificationConfig>(
  {
    department: {
      type: String,
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    basePoints: {
      type: Number,
      required: true,
      min: 0,
    },
    multipliers: {
      type: Schema.Types.Mixed,
      default: {},
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

GamificationConfigSchema.index({ department: 1, action: 1 }, { unique: true });

export const GamificationConfig = mongoose.model<IGamificationConfig>(
  'GamificationConfig',
  GamificationConfigSchema
);


