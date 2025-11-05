import mongoose, { Schema, Document } from 'mongoose';

export interface ITaskTemplate extends Document {
  name: string;
  description?: string;
  title: string;
  default_description?: string;
  default_priority: 'low' | 'medium' | 'high';
  default_tags?: string[];
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
}

const TaskTemplateSchema = new Schema<ITaskTemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    default_description: {
      type: String,
      trim: true,
    },
    default_priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    default_tags: {
      type: [String],
      default: [],
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

export default mongoose.model<ITaskTemplate>('TaskTemplate', TaskTemplateSchema);

