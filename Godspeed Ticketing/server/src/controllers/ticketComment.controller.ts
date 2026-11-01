import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TicketComment } from '../models/TicketComment.js';
import { Ticket } from '../models/Ticket.js';
import { TicketActivity } from '../models/TicketActivity.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { tenantScope } from '../middleware/tenantIsolation.js';
import { hasPermission } from '../middleware/rbac.js';
import { emitToTicket, emitToUser } from '../services/socket.js';

export const getCommentsByTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      res.status(400).json({ success: false, error: { message: 'Invalid ticket ID' } });
      return;
    }

    const filter: any = { ticketId };

    // If user does NOT have internal notes permission, exclude internal notes!
    const canSeeInternal = hasPermission(req.membershipRole, 'viewInternalNotes', req.user?.isSuperAdmin);
    if (!canSeeInternal) {
      filter.isInternal = false;
    }

    const comments = await TicketComment.find(tenantScope(req, filter))
      .populate('authorId', 'name email avatarUrl')
      .populate('reactions.userIds', 'name email avatarUrl')
      .sort({ createdAt: 1 })
      .lean();

    res.json({ success: true, data: comments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const { content, isInternal = false, parentCommentId, attachments = [] } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ success: false, error: { message: 'Comment content cannot be empty.' } });
      return;
    }

    const ticket = await Ticket.findOne(tenantScope(req, { _id: ticketId }));
    if (!ticket) {
      res.status(404).json({ success: false, error: { message: 'Ticket not found' } });
      return;
    }

    // Check if user is allowed to post internal notes
    if (isInternal) {
      const canInternal = hasPermission(req.membershipRole, 'viewInternalNotes', req.user?.isSuperAdmin);
      if (!canInternal) {
        res.status(403).json({
          success: false,
          error: { message: 'You do not have permission to post internal team notes.' },
        });
        return;
      }
    }

    const comment = await TicketComment.create({
      organizationId: req.organizationId,
      ticketId: ticket._id,
      authorId: req.user?._id,
      content: content.trim(),
      isInternal: !!isInternal,
      parentCommentId: parentCommentId && mongoose.Types.ObjectId.isValid(parentCommentId) ? new mongoose.Types.ObjectId(parentCommentId) : undefined,
      attachments,
    });

    ticket.commentCount = (ticket.commentCount || 0) + 1;
    await ticket.save();

    await TicketActivity.create({
      organizationId: req.organizationId,
      ticketId: ticket._id,
      projectId: ticket.projectId,
      userId: req.user?._id,
      action: 'comment_added',
      description: isInternal ? 'Added an internal note' : 'Added a public comment',
    });

    const populated = await TicketComment.findById(comment._id)
      .populate('authorId', 'name email avatarUrl')
      .populate('reactions.userIds', 'name email avatarUrl');

    emitToTicket(ticket._id.toString(), 'comment:created', populated);

    // Notify ticket assignee and reporter if not the author
    const notifyRecipients = new Set<string>();
    if (ticket.assigneeId && ticket.assigneeId.toString() !== req.user?._id.toString()) {
      notifyRecipients.add(ticket.assigneeId.toString());
    }
    if (ticket.reporterId && ticket.reporterId.toString() !== req.user?._id.toString()) {
      // Only notify reporter if this is not an internal note
      if (!isInternal) {
        notifyRecipients.add(ticket.reporterId.toString());
      }
    }

    // Process @teammember mentions
    const mentionRegex = /@([a-zA-Z0-9_\s.-]+?)(?=[,;:!?\s]|$)/g;
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = mentionRegex.exec(content)) !== null) {
      if (match[1] && match[1].trim()) {
        matches.push(match[1].trim());
      }
    }
    if (matches.length > 0) {
      const mentionedUsers = await User.find({
        name: { $in: matches.map((m) => new RegExp(`^${m}$`, 'i')) },
      });

      for (const mUser of mentionedUsers) {
        if (mUser._id.toString() !== req.user?._id.toString()) {
          notifyRecipients.delete(mUser._id.toString());
          const mentionNotif = await Notification.create({
            organizationId: req.organizationId,
            recipientId: mUser._id,
            senderId: req.user?._id,
            type: 'mention',
            title: `Mentioned in ${ticket.ticketNumber}`,
            message: `${req.user?.name} tagged you in a comment on ${ticket.ticketNumber}: "${content.slice(0, 100)}${content.length > 100 ? '...' : ''}"`,
            link: `/workspace/tickets/${ticket._id}`,
            relatedEntityId: ticket._id,
            relatedEntityType: 'ticket',
          });
          emitToUser(mUser._id.toString(), 'notification:new', mentionNotif);
        }
      }
    }

    for (const recipientId of notifyRecipients) {
      const notif = await Notification.create({
        organizationId: req.organizationId,
        recipientId: new mongoose.Types.ObjectId(recipientId),
        senderId: req.user?._id,
        type: 'ticket_comment',
        title: `New Comment on ${ticket.ticketNumber}`,
        message: `${req.user?.name} commented: "${content.slice(0, 80)}${content.length > 80 ? '...' : ''}"`,
        link: `/workspace/tickets/${ticket._id}`,
        relatedEntityId: ticket._id,
        relatedEntityType: 'ticket',
      });
      emitToUser(recipientId, 'notification:new', notif);
    }

    res.status(201).json({ success: true, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const updateComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await TicketComment.findOne(tenantScope(req, { _id: commentId }));
    if (!comment) {
      res.status(404).json({ success: false, error: { message: 'Comment not found' } });
      return;
    }

    if (comment.authorId.toString() !== req.user?._id.toString() && !req.user?.isSuperAdmin) {
      res.status(403).json({ success: false, error: { message: 'Cannot edit other users comments' } });
      return;
    }

    comment.content = content.trim();
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    const populated = await TicketComment.findById(comment._id)
      .populate('authorId', 'name email avatarUrl')
      .populate('reactions.userIds', 'name email avatarUrl');

    emitToTicket(comment.ticketId.toString(), 'comment:updated', populated);

    res.json({ success: true, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const toggleReaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      res.status(400).json({ success: false, error: { message: 'Emoji required' } });
      return;
    }

    const comment = await TicketComment.findOne(tenantScope(req, { _id: commentId }));
    if (!comment) {
      res.status(404).json({ success: false, error: { message: 'Comment not found' } });
      return;
    }

    const userId = req.user!._id;
    let existingReaction = comment.reactions.find((r) => r.emoji === emoji);

    if (existingReaction) {
      const userIndex = existingReaction.userIds.findIndex((u) => u.toString() === userId.toString());
      if (userIndex > -1) {
        // Toggle off
        existingReaction.userIds.splice(userIndex, 1);
        if (existingReaction.userIds.length === 0) {
          comment.reactions = comment.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        // Toggle on
        existingReaction.userIds.push(userId);
      }
    } else {
      comment.reactions.push({
        emoji,
        userIds: [userId],
      });
    }

    await comment.save();

    const populated = await TicketComment.findById(comment._id)
      .populate('authorId', 'name email avatarUrl')
      .populate('reactions.userIds', 'name email avatarUrl');

    emitToTicket(comment.ticketId.toString(), 'comment:updated', populated);

    res.json({ success: true, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const getTicketActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const activities = await TicketActivity.find(tenantScope(req, { ticketId }))
      .populate('userId', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: activities });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

