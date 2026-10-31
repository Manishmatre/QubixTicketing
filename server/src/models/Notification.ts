import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'ticket_assigned'
  | 'ticket_reassigned'
  | 'ticket_comment'
  | 'ticket_mention'
  | 'priority_changed'
  | 'status_changed'
  | 'due_date_approaching'
  | 'ticket_overdue'
  | 'ticket_resolved'
  | 'project_invitation'
  | 'member_joined'
  | 'system_announcement';

export interface INotification extends Document {
  organizationId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  relatedEntityId?: mongoose.Types.ObjectId;
  relatedEntityType?: 'ticket' | 'project' | 'organization' | 'comment';
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    relatedEntityId: { type: Schema.Types.ObjectId },
    relatedEntityType: { type: String, enum: ['ticket', 'project', 'organization', 'comment'] },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  { timestamps: true }
);

NotificationSchema.index({ organizationId: 1, recipientId: 1, isRead: 1 });
NotificationSchema.index({ organizationId: 1, recipientId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

