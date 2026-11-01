import mongoose from 'mongoose';
import { Workflow, WorkflowTrigger, IWorkflowCondition, IWorkflowAction } from '../models/Workflow.js';
import { Ticket, ITicket } from '../models/Ticket.js';
import { Notification } from '../models/Notification.js';
import { emailService } from './emailAdapter.js';
import { emitToOrg, emitToTicket, emitToUser } from './socket.js';
import { User } from '../models/User.js';

export class WorkflowEngine {
  /**
   * Process workflows matching triggerEvent for a given ticket
   */
  static async triggerTicketWorkflows(
    organizationId: mongoose.Types.ObjectId,
    triggerEvent: WorkflowTrigger,
    ticket: ITicket,
    actorId?: mongoose.Types.ObjectId
  ): Promise<void> {
    try {
      const activeWorkflows = await Workflow.find({
        organizationId,
        triggerEvent,
        isActive: true,
      });

      if (!activeWorkflows || activeWorkflows.length === 0) return;

      for (const workflow of activeWorkflows) {
        const matches = this.evaluateConditions(workflow.conditions, ticket);
        if (!matches) continue;

        console.log(`[WorkflowEngine] Executing workflow "${workflow.name}" (${workflow._id}) on Ticket ${ticket.ticketNumber}`);

        for (const action of workflow.actions) {
          await this.executeAction(organizationId, action, ticket, actorId);
        }

        // Update workflow execution stats
        workflow.runCount = (workflow.runCount || 0) + 1;
        workflow.lastRunAt = new Date();
        await workflow.save();
      }
    } catch (err: any) {
      console.error(`[WorkflowEngine] Error running workflows for ${triggerEvent}:`, err.message);
    }
  }

  private static evaluateConditions(conditions: IWorkflowCondition[], ticket: ITicket): boolean {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every((cond) => {
      const fieldVal = (ticket as any)[cond.field];
      const strVal = fieldVal ? String(fieldVal).toLowerCase() : '';
      const targetVal = cond.value ? cond.value.toLowerCase() : '';

      switch (cond.operator) {
        case 'equals':
          return strVal === targetVal;
        case 'not_equals':
          return strVal !== targetVal;
        case 'contains':
          return strVal.includes(targetVal);
        case 'is_empty':
          return !fieldVal || (Array.isArray(fieldVal) && fieldVal.length === 0);
        case 'is_not_empty':
          return !!fieldVal && (!Array.isArray(fieldVal) || fieldVal.length > 0);
        default:
          return true;
      }
    });
  }

  private static async executeAction(
    organizationId: mongoose.Types.ObjectId,
    action: IWorkflowAction,
    ticket: ITicket,
    _actorId?: mongoose.Types.ObjectId
  ): Promise<void> {
    try {
      switch (action.type) {
        case 'assign_to_user': {
          if (action.params.userId && mongoose.Types.ObjectId.isValid(action.params.userId)) {
            ticket.assigneeId = new mongoose.Types.ObjectId(action.params.userId);
            await ticket.save();
            emitToOrg(organizationId.toString(), 'ticket:updated', ticket);
          }
          break;
        }

        case 'change_priority': {
          if (action.params.priority) {
            ticket.priority = action.params.priority;
            await ticket.save();
            emitToOrg(organizationId.toString(), 'ticket:updated', ticket);
          }
          break;
        }

        case 'change_status': {
          if (action.params.status) {
            ticket.status = action.params.status;
            if (action.params.status === 'Resolved') ticket.resolvedAt = new Date();
            if (action.params.status === 'Closed') ticket.closedAt = new Date();
            await ticket.save();
            emitToOrg(organizationId.toString(), 'ticket:status_changed', ticket);
          }
          break;
        }

        case 'add_tag': {
          if (action.params.tag && !ticket.tags.includes(action.params.tag)) {
            ticket.tags.push(action.params.tag);
            await ticket.save();
            emitToOrg(organizationId.toString(), 'ticket:updated', ticket);
          }
          break;
        }

        case 'send_notification': {
          const recipientId = action.params.recipientId || ticket.assigneeId || ticket.reporterId;
          if (recipientId) {
            const notif = await Notification.create({
              organizationId,
              recipientId,
              type: 'system_announcement',
              title: action.params.title || `Workflow Alert: ${ticket.ticketNumber}`,
              message: action.params.message || `Automated action executed on ${ticket.title}`,
              link: `/workspace/tickets/${ticket._id}`,
              relatedEntityId: ticket._id,
              relatedEntityType: 'ticket',
            });
            emitToUser(recipientId.toString(), 'notification:new', notif);
          }
          break;
        }

        case 'send_email': {
          const recipientUser = action.params.userId
            ? await User.findById(action.params.userId)
            : ticket.assigneeId
            ? await User.findById(ticket.assigneeId)
            : null;

          if (recipientUser && recipientUser.email) {
            await emailService.sendEmail({
              to: recipientUser.email,
              subject: action.params.subject || `[Godspeed Alert] Ticket ${ticket.ticketNumber}`,
              text:
                action.params.body ||
                `Ticket ${ticket.ticketNumber}: "${ticket.title}" has been updated by automated workflow rule.`,
            });
          }
          break;
        }
      }
    } catch (err: any) {
      console.error(`[WorkflowEngine] Action execution error (${action.type}):`, err.message);
    }
  }
}

