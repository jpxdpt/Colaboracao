import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  user_id: mongoose.Types.ObjectId;
  task_id?: mongoose.Types.ObjectId;
  type: 'task_assigned' | 'task_updated' | 'task_overdue' | 'comment_added' | 'deadline_approaching';
  title: string;
  message: string;
  read: boolean;
  created_at: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    task_id: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    type: {
      type: String,
      required: true,
      enum: ['task_assigned', 'task_updated', 'task_overdue', 'comment_added', 'deadline_approaching'],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
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
NotificationSchema.index({ user_id: 1, read: 1 });
NotificationSchema.index({ created_at: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);

