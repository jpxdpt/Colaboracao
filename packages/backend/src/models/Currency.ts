import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from './BaseDocument';

export interface ICurrency extends IBaseDocument {
  user: mongoose.Types.ObjectId;
  balance: number;
  transactions: Array<{
    type: 'earn' | 'spend';
    amount: number;
    source: string; // origem/destino
    description: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const CurrencySchema = new Schema<ICurrency>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactions: [
      {
        type: {
          type: String,
          enum: ['earn', 'spend'],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        source: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        metadata: {
          type: Schema.Types.Mixed,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

CurrencySchema.index({ user: 1 });
CurrencySchema.index({ 'transactions.timestamp': -1 });

export const Currency = mongoose.model<ICurrency>('Currency', CurrencySchema);


