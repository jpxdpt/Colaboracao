import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanion extends Document {
  user: mongoose.Types.ObjectId;
  type: string; // tipo do companheiro (pet, companion, etc)
  name: string;
  level: number;
  experience: number;
  currentEvolution: number; // nível de evolução atual (0, 1, 2, etc)
  nextEvolutionLevel: number; // nível necessário para próxima evolução
  unlockedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CompanionSchema = new Schema<ICompanion>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Um utilizador tem apenas um companheiro ativo
      index: true,
    },
    type: {
      type: String,
      required: true,
      default: 'pet',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    experience: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentEvolution: {
      type: Number,
      default: 0,
      min: 0,
    },
    nextEvolutionLevel: {
      type: Number,
      default: 5, // Evolui a cada 5 níveis
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

CompanionSchema.index({ user: 1 });
CompanionSchema.index({ level: 1 });

export const Companion = mongoose.model<ICompanion>('Companion', CompanionSchema);

