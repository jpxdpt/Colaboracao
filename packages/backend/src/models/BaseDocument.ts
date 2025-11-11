import mongoose, { Document } from 'mongoose';

export interface IBaseDocument extends Document {
  _id: mongoose.Types.ObjectId;
}


