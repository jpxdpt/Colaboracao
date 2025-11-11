import mongoose, { Schema, Document } from 'mongoose';

export interface IPeerRecognition extends Document {
  from: mongoose.Types.ObjectId; // quem dá o reconhecimento
  to: mongoose.Types.ObjectId; // quem recebe
  type: 'kudos' | 'thanks' | 'appreciation';
  message: string;
  points?: number; // pontos opcionais
  public: boolean;
  createdAt: Date;
}

const PeerRecognitionSchema = new Schema<IPeerRecognition>(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['kudos', 'thanks', 'appreciation'],
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    points: {
      type: Number,
      min: 0,
    },
    public: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

PeerRecognitionSchema.index({ to: 1, createdAt: -1 });
PeerRecognitionSchema.index({ from: 1, createdAt: -1 });
PeerRecognitionSchema.index({ public: 1, createdAt: -1 });

export const PeerRecognition = mongoose.model<IPeerRecognition>(
  'PeerRecognition',
  PeerRecognitionSchema
);

