import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Ticket, TicketStatus, TicketPriority, TicketCategory } from '../models/Ticket.js';
import { Organization } from '../models/Organization.js';
import { Project } from '../models/Project.js';
import { TicketActivity } from '../models/TicketActivity.js';
import { Notification } from '../models/Notification.js';
import { tenantScope } from '../middleware/tenantIsolation.js';
import { emitToOrg, emitToTicket, emitToUser } from '../services/socket.js';
import { WorkflowEngine } from '../services/workflowEngine.js';
import { logAuditEvent } from '../services/auditService.js';

export const getTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      status,
      priority,
      category,
      assigneeId,
      reporterId,
      search,
      tags,
      page = 1,
      limit = 50,
      sortBy = 'order',
      sortOrder = 'asc',
    } = req.query;

    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (status) {
      if (Array.isArray(status)) {
        filter.status = { $in: status };
      } else {
        filter.status = status;
      }
    }
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assigneeId) filter.assigneeId = assigneeId;
    if (reporterId) filter.reporterId = reporterId;
    if (tags) {
      const tagList = String(tags).split(',').map((t) => t.trim());
      filter.tags = { $in: tagList };
    }
    if (search) {
      filter.$or = [
        { title: { $regex: String(search), $options: 'i' } },
        { ticketNumber: { $regex: String(search), $options: 'i' } },
        { description: { $regex: String(search), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[String(sortBy)] = sortOrder === 'desc' ? -1 : 1;

    const [tickets, totalCount] = await Promise.all([
      Ticket.find(tenantScope(req, filter))
        .populate('reporterId', 'name email avatarUrl')
        .populate('assigneeId', 'name email avatarUrl')
        .populate('projectId', 'name key')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Ticket.countDocuments(tenantScope(req, filter)),
    ]);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const createTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      title,
      description,
      category,
      priority,
      status,
      assigneeId,
      dueDate,
      tags,
      watchers,
    } = req.body;

    if (!projectId || !title) {
      res.status(400).json({ success: false, error: { message: 'Project and Title are required.' } });
      return;
    }

    const project = await Project.findOne(tenantScope(req, { _id: projectId }));
    if (!project) {
      res.status(404).json({ success: false, error: { message: 'Project not found in this workspace.' } });
      return;
    }

    const org = await Organization.findById(req.organizationId);
    const prefix = org?.settings.ticketPrefix || project.key || 'QUB';

    // Sequence calculation
    const lastTicket = await Ticket.findOne({ organizationId: req.organizationId }).sort({ sequenceNumber: -1 });
    const sequenceNumber = (lastTicket?.sequenceNumber || 0) + 1;
    const ticketNumber = `${prefix}-${String(sequenceNumber).padStart(6, '0')}`;

    // Get highest order for column
    const initialStatus: TicketStatus = (status as TicketStatus) || 'To Do';
    const lastInCol = await Ticket.findOne(tenantScope(req, { status: initialStatus })).sort({ order: -1 });
    const order = (lastInCol?.order || 0) + 1000;

    const ticket = await Ticket.create({
      organizationId: req.organizationId,
      projectId: project._id,
      ticketNumber,
      sequenceNumber,
      title: title.trim(),
      description: description || '',
      category: (category as TicketCategory) || 'Bug',
      priority: (priority as TicketPriority) || 'Normal',
      status: initialStatus,
      reporterId: req.user?._id,
      assigneeId: assigneeId && mongoose.Types.ObjectId.isValid(assigneeId) ? new mongoose.Types.ObjectId(assigneeId) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags: Array.isArray(tags) ? tags : [],
      watchers: Array.isArray(watchers) ? watchers : [req.user?._id],
      order,
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('reporterId', 'name email avatarUrl')
      .populate('assigneeId', 'name email avatarUrl')
      .populate('projectId', 'name key');

    // Create activity
    await TicketActivity.create({
      organizationId: req.organizationId,
      ticketId: ticket._id,
      projectId: project._id,
      userId: req.user?._id,
      action: 'created',
      description: `Created ticket ${ticketNumber}: "${ticket.title}"`,
    });

    // Notify assignee if assigned
    if (ticket.assigneeId && ticket.assigneeId.toString() !== req.user?._id.toString()) {
      const notif = await Notification.create({
        organizationId: req.organizationId,
        recipientId: ticket.assigneeId,
        senderId: req.user?._id,
        type: 'ticket_assigned',
        title: `Assigned to ticket: ${ticketNumber}`,
        message: `${req.user?.name} assigned you to "${ticket.title}"`,
        link: `/workspace/tickets/${ticket._id}`,
        relatedEntityId: ticket._id,
        relatedEntityType: 'ticket',
      });
      emitToUser(ticket.assigneeId.toString(), 'notification:new', notif);
    }

    // Realtime broadcast to org
    emitToOrg(req.organizationId!.toString(), 'ticket:created', populatedTicket);

    // Trigger workflows
    await WorkflowEngine.triggerTicketWorkflows(req.organizationId!, 'ticket_created', ticket, req.user?._id as any);
    if (ticket.priority === 'Urgent' || ticket.priority === 'Critical') {
      await WorkflowEngine.triggerTicketWorkflows(req.organizationId!, 'priority_urgent', ticket, req.user?._id as any);
    }

    res.status(201).json({ success: true, data: populatedTicket });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const getTicketById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: { message: 'Invalid ticket ID' } });
      return;
    }

    const ticket = await Ticket.findOne(tenantScope(req, { _id: id }))
      .populate('reporterId', 'name email avatarUrl')
      .populate('assigneeId', 'name email avatarUrl')
      .populate('watchers', 'name email avatarUrl')
      .populate('projectId', 'name key priority status')
      .populate('relatedTicketIds', 'ticketNumber title status priority');

    if (!ticket) {
      res.status(404).json({ success: false, error: { message: 'Ticket not found in this workspace' } });
      return;
    }

    res.json({ success: true, data: ticket });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const updateTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      priority,
      status,
      assigneeId,
      dueDate,
      tags,
      watchers,
      resolutionSummary,
    } = req.body;

    const ticket = await Ticket.findOne(tenantScope(req, { _id: id }));
    if (!ticket) {
      res.status(404).json({ success: false, error: { message: 'Ticket not found' } });
      return;
    }

    const oldStatus = ticket.status;
    const oldPriority = ticket.priority;
    const oldAssignee = ticket.assigneeId ? ticket.assigneeId.toString() : null;

    if (title) ticket.title = title.trim();
    if (description !== undefined) ticket.description = description;
    if (category) ticket.category = category;
    if (priority) ticket.priority = priority;
    if (status) {
      ticket.status = status;
      if (status === 'Resolved' && !ticket.resolvedAt) ticket.resolvedAt = new Date();
      if (status === 'Closed' && !ticket.closedAt) ticket.closedAt = new Date();
      if (status === 'Reopened') {
        ticket.resolvedAt = undefined;
        ticket.closedAt = undefined;
      }
    }
    if (assigneeId !== undefined) {
      ticket.assigneeId = assigneeId && mongoose.Types.ObjectId.isValid(assigneeId)
        ? new mongoose.Types.ObjectId(assigneeId)
        : undefined;
    }
    if (dueDate !== undefined) ticket.dueDate = dueDate ? new Date(dueDate) : undefined;
    if (tags) ticket.tags = tags;
    if (watchers) ticket.watchers = watchers;
    if (resolutionSummary !== undefined) ticket.resolutionSummary = resolutionSummary;

    await ticket.save();

    // Activities & Notifications
    if (status && status !== oldStatus) {
      await TicketActivity.create({
        organizationId: req.organizationId,
        ticketId: ticket._id,
        projectId: ticket.projectId,
        userId: req.user?._id,
        action: 'status_changed',
        fieldChanged: 'status',
        oldValue: oldStatus,
        newValue: status,
        description: `Changed status from "${oldStatus}" to "${status}"`,
      });

      if (status === 'Resolved') {
        await WorkflowEngine.triggerTicketWorkflows(req.organizationId!, 'ticket_resolved', ticket, req.user?._id as any);
      }
    }

    if (priority && priority !== oldPriority) {
      await TicketActivity.create({
        organizationId: req.organizationId,
        ticketId: ticket._id,
        projectId: ticket.projectId,
        userId: req.user?._id,
        action: 'priority_changed',
        fieldChanged: 'priority',
        oldValue: oldPriority,
        newValue: priority,
        description: `Changed priority from "${oldPriority}" to "${priority}"`,
      });

      if (priority === 'Urgent' || priority === 'Critical') {
        await WorkflowEngine.triggerTicketWorkflows(req.organizationId!, 'priority_urgent', ticket, req.user?._id as any);
      }
    }

    const newAssigneeStr = ticket.assigneeId ? ticket.assigneeId.toString() : null;
    if (assigneeId !== undefined && newAssigneeStr !== oldAssignee) {
      await TicketActivity.create({
        organizationId: req.organizationId,
        ticketId: ticket._id,
        projectId: ticket.projectId,
        userId: req.user?._id,
        action: oldAssignee ? 'reassigned' : 'assigned',
        fieldChanged: 'assigneeId',
        description: `Reassigned ticket to updated team member`,
      });

      if (ticket.assigneeId && ticket.assigneeId.toString() !== req.user?._id.toString()) {
        const notif = await Notification.create({
          organizationId: req.organizationId,
          recipientId: ticket.assigneeId,
          senderId: req.user?._id,
          type: 'ticket_assigned',
          title: `Ticket Assigned: ${ticket.ticketNumber}`,
          message: `${req.user?.name} assigned you to "${ticket.title}"`,
          link: `/workspace/tickets/${ticket._id}`,
          relatedEntityId: ticket._id,
          relatedEntityType: 'ticket',
        });
        emitToUser(ticket.assigneeId.toString(), 'notification:new', notif);
      }
    }

    const populated = await Ticket.findById(ticket._id)
      .populate('reporterId', 'name email avatarUrl')
      .populate('assigneeId', 'name email avatarUrl')
      .populate('watchers', 'name email avatarUrl')
      .populate('projectId', 'name key');

    emitToOrg(req.organizationId!.toString(), 'ticket:updated', populated);
    emitToTicket(ticket._id.toString(), 'ticket:updated', populated);

    res.json({ success: true, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const updateTicketStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, order } = req.body;

    const ticket = await Ticket.findOne(tenantScope(req, { _id: id }));
    if (!ticket) {
      res.status(404).json({ success: false, error: { message: 'Ticket not found' } });
      return;
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    if (order !== undefined) ticket.order = order;
    if (status === 'Resolved' && !ticket.resolvedAt) ticket.resolvedAt = new Date();
    if (status === 'Closed' && !ticket.closedAt) ticket.closedAt = new Date();

    await ticket.save();

    await TicketActivity.create({
      organizationId: req.organizationId,
      ticketId: ticket._id,
      projectId: ticket.projectId,
      userId: req.user?._id,
      action: 'status_changed',
      fieldChanged: 'status',
      oldValue: oldStatus,
      newValue: status,
      description: `Moved card to "${status}"`,
    });

    const populated = await Ticket.findById(ticket._id)
      .populate('reporterId', 'name email avatarUrl')
      .populate('assigneeId', 'name email avatarUrl')
      .populate('projectId', 'name key');

    emitToOrg(req.organizationId!.toString(), 'ticket:status_changed', populated);
    emitToTicket(ticket._id.toString(), 'ticket:status_changed', populated);

    if (status === 'Resolved') {
      await WorkflowEngine.triggerTicketWorkflows(req.organizationId!, 'ticket_resolved', ticket, req.user?._id as any);
    }

    res.json({ success: true, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const bulkUpdateTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketIds, status, priority, assigneeId } = req.body;

    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      res.status(400).json({ success: false, error: { message: 'ticketIds array required' } });
      return;
    }

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (priority) updateFields.priority = priority;
    if (assigneeId !== undefined) {
      updateFields.assigneeId = assigneeId && mongoose.Types.ObjectId.isValid(assigneeId)
        ? new mongoose.Types.ObjectId(assigneeId)
        : null;
    }

    await Ticket.updateMany(
      tenantScope(req, { _id: { $in: ticketIds } }),
      { $set: updateFields }
    );

    emitToOrg(req.organizationId!.toString(), 'tickets:bulk_updated', { ticketIds, updates: updateFields });

    res.json({ success: true, message: `Successfully updated ${ticketIds.length} tickets.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const deleteTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findOne(tenantScope(req, { _id: id }));
    if (!ticket) {
      res.status(404).json({ success: false, error: { message: 'Ticket not found' } });
      return;
    }

    await Ticket.deleteOne(tenantScope(req, { _id: ticket._id }));

    emitToOrg(req.organizationId!.toString(), 'ticket:deleted', { ticketId: id });

    res.json({ success: true, message: 'Ticket deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

