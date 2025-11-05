import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  task_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  content: string;
  created_at: Date;
}

const CommentSchema = new Schema<IComment>(
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
    content: {
      type: String,
      required: true,
      trim: true,
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
CommentSchema.index({ task_id: 1 });

export default mongoose.model<IComment>('Comment', CommentSchema);

