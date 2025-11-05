import mongoose, { Schema, Document } from 'mongoose';

export interface ITag extends Document {
  name: string;
  color: string;
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
}

const TagSchema = new Schema<ITag>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    color: {
      type: String,
      required: true,
      default: '#3B82F6',
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

export default mongoose.model<ITag>('Tag', TagSchema);

