import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from './BaseDocument';

export interface IChallenge extends IBaseDocument {
  title: string;
  description: string;
  type: 'weekly' | 'monthly' | 'special';
  startDate: Date;
  endDate: Date;
  objectives: Array<{
    type: string; // task_completed, points_earned, etc
    target: number;
    description: string;
  }>;
  rewards: {
    badges?: mongoose.Types.ObjectId[];
    currency?: number;
    points?: number;
    realRewards?: string[];
  };
  participants: mongoose.Types.ObjectId[];
  teamBased: boolean; // Se true, é um desafio de equipa
  participatingTeams?: mongoose.Types.ObjectId[]; // Equipas participantes (se teamBased = true)
  status: 'upcoming' | 'active' | 'ended';
  rewardsDistributed?: boolean; // Se as recompensas já foram distribuídas
  createdAt: Date;
  updatedAt: Date;
}

export interface IChallengeProgress extends IBaseDocument {
  challenge: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  progress: Array<{
    objectiveIndex: number;
    current: number;
    completed: boolean;
  }>;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema = new Schema<IChallenge>(
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
    type: {
      type: String,
      enum: ['weekly', 'monthly', 'special'],
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    objectives: [
      {
        type: { type: String, required: true },
        target: { type: Number, required: true },
        description: { type: String, required: true },
      },
    ],
    rewards: {
      badges: [{ type: Schema.Types.ObjectId, ref: 'Badge' }],
      currency: { type: Number, default: 0 },
      points: { type: Number, default: 0 },
      realRewards: [{ type: String }],
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    teamBased: {
      type: Boolean,
      default: false,
      index: true,
    },
    participatingTeams: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Team',
      },
    ],
    status: {
      type: String,
      enum: ['upcoming', 'active', 'ended'],
      default: 'upcoming',
      index: true,
    },
    rewardsDistributed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const ChallengeProgressSchema = new Schema<IChallengeProgress>(
  {
    challenge: {
      type: Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    progress: [
      {
        objectiveIndex: { type: Number, required: true },
        current: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
      },
    ],
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

ChallengeProgressSchema.index({ challenge: 1, user: 1 }, { unique: true });
ChallengeProgressSchema.index({ user: 1, completed: 1 });

export interface IChallengeTeamProgress extends IBaseDocument {
  challenge: mongoose.Types.ObjectId;
  team: mongoose.Types.ObjectId;
  progress: Array<{
    objectiveIndex: number;
    current: number;
    completed: boolean;
  }>;
  totalProgress: number; // Progresso total da equipa (soma de todos os objetivos)
  completed: boolean;
  completedAt?: Date;
  rank?: number; // Posição no ranking
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeTeamProgressSchema = new Schema<IChallengeTeamProgress>(
  {
    challenge: {
      type: Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
      index: true,
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    progress: [
      {
        objectiveIndex: { type: Number, required: true },
        current: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
      },
    ],
    totalProgress: {
      type: Number,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    rank: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

ChallengeTeamProgressSchema.index({ challenge: 1, team: 1 }, { unique: true });
ChallengeTeamProgressSchema.index({ challenge: 1, totalProgress: -1 }); // Para ranking

export const Challenge = mongoose.model<IChallenge>('Challenge', ChallengeSchema);
export const ChallengeProgress = mongoose.model<IChallengeProgress>(
  'ChallengeProgress',
  ChallengeProgressSchema
);
export const ChallengeTeamProgress = mongoose.model<IChallengeTeamProgress>(
  'ChallengeTeamProgress',
  ChallengeTeamProgressSchema
);


