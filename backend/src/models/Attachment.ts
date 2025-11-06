import mongoose, { Schema, Document } from 'mongoose';

export interface IAttachment extends Document {
  task_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
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
    filename: {
      type: String,
      required: true,
    },
    original_filename: {
      type: String,
      required: true,
    },
    file_path: {
      type: String,
      required: true,
    },
    file_size: {
      type: Number,
      required: true,
    },
    mime_type: {
      type: String,
      required: true,
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
AttachmentSchema.index({ task_id: 1 });
AttachmentSchema.index({ user_id: 1 });
AttachmentSchema.index({ created_at: -1 });

export default mongoose.model<IAttachment>('Attachment', AttachmentSchema);

