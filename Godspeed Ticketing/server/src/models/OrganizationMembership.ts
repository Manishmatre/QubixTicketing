import mongoose, { Document, Schema } from 'mongoose';

export type OrgRole =
  | 'owner'
  | 'admin'
  | 'project_manager'
  | 'team_lead'
  | 'employee'
  | 'reporter'
  | 'viewer';

export interface IOrganizationMembership extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: OrgRole;
  jobTitle?: string;
  department?: string;
  status: 'active' | 'inactive';
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationMembershipSchema = new Schema<IOrganizationMembership>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'project_manager', 'team_lead', 'employee', 'reporter', 'viewer'],
      default: 'employee',
      index: true,
    },
    jobTitle: { type: String, default: '' },
    department: { type: String, default: 'General' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness per user per org
OrganizationMembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export const OrganizationMembership = mongoose.model<IOrganizationMembership>(
  'OrganizationMembership',
  OrganizationMembershipSchema
);

