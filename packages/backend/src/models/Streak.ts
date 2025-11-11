import mongoose, { Schema, Document } from 'mongoose';

export interface IStreak extends Document {
  user: mongoose.Types.ObjectId;
  type: string; // daily_tasks, training, reports, etc
  consecutiveDays: number;
  lastActivity: Date;
  longestStreak: number; // record pessoal
  rewardsReceived: Array<{
    day: number;
    reward: string;
    receivedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const StreakSchema = new Schema<IStreak>(
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
      index: true,
    },
    consecutiveDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    rewardsReceived: [
      {
        day: { type: Number, required: true },
        reward: { type: String, required: true },
        receivedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

StreakSchema.index({ user: 1, type: 1 }, { unique: true });
StreakSchema.index({ user: 1, lastActivity: -1 });

export const Streak = mongoose.model<IStreak>('Streak', StreakSchema);

