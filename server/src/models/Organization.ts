import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  logoUrl?: string;
  website?: string;
  industry?: string;
  size?: string;
  status: 'active' | 'suspended';
  ownerId: mongoose.Types.ObjectId;
  subscriptionPlan: 'free' | 'starter' | 'professional' | 'business' | 'enterprise';
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
  trialEndsAt: Date;
  settings: {
    ticketPrefix: string;
    allowedAttachmentTypes: string[];
    maxAttachmentSizeMB: number;
    defaultAssigneeId?: mongoose.Types.ObjectId;
    timezone: string;
    allowExternalReporters: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    logoUrl: { type: String, default: '' },
    website: { type: String, default: '' },
    industry: { type: String, default: 'Technology' },
    size: { type: String, default: '1-10' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscriptionPlan: {
      type: String,
      enum: ['free', 'starter', 'professional', 'business', 'enterprise'],
      default: 'free',
      index: true,
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled', 'expired'],
      default: 'trialing',
      index: true,
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
    },
    settings: {
      ticketPrefix: { type: String, default: 'QUB', uppercase: true, trim: true },
      allowedAttachmentTypes: {
        type: [String],
        default: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      },
      maxAttachmentSizeMB: { type: Number, default: 15 },
      defaultAssigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
      timezone: { type: String, default: 'UTC' },
      allowExternalReporters: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);

