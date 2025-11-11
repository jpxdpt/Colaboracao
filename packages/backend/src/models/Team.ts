import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  description: string;
  avatar?: string;
  logo?: string;
  createdBy: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  totalPoints: number;
  activeChallenges: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITeamMember extends Document {
  team: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  role: 'member' | 'leader';
  pointsContributed: number;
  joinedAt: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    avatar: {
      type: String,
    },
    logo: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    activeChallenges: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Challenge',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const TeamMemberSchema = new Schema<ITeamMember>(
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
    role: {
      type: String,
      enum: ['member', 'leader'],
      default: 'member',
      index: true,
    },
    pointsContributed: {
      type: Number,
      default: 0,
      min: 0,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

TeamMemberSchema.index({ team: 1, user: 1 }, { unique: true });
TeamMemberSchema.index({ user: 1, active: 1 });

export const Team = mongoose.model<ITeam>('Team', TeamSchema);
export const TeamMember = mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema);

