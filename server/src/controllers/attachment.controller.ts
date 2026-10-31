import { Request, Response } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { TicketAttachment } from '../models/TicketAttachment.js';
import { Ticket } from '../models/Ticket.js';
import { TicketActivity } from '../models/TicketActivity.js';
import { tenantScope } from '../middleware/tenantIsolation.js';
import { getUploadDirectory, processUploadedFile } from '../services/storageAdapter.js';
import { emitToTicket } from '../services/socket.js';

export const getAttachmentsByTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const attachments = await TicketAttachment.find(tenantScope(req, { ticketId }))
      .populate('uploadedById', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: attachments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const uploadAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, error: { message: 'No file uploaded.' } });
      return;
    }

    const ticket = await Ticket.findOne(tenantScope(req, { _id: ticketId }));
    if (!ticket) {
      // Remove orphaned file
      fs.unlinkSync(file.path);
      res.status(404).json({ success: false, error: { message: 'Ticket not found' } });
      return;
    }

    const { fileUrl, fileName } = await processUploadedFile(file);

    const attachment = await TicketAttachment.create({
      organizationId: req.organizationId,
      ticketId: ticket._id,
      projectId: ticket.projectId,
      originalName: file.originalname,
      fileName,
      fileUrl,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedById: req.user?._id,
    });

    ticket.attachmentCount = (ticket.attachmentCount || 0) + 1;
    await ticket.save();

    await TicketActivity.create({
      organizationId: req.organizationId,
      ticketId: ticket._id,
      projectId: ticket.projectId,
      userId: req.user?._id,
      action: 'attachment_uploaded',
      description: `Uploaded attachment: "${file.originalname}" (${(file.size / 1024).toFixed(1)} KB)`,
    });

    const populated = await TicketAttachment.findById(attachment._id)
      .populate('uploadedById', 'name email avatarUrl');

    emitToTicket(ticket._id.toString(), 'attachment:created', populated);

    res.status(201).json({ success: true, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const downloadAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const attachment = await TicketAttachment.findOne(tenantScope(req, { _id: id }));

    if (!attachment) {
      res.status(404).json({ success: false, error: { message: 'Attachment not found' } });
      return;
    }

    const filePath = path.join(getUploadDirectory(), attachment.fileName);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: { message: 'File missing from server storage' } });
      return;
    }

    res.download(filePath, attachment.originalName);
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const deleteAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const attachment = await TicketAttachment.findOne(tenantScope(req, { _id: id }));

    if (!attachment) {
      res.status(404).json({ success: false, error: { message: 'Attachment not found' } });
      return;
    }

    // Unlink file safely
    const filePath = path.join(getUploadDirectory(), attachment.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await TicketAttachment.deleteOne(tenantScope(req, { _id: attachment._id }));

    await Ticket.updateOne(
      tenantScope(req, { _id: attachment.ticketId }),
      { $inc: { attachmentCount: -1 } }
    );

    res.json({ success: true, message: 'Attachment deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

