import mongoose, { Document, Schema } from 'mongoose';

export interface ITicketAttachment extends Document {
  organizationId: mongoose.Types.ObjectId;
  ticketId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  originalName: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TicketAttachmentSchema = new Schema<ITicketAttachment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    uploadedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

TicketAttachmentSchema.index({ organizationId: 1, ticketId: 1 });

export const TicketAttachment = mongoose.model<ITicketAttachment>('TicketAttachment', TicketAttachmentSchema);

