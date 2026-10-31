import mongoose, { Document, Schema } from 'mongoose';

export interface IProjectMember {
  userId: mongoose.Types.ObjectId;
  role: 'lead' | 'member' | 'viewer';
  assignedAt: Date;
}

export interface IProjectMilestone {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface IProject extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  key: string;
  description: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  startDate?: Date;
  endDate?: Date;
  targetDate?: Date;
  projectManagerId?: mongoose.Types.ObjectId;
  members: IProjectMember[];
  milestones: IProjectMilestone[];
  ticketStats: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'General' },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent', 'critical'],
      default: 'normal',
      index: true,
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'on_hold', 'completed', 'archived'],
      default: 'active',
      index: true,
    },
    startDate: { type: Date },
    endDate: { type: Date },
    targetDate: { type: Date },
    projectManagerId: { type: Schema.Types.ObjectId, ref: 'User' },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['lead', 'member', 'viewer'], default: 'member' },
        assignedAt: { type: Date, default: Date.now },
      },
    ],
    milestones: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        dueDate: { type: Date, required: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
      },
    ],
    ticketStats: {
      total: { type: Number, default: 0 },
      open: { type: Number, default: 0 },
      inProgress: { type: Number, default: 0 },
      resolved: { type: Number, default: 0 },
      closed: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

ProjectSchema.index({ organizationId: 1, key: 1 }, { unique: true });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);

