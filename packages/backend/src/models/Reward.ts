import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from './BaseDocument';

export interface IReward extends IBaseDocument {
  name: string;
  description: string;
  type: 'virtual' | 'real';
  cost: number; // custo em moeda virtual
  category: string;
  image?: string;
  stock?: number; // stock disponível (opcional, apenas para recompensas reais)
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRewardRedemption extends IBaseDocument {
  user: mongoose.Types.ObjectId;
  reward: mongoose.Types.ObjectId;
  quantity: number;
  status: 'pending' | 'fulfilled' | 'cancelled';
  redeemedAt: Date;
  fulfilledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RewardSchema = new Schema<IReward>(
  {
    name: {
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
      enum: ['virtual', 'real'],
      required: true,
      index: true,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    image: {
      type: String,
    },
    stock: {
      type: Number,
      min: 0,
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

const RewardRedemptionSchema = new Schema<IRewardRedemption>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reward: {
      type: Schema.Types.ObjectId,
      ref: 'Reward',
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'fulfilled', 'cancelled'],
      default: 'pending',
      index: true,
    },
    redeemedAt: {
      type: Date,
      default: Date.now,
    },
    fulfilledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

RewardRedemptionSchema.index({ user: 1, createdAt: -1 });
RewardRedemptionSchema.index({ reward: 1, status: 1 });

export const Reward = mongoose.model<IReward>('Reward', RewardSchema);
export const RewardRedemption = mongoose.model<IRewardRedemption>(
  'RewardRedemption',
  RewardRedemptionSchema
);


