import mongoose, { Document, Schema } from 'mongoose';

export interface IPlatformSetting extends Document {
  key: string;
  maintenanceMode: boolean;
  announcementBanner: {
    enabled: boolean;
    message: string;
    type: 'info' | 'warning' | 'alert' | 'success';
  };
  allowRegistrations: boolean;
  defaultPlan: string;
  supportEmail: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformSettingSchema = new Schema<IPlatformSetting>(
  {
    key: { type: String, required: true, unique: true, default: 'global_config' },
    maintenanceMode: { type: Boolean, default: false },
    announcementBanner: {
      enabled: { type: Boolean, default: false },
      message: { type: String, default: '' },
      type: { type: String, enum: ['info', 'warning', 'alert', 'success'], default: 'info' },
    },
    allowRegistrations: { type: Boolean, default: true },
    defaultPlan: { type: String, default: 'free' },
    supportEmail: { type: String, default: 'support@qubixdesk.com' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const PlatformSetting = mongoose.model<IPlatformSetting>('PlatformSetting', PlatformSettingSchema);
