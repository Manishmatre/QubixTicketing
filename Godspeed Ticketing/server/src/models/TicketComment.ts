import mongoose, { Document, Schema } from 'mongoose';

export interface ICommentReaction {
  emoji: string;
  userIds: mongoose.Types.ObjectId[];
}

export interface ITicketComment extends Document {
  organizationId: mongoose.Types.ObjectId;
  ticketId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  isInternal: boolean;
  parentCommentId?: mongoose.Types.ObjectId;
  attachments: string[];
  reactions: ICommentReaction[];
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TicketCommentSchema = new Schema<ITicketComment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    isInternal: { type: Boolean, default: false, index: true },
    parentCommentId: { type: Schema.Types.ObjectId, ref: 'TicketComment' },
    attachments: [{ type: String }],
    reactions: [
      {
        emoji: { type: String, required: true },
        userIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
  },
  { timestamps: true }
);

TicketCommentSchema.index({ organizationId: 1, ticketId: 1, createdAt: 1 });

export const TicketComment = mongoose.model<ITicketComment>('TicketComment', TicketCommentSchema);

