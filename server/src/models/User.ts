import mongoose, { Document, Schema } from 'mongoose';

export interface IUserDocument {
  _id?: mongoose.Types.ObjectId;
  title: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phoneNumber?: string;
  passwordHash: string;
  avatarUrl?: string;
  documents?: IUserDocument[];
  isSuperAdmin: boolean;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
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
    phoneNumber: { type: String, default: '', trim: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    documents: [
      {
        title: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileName: { type: String, required: true },
        mimeType: { type: String, required: true },
        sizeBytes: { type: Number, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    isSuperAdmin: { type: Boolean, default: false, index: true },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, index: true },
    verificationTokenExpires: { type: Date },
    resetPasswordToken: { type: String, index: true },
    resetPasswordExpires: { type: Date },
    activeOrganizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    lastLoginAt: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);

