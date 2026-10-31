import { Request, Response } from 'express';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { Project } from '../models/Project.js';
import { Ticket } from '../models/Ticket.js';
import { AuditLog } from '../models/AuditLog.js';
import { logAuditEvent } from '../services/auditService.js';

export const getPlatformStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalOrgs,
      activeOrgs,
      totalUsers,
      activeSubs,
      totalProjects,
      totalTickets,
      recentOrgs,
    ] = await Promise.all([
      Organization.countDocuments(),
      Organization.countDocuments({ status: 'active' }),
      User.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      Project.countDocuments(),
      Ticket.countDocuments(),
      Organization.find().sort({ createdAt: -1 }).limit(8).populate('ownerId', 'name email'),
    ]);

    // Calculate Estimated MRR based on subscriptions
    const activeSubscriptionRecords = await Subscription.find({ status: 'active' }).populate('planId');
    let mrr = 0;
    activeSubscriptionRecords.forEach((s: any) => {
      if (s.planId && s.planId.priceMonthly) {
        mrr += s.billingInterval === 'yearly' ? Math.round(s.planId.priceYearly / 12) : s.planId.priceMonthly;
      }
    });

    res.json({
      success: true,
      data: {
        totalOrgs,
        activeOrgs,
        totalUsers,
        activeSubs,
        totalProjects,
        totalTickets,
        mrr,
        recentOrgs,
        systemHealth: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
          status: 'healthy',
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const listAllOrganizations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { slug: { $regex: String(search), $options: 'i' } },
      ];
    }

    const organizations = await Organization.find(filter)
      .populate('ownerId', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    const orgsWithMetrics = await Promise.all(
      organizations.map(async (org: any) => {
        const [projectCount, ticketCount] = await Promise.all([
          Project.countDocuments({ organizationId: org._id }),
          Ticket.countDocuments({ organizationId: org._id }),
        ]);

        return {
          id: org._id,
          name: org.name,
          slug: org.slug,
          industry: org.industry,
          size: org.size,
          status: org.status,
          subscriptionPlan: org.subscriptionPlan,
          subscriptionStatus: org.subscriptionStatus,
          owner: org.ownerId ? { name: org.ownerId.name, email: org.ownerId.email } : null,
          projectCount,
          ticketCount,
          createdAt: org.createdAt,
        };
      })
    );

    res.json({ success: true, data: orgsWithMetrics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const updateOrganizationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, subscriptionPlan } = req.body;

    const org = await Organization.findById(id);
    if (!org) {
      res.status(404).json({ success: false, error: { message: 'Organization not found' } });
      return;
    }

    if (status) org.status = status;
    if (subscriptionPlan) org.subscriptionPlan = subscriptionPlan;
    await org.save();

    await logAuditEvent({
      userId: req.user?._id as any,
      action: 'ADMIN_UPDATE_ORGANIZATION',
      entity: 'Organization',
      entityId: org._id.toString(),
      req,
      details: { newStatus: status, newPlan: subscriptionPlan },
    });

    res.json({ success: true, data: org });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const listAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { email: { $regex: String(search), $options: 'i' } },
      ];
    }

    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const getPlatformAuditLogs = async (_req: Request, res: Response): Promise<void> => {
  try {
    const logs = await AuditLog.find()
      .populate('userId', 'name email')
      .populate('organizationId', 'name slug')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

