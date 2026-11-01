import mongoose, { Document, Schema } from 'mongoose';

export interface ITicketActivity extends Document {
  organizationId: mongoose.Types.ObjectId;
  ticketId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action:
    | 'created'
    | 'assigned'
    | 'reassigned'
    | 'priority_changed'
    | 'status_changed'
    | 'comment_added'
    | 'attachment_uploaded'
    | 'resolved'
    | 'closed'
    | 'reopened'
    | 'updated';
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
  createdAt: Date;
}

const TicketActivitySchema = new Schema<ITicketActivity>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: [
        'created',
        'assigned',
        'reassigned',
        'priority_changed',
        'status_changed',
        'comment_added',
        'attachment_uploaded',
        'resolved',
        'closed',
        'reopened',
        'updated',
      ],
      required: true,
      index: true,
    },
    fieldChanged: { type: String },
    oldValue: { type: String },
    newValue: { type: String },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

TicketActivitySchema.index({ organizationId: 1, ticketId: 1, createdAt: -1 });

export const TicketActivity = mongoose.model<ITicketActivity>('TicketActivity', TicketActivitySchema);

