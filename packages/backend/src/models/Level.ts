import mongoose, { Schema, Document } from 'mongoose';

export interface ILevel extends Document {
  level: number;
  pointsRequired: number;
  name: string;
  color: string;
  benefits: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LevelSchema = new Schema<ILevel>(
  {
    level: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      index: true,
    },
    pointsRequired: {
      type: Number,
      required: true,
      min: 0,
    },
    name: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    benefits: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Level = mongoose.model<ILevel>('Level', LevelSchema);

