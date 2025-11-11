import mongoose, { Schema, Document } from 'mongoose';
import { RankingType } from '@gamify/shared';

export interface IRanking extends Document {
  type: RankingType;
  periodStart: Date;
  periodEnd: Date;
  user: mongoose.Types.ObjectId;
  points: number;
  position: number;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RankingSchema = new Schema<IRanking>(
  {
    type: {
      type: String,
      enum: Object.values(RankingType),
      required: true,
      index: true,
    },
    periodStart: {
      type: Date,
      required: true,
      index: true,
    },
    periodEnd: {
      type: Date,
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    points: {
      type: Number,
      required: true,
      default: 0,
    },
    position: {
      type: Number,
      required: true,
      min: 1,
    },
    department: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

RankingSchema.index({ type: 1, periodStart: -1, points: -1 });
RankingSchema.index({ type: 1, user: 1, periodStart: -1 });
RankingSchema.index({ type: 1, department: 1, periodStart: -1, points: -1 });

export const Ranking = mongoose.model<IRanking>('Ranking', RankingSchema);

