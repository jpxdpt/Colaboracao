import mongoose, { Schema, Document } from 'mongoose';

export interface ITimeEntry extends Document {
  task_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  start_time: Date;
  end_time?: Date;
  duration?: number; // em minutos
  description?: string;
  created_at: Date;
  updated_at: Date;
}

const TimeEntrySchema = new Schema<ITimeEntry>(
  {
    task_id: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    start_time: {
      type: Date,
      required: true,
    },
    end_time: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0, // em minutos
    },
    description: {
      type: String,
      trim: true,
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

// Middleware para calcular duração antes de salvar
TimeEntrySchema.pre('save', function (next) {
  if (this.end_time && this.start_time) {
    const diff = this.end_time.getTime() - this.start_time.getTime();
    this.duration = Math.round(diff / 1000 / 60); // converter para minutos
  }
  if (this.isModified() && !this.isNew) {
    this.updated_at = new Date();
  }
  next();
});

// Índices
TimeEntrySchema.index({ task_id: 1 });
TimeEntrySchema.index({ user_id: 1 });
TimeEntrySchema.index({ start_time: -1 });

export default mongoose.model<ITimeEntry>('TimeEntry', TimeEntrySchema);

