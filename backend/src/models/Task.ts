import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  assigned_to?: mongoose.Types.ObjectId[];
  created_by: mongoose.Types.ObjectId;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  deadline?: Date;
  start_date?: Date;
  tags?: string[];
  parent_task_id?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    assigned_to: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    deadline: {
      type: Date,
      default: null,
    },
    start_date: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    parent_task_id: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Middleware para atualizar updated_at antes de salvar
TaskSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.updated_at = new Date();
  }
  next();
});

// Índices
TaskSchema.index({ assigned_to: 1 });
TaskSchema.index({ created_by: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ tags: 1 });
TaskSchema.index({ parent_task_id: 1 });
TaskSchema.index({ deadline: 1 });

export default mongoose.model<ITask>('Task', TaskSchema);

