import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import { UserRole } from '@gamify/shared';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  department: string;
  role: UserRole;
  avatar?: string;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  preferences: {
    notifications: {
      achievements: boolean;
      tasks: boolean;
      goals: boolean;
      challenges: boolean;
      recognition: boolean;
      streaks: boolean;
      levelUps: boolean;
      email: boolean;
    };
    theme: 'light' | 'dark';
    language: string;
    privacy: {
      showProfile: boolean;
      showStats: boolean;
      showBadges: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Não retornar password por padrão
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      index: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    preferences: {
      notifications: {
        achievements: { type: Boolean, default: true },
        tasks: { type: Boolean, default: true },
        goals: { type: Boolean, default: true },
        challenges: { type: Boolean, default: true },
        recognition: { type: Boolean, default: true },
        streaks: { type: Boolean, default: true },
        levelUps: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
      },
      theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light',
      },
      language: {
        type: String,
        default: 'pt',
      },
      privacy: {
        showProfile: { type: Boolean, default: true },
        showStats: { type: Boolean, default: true },
        showBadges: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password antes de salvar
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Método para comparar password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);


