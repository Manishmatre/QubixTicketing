import { Request, Response } from 'express';
import { Notification } from '../models/Notification.js';
import { tenantScope } from '../middleware/tenantIsolation.js';

export const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const notifications = await Notification.find(
      tenantScope(req, { recipientId: req.user?._id })
    )
      .populate('senderId', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments(
      tenantScope(req, { recipientId: req.user?._id, isRead: false })
    );

    res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      tenantScope(req, { _id: id, recipientId: req.user?._id }),
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, error: { message: 'Notification not found' } });
      return;
    }

    res.json({ success: true, data: notification });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    await Notification.updateMany(
      tenantScope(req, { recipientId: req.user?._id, isRead: false }),
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

