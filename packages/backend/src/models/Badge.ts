import mongoose, { Schema, Document } from 'mongoose';
import { BadgeRarity } from '@gamify/shared';

export interface IBadge extends Document {
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  category: string;
  criteria: mongoose.Types.ObjectId;
  socialBadge?: boolean; // Se true, é um badge social (dado por outros utilizadores)
  createdAt: Date;
  updatedAt: Date;
}

export interface IBadgeCriteria extends Document {
  badge: mongoose.Types.ObjectId;
  type: 'count' | 'threshold' | 'combo';
  value: number;
  currentProgress: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserBadge extends Document {
  user: mongoose.Types.ObjectId;
  badge: mongoose.Types.ObjectId;
  earnedAt: Date;
  createdAt: Date;
}

const BadgeSchema = new Schema<IBadge>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    rarity: {
      type: String,
      enum: Object.values(BadgeRarity),
      default: BadgeRarity.COMMON,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    socialBadge: {
      type: Boolean,
      default: false,
      index: true,
    },
    criteria: {
      type: Schema.Types.ObjectId,
      ref: 'BadgeCriteria',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const BadgeCriteriaSchema = new Schema<IBadgeCriteria>(
  {
    badge: {
      type: Schema.Types.ObjectId,
      ref: 'Badge',
      required: true,
    },
    type: {
      type: String,
      enum: ['count', 'threshold', 'combo'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 1,
    },
    currentProgress: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const UserBadgeSchema = new Schema<IUserBadge>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    badge: {
      type: Schema.Types.ObjectId,
      ref: 'Badge',
      required: true,
      index: true,
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

UserBadgeSchema.index({ user: 1, badge: 1 }, { unique: true });

export const Badge = mongoose.model<IBadge>('Badge', BadgeSchema);
export const BadgeCriteria = mongoose.model<IBadgeCriteria>('BadgeCriteria', BadgeCriteriaSchema);
export const UserBadge = mongoose.model<IUserBadge>('UserBadge', UserBadgeSchema);

