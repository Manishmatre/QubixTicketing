import mongoose, { Document, Schema } from 'mongoose';

export type TicketCategory =
  | 'Task'
  | 'Feature'
  | 'Improvement'
  | 'Bug'
  | 'General Work'
  | 'Operations'
  | 'Client Request'
  | 'UI/UX Design'
  | 'Documentation'
  | 'Technical Support'
  | 'Backend Issue'
  | 'Frontend Issue'
  | 'Security Issue'
  | 'Performance Issue'
  | 'General Request'
  | 'Other';

export type TicketPriority = 'Critical' | 'Urgent' | 'High' | 'Normal' | 'Low';

export type TicketStatus =
  | 'Open'
  | 'To Do'
  | 'In Progress'
  | 'Under Review'
  | 'Waiting for Response'
  | 'On Hold'
  | 'Resolved'
  | 'Closed'
  | 'Reopened';

export interface ITicketLink {
  _id?: string;
  title: string;
  url: string;
  type?: string;
  createdAt?: Date;
}

export interface ITicketSubtask {
  id: string;
  title: string;
  done: boolean;
  num?: string;
}

export interface ITicket extends Document {
  organizationId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  ticketNumber: string; // e.g. QUB-000123
  sequenceNumber: number;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  reporterId: mongoose.Types.ObjectId;
  assigneeId?: mongoose.Types.ObjectId;
  assigneeIds?: mongoose.Types.ObjectId[];
  watchers: mongoose.Types.ObjectId[];
  tags: string[];
  links: ITicketLink[];
  subtasks: ITicketSubtask[];
  dueDate?: Date;
  relatedTicketIds: mongoose.Types.ObjectId[];
  order: number;
  commentCount: number;
  attachmentCount: number;
  resolvedAt?: Date;
  closedAt?: Date;
  resolutionSummary?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    ticketNumber: { type: String, required: true, index: true },
    sequenceNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: [
        'Task',
        'Feature',
        'Improvement',
        'Bug',
        'General Work',
        'Operations',
        'Client Request',
        'UI/UX Design',
        'Documentation',
        'Technical Support',
        'Backend Issue',
        'Frontend Issue',
        'Security Issue',
        'Performance Issue',
        'General Request',
        'Other',
      ],
      default: 'Task',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Critical', 'Urgent', 'High', 'Normal', 'Low'],
      default: 'Normal',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'Open',
        'To Do',
        'In Progress',
        'Under Review',
        'Waiting for Response',
        'On Hold',
        'Resolved',
        'Closed',
        'Reopened',
      ],
      default: 'To Do',
      index: true,
    },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    assigneeIds: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    watchers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    tags: [{ type: String, trim: true }],
    links: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, default: 'web' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    subtasks: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        done: { type: Boolean, default: false },
        num: { type: String },
      },
    ],
    dueDate: { type: Date, index: true },
    relatedTicketIds: [{ type: Schema.Types.ObjectId, ref: 'Ticket' }],
    order: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    attachmentCount: { type: Number, default: 0 },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    resolutionSummary: { type: String, default: '' },
    isArchived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Compound indexes for high-speed multi-tenant queries
TicketSchema.index({ organizationId: 1, projectId: 1, status: 1 });
TicketSchema.index({ organizationId: 1, assigneeId: 1, status: 1 });
TicketSchema.index({ organizationId: 1, assigneeIds: 1, status: 1 });
TicketSchema.index({ organizationId: 1, sequenceNumber: 1 });
TicketSchema.index({ organizationId: 1, ticketNumber: 1 }, { unique: true });

export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema);

