import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  isSuperAdmin: boolean;
  isVerified: boolean;
  activeOrganizationId?: mongoose.Types.ObjectId;
  lastLoginAt?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    isSuperAdmin: { type: Boolean, default: false, index: true },
    isVerified: { type: Boolean, default: true },
    activeOrganizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    lastLoginAt: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);

