import { Request, Response } from 'express';
import os from 'os';
import { Organization } from '../models/Organization.js';
import { OrganizationMembership } from '../models/OrganizationMembership.js';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { Project } from '../models/Project.js';
import { Ticket } from '../models/Ticket.js';
import { Workflow } from '../models/Workflow.js';
import { TicketComment } from '../models/TicketComment.js';
import { TicketAttachment } from '../models/TicketAttachment.js';
import { Plan } from '../models/Plan.js';
import { AuditLog } from '../models/AuditLog.js';
import { PlatformSetting } from '../models/PlatformSetting.js';
import { logAuditEvent } from '../services/auditService.js';
import { hashPassword } from '../utils/password.js';

// Seed default plans if collection is empty
const seedDefaultPlansIfEmpty = async () => {
  const count = await Plan.countDocuments();
  if (count === 0) {
    await Plan.insertMany([
      {
        name: 'Free Starter',
        code: 'free',
        description: 'For small teams getting started with agile tracking',
        priceMonthly: 0,
        priceYearly: 0,
        maxUsers: 5,
        maxProjects: 3,
        maxStorageMB: 500,
        features: ['Basic Kanban Boards', 'Up to 5 Teammates', 'Community Support', 'Standard SLA Tracker'],
        isActive: true,
      },
      {
        name: 'Starter Pro',
        code: 'starter',
        description: 'For growing startup teams managing client deliverables',
        priceMonthly: 19,
        priceYearly: 190,
        maxUsers: 15,
        maxProjects: 10,
        maxStorageMB: 5000,
        features: ['Full Kanban & List Views', 'SLA Escalation Timers', 'Client Helpdesk Portal', 'CSV Data Exports'],
        isActive: true,
      },
      {
        name: 'Professional',
        code: 'professional',
        description: 'For enterprise operations requiring advanced multi-tenant automation',
        priceMonthly: 49,
        priceYearly: 490,
        maxUsers: 50,
        maxProjects: 50,
        maxStorageMB: 25000,
        features: ['Custom Workflow Automation', 'External Reporter Portal', 'Role Permissions RBAC', 'Priority Support'],
        isActive: true,
      },
      {
        name: 'Business',
        code: 'business',
        description: 'Advanced compliance, audit logging and real-time SLA metrics',
        priceMonthly: 99,
        priceYearly: 990,
        maxUsers: 150,
        maxProjects: 200,
        maxStorageMB: 100000,
        features: ['Audit Logging', 'Real-time WebSocket Sync', 'Custom SLA Policies', 'Dedicated Account Lead'],
        isActive: true,
      },
      {
        name: 'Enterprise Ultra',
        code: 'enterprise',
        description: 'Bespoke infrastructure, unlimited workspaces, and custom integrations',
        priceMonthly: 249,
        priceYearly: 2490,
        maxUsers: 9999,
        maxProjects: 9999,
        maxStorageMB: 500000,
        features: ['Unlimited Teammates', 'Custom Webhooks', 'Dedicated Cluster Isolation', '99.99% Uptime SLA Guarantee'],
        isActive: true,
      },
    ]);
  }
};

// 1. Platform Statistics & Real-time Telemetry
export const getPlatformStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalOrgs,
      activeOrgs,
      suspendedOrgs,
      totalUsers,
      superAdmins,
      verifiedUsers,
      activeSubs,
      totalProjects,
      totalTickets,
      openTickets,
      resolvedTickets,
      recentOrgs,
    ] = await Promise.all([
      Organization.countDocuments(),
      Organization.countDocuments({ status: 'active' }),
      Organization.countDocuments({ status: 'suspended' }),
      User.countDocuments(),
      User.countDocuments({ isSuperAdmin: true }),
      User.countDocuments({ isVerified: true }),
      Subscription.countDocuments({ status: 'active' }),
      Project.countDocuments(),
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: { $in: ['open', 'in_progress', 'review'] } }),
      Ticket.countDocuments({ status: 'resolved' }),
      Organization.find().sort({ createdAt: -1 }).limit(6).populate('ownerId', 'name email'),
    ]);

    // Calculate Estimated MRR based on subscriptions and organization plans
    const activeSubscriptionRecords = await Subscription.find({ status: 'active' }).populate('planId');
    let mrr = 0;
    activeSubscriptionRecords.forEach((s: any) => {
      if (s.planId && s.planId.priceMonthly) {
        mrr += s.billingInterval === 'yearly' ? Math.round(s.planId.priceYearly / 12) : s.planId.priceMonthly;
      }
    });

    // Also factor active org plan tiers if direct Stripe sub record isn't stored
    if (mrr === 0) {
      const planPrices: Record<string, number> = {
        starter: 19,
        professional: 49,
        business: 99,
        enterprise: 249,
      };
      const paidOrgs = await Organization.find({
        status: 'active',
        subscriptionPlan: { $in: ['starter', 'professional', 'business', 'enterprise'] },
      });
      paidOrgs.forEach((o) => {
        mrr += planPrices[o.subscriptionPlan] || 0;
      });
    }

    const memoryUsage = process.memoryUsage();

    res.json({
      success: true,
      data: {
        totalOrgs,
        activeOrgs,
        suspendedOrgs,
        totalUsers,
        superAdmins,
        verifiedUsers,
        activeSubs,
        totalProjects,
        totalTickets,
        openTickets,
        resolvedTickets,
        mrr,
        arr: mrr * 12,
        recentOrgs,
        systemHealth: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          memoryUsageMB: Math.round(memoryUsage.rss / 1024 / 1024),
          heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          totalSystemMemoryGB: Math.round(os.totalmem() / 1024 / 1024 / 1024),
          freeSystemMemoryGB: Math.round(os.freemem() / 1024 / 1024 / 1024),
          cpuCores: os.cpus().length,
          status: 'healthy',
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// 2. Organization CRUD
export const listAllOrganizations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, plan } = req.query;
    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (plan && plan !== 'all') filter.subscriptionPlan = plan;
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
        const [projectCount, ticketCount, memberCount] = await Promise.all([
          Project.countDocuments({ organizationId: org._id }),
          Ticket.countDocuments({ organizationId: org._id }),
          OrganizationMembership.countDocuments({ organizationId: org._id }),
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
          memberCount,
          settings: org.settings,
          createdAt: org.createdAt,
          updatedAt: org.updatedAt,
        };
      })
    );

    res.json({ success: true, data: orgsWithMetrics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const createOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, ownerEmail, subscriptionPlan, industry, size } = req.body;

    if (!name || !slug || !ownerEmail) {
      res.status(400).json({ success: false, error: { message: 'Name, slug and owner email are required.' } });
      return;
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    const existing = await Organization.findOne({ slug: cleanSlug });
    if (existing) {
      res.status(409).json({ success: false, error: { message: `Organization slug "${cleanSlug}" is already taken.` } });
      return;
    }

    // Find or create owner
    let owner = await User.findOne({ email: ownerEmail.toLowerCase().trim() });
    if (!owner) {
      const defaultPassword = 'Password123!';
      const passwordHash = await hashPassword(defaultPassword);
      owner = await User.create({
        name: name + ' Admin',
        email: ownerEmail.toLowerCase().trim(),
        passwordHash,
        isVerified: true,
      });
    }

    const org = await Organization.create({
      name,
      slug: cleanSlug,
      ownerId: owner._id,
      subscriptionPlan: subscriptionPlan || 'free',
      subscriptionStatus: 'active',
      industry: industry || 'Technology',
      size: size || '1-10',
      status: 'active',
    });

    // Create owner membership
    await OrganizationMembership.create({
      userId: owner._id,
      organizationId: org._id,
      role: 'owner',
    });

    await logAuditEvent({
      userId: req.user?._id as any,
      action: 'ADMIN_CREATE_ORGANIZATION',
      entity: 'Organization',
      entityId: org._id.toString(),
      req,
      details: { name, slug: cleanSlug, ownerEmail },
    });

    res.status(201).json({ success: true, data: org });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const updateOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, status, subscriptionPlan, subscriptionStatus, industry, size, settings } = req.body;

    const org = await Organization.findById(id);
    if (!org) {
      res.status(404).json({ success: false, error: { message: 'Organization not found.' } });
      return;
    }

    if (name) org.name = name;
    if (slug) {
      const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
      const conflict = await Organization.findOne({ slug: cleanSlug, _id: { $ne: org._id } });
      if (conflict) {
        res.status(409).json({ success: false, error: { message: 'Slug already taken by another organization.' } });
        return;
      }
      org.slug = cleanSlug;
    }
    if (status) org.status = status;
    if (subscriptionPlan) org.subscriptionPlan = subscriptionPlan;
    if (subscriptionStatus) org.subscriptionStatus = subscriptionStatus;
    if (industry) org.industry = industry;
    if (size) org.size = size;
    if (settings) {
      org.settings = { ...org.settings, ...settings };
    }

    await org.save();

    await logAuditEvent({
      userId: req.user?._id as any,
      action: 'ADMIN_UPDATE_ORGANIZATION',
      entity: 'Organization',
      entityId: org._id.toString(),
      req,
      details: { status, subscriptionPlan, name },
    });

    res.json({ success: true, data: org });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const deleteOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const org = await Organization.findById(id);
    if (!org) {
      res.status(404).json({ success: false, error: { message: 'Organization not found.' } });
      return;
    }

    // Cascade clean all tenant assets safely
    await Promise.all([
      OrganizationMembership.deleteMany({ organizationId: org._id }),
      Project.deleteMany({ organizationId: org._id }),
      Ticket.deleteMany({ organizationId: org._id }),
      TicketComment.deleteMany({ organizationId: org._id }),
      TicketAttachment.deleteMany({ organizationId: org._id }),
      Workflow.deleteMany({ organizationId: org._id }),
      Organization.findByIdAndDelete(id),
    ]);

    await logAuditEvent({
      userId: req.user?._id as any,
      action: 'ADMIN_DELETE_ORGANIZATION',
      entity: 'Organization',
      entityId: id,
      req,
      details: { deletedOrgName: org.name, slug: org.slug },
    });

    res.json({ success: true, message: `Organization "${org.name}" and all associated data permanently deleted.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// 3. Global User CRUD
export const listAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, role } = req.query;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { email: { $regex: String(search), $options: 'i' } },
        { phoneNumber: { $regex: String(search), $options: 'i' } },
      ];
    }

    if (role === 'superadmin') {
      filter.isSuperAdmin = true;
    }

    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).limit(150);

    const usersWithMemberships = await Promise.all(
      users.map(async (u: any) => {
        const memberships = await OrganizationMembership.find({ userId: u._id }).populate('organizationId', 'name slug');
        return {
          id: u._id,
          name: u.name,
          email: u.email,
          phoneNumber: u.phoneNumber,
          avatarUrl: u.avatarUrl,
          isSuperAdmin: u.isSuperAdmin,
          isVerified: u.isVerified,
          twoFactorEnabled: u.twoFactorEnabled,
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt,
          organizations: memberships.map((m: any) => ({
            id: m.organizationId?._id,
            name: m.organizationId?.name,
            slug: m.organizationId?.slug,
            role: m.role,
          })),
        };
      })
    );

    res.json({ success: true, data: usersWithMemberships });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phoneNumber, isSuperAdmin, isVerified } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: { message: 'Name, email, and password are required.' } });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ success: false, error: { message: 'User with this email already exists.' } });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber || '',
      passwordHash,
      isSuperAdmin: Boolean(isSuperAdmin),
      isVerified: isVerified !== undefined ? Boolean(isVerified) : true,
    });

    await logAuditEvent({
      userId: req.user?._id as any,
      action: 'ADMIN_CREATE_USER',
      entity: 'User',
      entityId: user._id.toString(),
      req,
      details: { email: user.email, isSuperAdmin: user.isSuperAdmin },
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        isVerified: user.isVerified,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, phoneNumber, isSuperAdmin, isVerified } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found.' } });
      return;
    }

    if (name) user.name = name;
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      const conflict = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
      if (conflict) {
        res.status(409).json({ success: false, error: { message: 'Email already used by another user.' } });
        return;
      }
      user.email = cleanEmail;
    }
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (isSuperAdmin !== undefined) user.isSuperAdmin = Boolean(isSuperAdmin);
    if (isVerified !== undefined) user.isVerified = Boolean(isVerified);

    await user.save();

    await logAuditEvent({
      userId: req.user?._id as any,
      action: 'ADMIN_UPDATE_USER',
      entity: 'User',
      entityId: user._id.toString(),
      req,
      details: { email: user.email, isSuperAdmin: user.isSuperAdmin },
    });

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isSuperAdmin: user.isSuperAdmin,
        isVerified: user.isVerified,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ success: false, error: { message: 'New password must be at least 6 characters.' } });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found.' } });
      return;
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    await logAuditEvent({
      userId: req.user?._id as any,
      action: 'ADMIN_RESET_PASSWORD',
      entity: 'User',
      entityId: user._id.toString(),
      req,
      details: { targetUserEmail: user.email },
    });

    res.json({ success: true, message: `Password successfully updated for ${user.email}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user?._id.toString() === id) {
      res.status(400).json({ success: false, error: { message: 'Cannot delete your own super admin account.' } });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found.' } });
      return;
    }

    await Promise.all([
      OrganizationMembership.deleteMany({ userId: user._id }),
      User.findByIdAndDelete(id),
    ]);

    await logAuditEvent({
      userId: req.user?._id as any,
      action: 'ADMIN_DELETE_USER',
      entity: 'User',
      entityId: id,
      req,
      details: { deletedEmail: user.email },
    });

    res.json({ success: true, message: `User "${user.email}" deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// 4. Plans & Pricing Management
export const listPlans = async (_req: Request, res: Response): Promise<void> => {
  try {
    await seedDefaultPlansIfEmpty();
    const plans = await Plan.find().sort({ priceMonthly: 1 });
    res.json({ success: true, data: plans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const updatePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, priceMonthly, priceYearly, maxUsers, maxProjects, maxStorageMB, features, isActive } = req.body;

    const plan = await Plan.findById(id);
    if (!plan) {
      res.status(404).json({ success: false, error: { message: 'Plan not found.' } });
      return;
    }

    if (name) plan.name = name;
    if (description) plan.description = description;
    if (priceMonthly !== undefined) plan.priceMonthly = Number(priceMonthly);
    if (priceYearly !== undefined) plan.priceYearly = Number(priceYearly);
    if (maxUsers !== undefined) plan.maxUsers = Number(maxUsers);
    if (maxProjects !== undefined) plan.maxProjects = Number(maxProjects);
    if (maxStorageMB !== undefined) plan.maxStorageMB = Number(maxStorageMB);
    if (features) plan.features = features;
    if (isActive !== undefined) plan.isActive = Boolean(isActive);

    await plan.save();

    await logAuditEvent({
      userId: req.user?._id as any,
      action: 'ADMIN_UPDATE_PLAN',
      entity: 'Plan',
      entityId: plan._id.toString(),
      req,
      details: { planCode: plan.code, priceMonthly: plan.priceMonthly },
    });

    res.json({ success: true, data: plan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// 5. Platform Settings & Maintenance
export const getPlatformSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    let settings = await PlatformSetting.findOne({ key: 'global_config' });
    if (!settings) {
      settings = await PlatformSetting.create({
        key: 'global_config',
        maintenanceMode: false,
        announcementBanner: {
          enabled: false,
          message: 'Welcome to QubixDesk 2.0! Real-time issue tracking active.',
          type: 'info',
        },
        allowRegistrations: true,
        defaultPlan: 'free',
        supportEmail: 'support@qubixdesk.toolio.tech',
      });
    }

    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const updatePlatformSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { maintenanceMode, announcementBanner, allowRegistrations, defaultPlan, supportEmail } = req.body;

    let settings = await PlatformSetting.findOne({ key: 'global_config' });
    if (!settings) {
      settings = new PlatformSetting({ key: 'global_config' });
    }

    if (maintenanceMode !== undefined) settings.maintenanceMode = Boolean(maintenanceMode);
    if (announcementBanner) {
      settings.announcementBanner = {
        enabled: Boolean(announcementBanner.enabled),
        message: announcementBanner.message || '',
        type: announcementBanner.type || 'info',
      };
    }
    if (allowRegistrations !== undefined) settings.allowRegistrations = Boolean(allowRegistrations);
    if (defaultPlan) settings.defaultPlan = defaultPlan;
    if (supportEmail) settings.supportEmail = supportEmail;
    settings.updatedBy = req.user?._id as any;

    await settings.save();

    await logAuditEvent({
      userId: req.user?._id as any,
      action: 'ADMIN_UPDATE_PLATFORM_SETTINGS',
      entity: 'PlatformSetting',
      entityId: settings._id.toString(),
      req,
      details: { maintenanceMode: settings.maintenanceMode, announcementBanner: settings.announcementBanner },
    });

    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// 6. Platform Audit Logs
export const getPlatformAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { entity, action, limit = 100 } = req.query;
    const filter: any = {};
    if (entity) filter.entity = entity;
    if (action) filter.action = action;

    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email')
      .populate('organizationId', 'name slug')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
