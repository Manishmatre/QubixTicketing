import mongoose, { Document, Schema } from 'mongoose';
import { OrgRole } from './OrganizationMembership.js';

export interface IInvitation extends Document {
  organizationId: mongoose.Types.ObjectId;
  email: string;
  role: OrgRole;
  token: string;
  invitedBy: mongoose.Types.ObjectId;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'revoked';
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'project_manager', 'team_lead', 'employee', 'reporter', 'viewer'],
      default: 'employee',
    },
    token: { type: String, required: true, unique: true, index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'revoked'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

InvitationSchema.index({ organizationId: 1, email: 1, status: 1 });

export const Invitation = mongoose.model<IInvitation>('Invitation', InvitationSchema);

