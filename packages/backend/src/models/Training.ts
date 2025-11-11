import mongoose, { Schema, Document } from 'mongoose';

export interface ITraining extends Document {
  title: string;
  description: string;
  category: string;
  content: {
    type: 'text' | 'video' | 'quiz';
    data: unknown; // Texto, URL do vídeo, ou array de questões
  };
  estimatedDuration: number; // em minutos
  pointsOnCompletion: number;
  relatedBadges: mongoose.Types.ObjectId[];
  prerequisites: mongoose.Types.ObjectId[]; // IDs de outros trainings
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITrainingProgress extends Document {
  user: mongoose.Types.ObjectId;
  training: mongoose.Types.ObjectId;
  progress: number; // percentagem 0-100
  completedModules: string[];
  lastActivity: Date;
  completed: boolean;
  certificateIssued: boolean;
  pointsEarned: number;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TrainingSchema = new Schema<ITraining>(
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
    category: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: {
        type: String,
        enum: ['text', 'video', 'quiz'],
        required: true,
      },
      data: {
        type: Schema.Types.Mixed,
        required: true,
      },
    },
    estimatedDuration: {
      type: Number,
      required: true,
      min: 1,
    },
    pointsOnCompletion: {
      type: Number,
      default: 0,
      min: 0,
    },
    relatedBadges: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Badge',
      },
    ],
    prerequisites: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Training',
      },
    ],
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

const TrainingProgressSchema = new Schema<ITrainingProgress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    training: {
      type: Schema.Types.ObjectId,
      ref: 'Training',
      required: true,
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedModules: [
      {
        type: String,
      },
    ],
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    pointsEarned: {
      type: Number,
      default: 0,
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

TrainingProgressSchema.index({ user: 1, training: 1 }, { unique: true });
TrainingProgressSchema.index({ user: 1, completed: 1 });
TrainingProgressSchema.index({ training: 1, completed: 1 });

export const Training = mongoose.model<ITraining>('Training', TrainingSchema);
export const TrainingProgress = mongoose.model<ITrainingProgress>(
  'TrainingProgress',
  TrainingProgressSchema
);

