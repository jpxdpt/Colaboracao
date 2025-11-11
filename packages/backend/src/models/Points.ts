import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from './BaseDocument';

export interface IPoints extends IBaseDocument {
  user: mongoose.Types.ObjectId;
  amount: number;
  source: string; // task/goal/report/training/challenge/etc
  description: string;
  timestamp: Date;
  audited: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const PointsSchema = new Schema<IPoints>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    source: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    audited: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

PointsSchema.index({ user: 1, timestamp: -1 });
PointsSchema.index({ source: 1, timestamp: -1 });
PointsSchema.index({ user: 1, source: 1 });

export const Points = mongoose.model<IPoints>('Points', PointsSchema);


