import mongoose, { Document, Schema } from 'mongoose';

export type WorkflowTrigger =
  | 'ticket_created'
  | 'priority_urgent'
  | 'ticket_assigned'
  | 'ticket_overdue'
  | 'ticket_resolved'
  | 'comment_received';

export type WorkflowActionType =
  | 'assign_to_user'
  | 'change_priority'
  | 'change_status'
  | 'send_notification'
  | 'send_email'
  | 'add_tag';

export interface IWorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'is_empty' | 'is_not_empty';
  value: string;
}

export interface IWorkflowAction {
  type: WorkflowActionType;
  params: Record<string, any>;
}

export interface IWorkflow extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  triggerEvent: WorkflowTrigger;
  conditions: IWorkflowCondition[];
  actions: IWorkflowAction[];
  isActive: boolean;
  runCount: number;
  lastRunAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowSchema = new Schema<IWorkflow>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    triggerEvent: {
      type: String,
      required: true,
      enum: [
        'ticket_created',
        'priority_urgent',
        'ticket_assigned',
        'ticket_overdue',
        'ticket_resolved',
        'comment_received',
      ],
      index: true,
    },
    conditions: [
      {
        field: { type: String, required: true },
        operator: {
          type: String,
          enum: ['equals', 'not_equals', 'contains', 'is_empty', 'is_not_empty'],
          default: 'equals',
        },
        value: { type: String, default: '' },
      },
    ],
    actions: [
      {
        type: {
          type: String,
          required: true,
          enum: [
            'assign_to_user',
            'change_priority',
            'change_status',
            'send_notification',
            'send_email',
            'add_tag',
          ],
        },
        params: { type: Schema.Types.Mixed, default: {} },
      },
    ],
    isActive: { type: Boolean, default: true, index: true },
    runCount: { type: Number, default: 0 },
    lastRunAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

WorkflowSchema.index({ organizationId: 1, triggerEvent: 1, isActive: 1 });

export const Workflow = mongoose.model<IWorkflow>('Workflow', WorkflowSchema);

