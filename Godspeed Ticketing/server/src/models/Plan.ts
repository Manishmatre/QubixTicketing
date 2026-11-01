import mongoose, { Document, Schema } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  code: 'free' | 'starter' | 'professional' | 'business' | 'enterprise';
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxUsers: number;
  maxProjects: number;
  maxStorageMB: number;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true },
    code: {
      type: String,
      enum: ['free', 'starter', 'professional', 'business', 'enterprise'],
      required: true,
      unique: true,
      index: true,
    },
    description: { type: String, required: true },
    priceMonthly: { type: Number, required: true },
    priceYearly: { type: Number, required: true },
    maxUsers: { type: Number, required: true },
    maxProjects: { type: Number, required: true },
    maxStorageMB: { type: Number, required: true },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Plan = mongoose.model<IPlan>('Plan', PlanSchema);

