import { Types } from 'mongoose';

declare module 'mongoose' {
  interface Document {
    _id: Types.ObjectId;
  }
}

