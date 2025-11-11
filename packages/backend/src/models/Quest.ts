import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from './BaseDocument';

export interface IQuest extends IBaseDocument {
  title: string;
  description: string;
  narrative: string; // storytelling contextualizado
  objectives: Array<{
    description: string;
    type: string;
    target: number;
    completed: boolean;
  }>;
  rewards: {
    badges?: mongoose.Types.ObjectId[];
    currency?: number;
    points?: number;
  };
  status: 'available' | 'in-progress' | 'completed';
  createdBy: mongoose.Types.ObjectId;
  relatedChallenge?: mongoose.Types.ObjectId;
  prerequisites?: mongoose.Types.ObjectId[]; // Quests que devem ser completadas antes
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuestProgress extends IBaseDocument {
  quest: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  objectivesProgress: Array<{
    objectiveIndex: number;
    current: number;
    completed: boolean;
  }>;
  status: 'in-progress' | 'completed';
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestSchema = new Schema<IQuest>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    narrative: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    objectives: [
      {
        description: { type: String, required: true },
        type: { type: String, required: true },
        target: { type: Number, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    rewards: {
      badges: [{ type: Schema.Types.ObjectId, ref: 'Badge' }],
      currency: { type: Number, default: 0 },
      points: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['available', 'in-progress', 'completed'],
      default: 'available',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    relatedChallenge: {
      type: Schema.Types.ObjectId,
      ref: 'Challenge',
    },
    prerequisites: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Quest',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const QuestProgressSchema = new Schema<IQuestProgress>(
  {
    quest: {
      type: Schema.Types.ObjectId,
      ref: 'Quest',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    objectivesProgress: [
      {
        objectiveIndex: { type: Number, required: true },
        current: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
      },
    ],
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'in-progress',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

QuestProgressSchema.index({ quest: 1, user: 1 }, { unique: true });
QuestProgressSchema.index({ user: 1, status: 1 });

export const Quest = mongoose.model<IQuest>('Quest', QuestSchema);
export const QuestProgress = mongoose.model<IQuestProgress>('QuestProgress', QuestProgressSchema);


