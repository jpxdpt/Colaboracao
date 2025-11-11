import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from './BaseDocument';

export interface ITeamMessage extends IBaseDocument {
  team: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMessageSchema = new Schema<ITeamMessage>(
  {
    team: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

TeamMessageSchema.index({ team: 1, createdAt: -1 });

export const TeamMessage = mongoose.model<ITeamMessage>('TeamMessage', TeamMessageSchema);



