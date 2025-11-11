import mongoose, { Schema, Document } from 'mongoose';
import { TaskStatus } from '@gamify/shared';

export interface ITask extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  assignedTo?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  supervisor?: mongoose.Types.ObjectId;
  parentTask?: mongoose.Types.ObjectId;
  requiresValidation: boolean;
  points: number;
  completedAt?: Date;
  validatedAt?: Date;
  validatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.PENDING,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    supervisor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    parentTask: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      index: true,
    },
    requiresValidation: {
      type: Boolean,
      default: false,
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedAt: {
      type: Date,
    },
    validatedAt: {
      type: Date,
    },
    validatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Índices compostos para queries frequentes
TaskSchema.index({ status: 1, assignedTo: 1 });
TaskSchema.index({ status: 1, createdBy: 1 });
TaskSchema.index({ dueDate: 1, status: 1 });

export const Task = mongoose.model<ITask>('Task', TaskSchema);

