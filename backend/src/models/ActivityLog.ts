import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  task_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  action: string;
  field?: string;
  old_value?: any;
  new_value?: any;
  created_at: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
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
    action: {
      type: String,
      required: true,
      enum: ['created', 'updated', 'deleted', 'status_changed', 'assigned', 'comment_added'],
    },
    field: {
      type: String,
    },
    old_value: {
      type: Schema.Types.Mixed,
    },
    new_value: {
      type: Schema.Types.Mixed,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Índices
ActivityLogSchema.index({ task_id: 1 });
ActivityLogSchema.index({ user_id: 1 });
ActivityLogSchema.index({ created_at: -1 });

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);

