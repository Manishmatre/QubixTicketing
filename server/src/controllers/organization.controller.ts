import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Organization } from '../models/Organization.js';
import { OrganizationMembership, OrgRole } from '../models/OrganizationMembership.js';
import { Invitation } from '../models/Invitation.js';
import { Project } from '../models/Project.js';
import { Ticket } from '../models/Ticket.js';
import { User } from '../models/User.js';
import { emailService } from '../services/emailAdapter.js';
import { logAuditEvent } from '../services/auditService.js';
import { checkUserLimit } from '../services/planService.js';
import { hashPassword } from '../utils/password.js';
import crypto from 'crypto';

export const getMyOrganizations = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }

    const memberships = await OrganizationMembership.find({
      userId: req.user._id,
      status: 'active',
    }).populate('organizationId');

    const orgs = memberships
      .filter((m) => m.organizationId)
      .map((m: any) => ({
        id: m.organizationId._id,
        name: m.organizationId.name,
        slug: m.organizationId.slug,
        logoUrl: m.organizationId.logoUrl,
        role: m.role,
        subscriptionPlan: m.organizationId.subscriptionPlan,
        subscriptionStatus: m.organizationId.subscriptionStatus,
      }));

    res.json({ success: true, data: orgs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const completeOnboarding = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }

    const {
      organizationName,
      slug,
      industry,
      size,
      website,
      phoneNumber,
      jobTitle,
      department,
      subscriptionPlan,
      invitedEmails,
      projectName,
      projectKey,
      firstTicketTitle,
      firstTicketCategory,
      firstTicketPriority,
    } = req.body;

    if (!organizationName) {
      res.status(400).json({
        success: false,
        error: { message: 'Organization name is required.' },
      });
      return;
    }

    // Auto-generate clean slug if not manually provided
    const baseSlug = (slug || organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '').slice(0, 30);
    let cleanSlug = baseSlug.replace(/[^a-z0-9-]/g, '').trim() || 'workspace';
    const existing = await Organization.findOne({ slug: cleanSlug });
    if (existing) {
      cleanSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
    }

    // 1. Create Organization with 14-day Full Access Free Trial
    const organization = await Organization.create({
      name: organizationName.trim(),
      slug: cleanSlug,
      industry: industry || 'Technology',
      size: size || '1-10',
      website: website || '',
      ownerId: req.user._id,
      subscriptionPlan: 'starter',
      subscriptionStatus: 'trialing',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      settings: {
        ticketPrefix: (projectKey || 'QUB').toUpperCase().slice(0, 5),
        timezone: 'UTC',
        allowExternalReporters: true,
      },
    });

    // 2. Add User as Owner with Role and Job Title
    await OrganizationMembership.create({
      organizationId: organization._id,
      userId: req.user._id,
      role: 'owner',
      jobTitle: jobTitle || 'Workspace Founder',
      department: department || 'Leadership',
    });

    // Update user's active org, designation, and phone number
    const user = await User.findById(req.user._id);
    if (user) {
      user.activeOrganizationId = organization._id as any;
      if (phoneNumber) {
        user.phoneNumber = phoneNumber.trim();
      }
      if (jobTitle || req.body.designation) {
        user.designation = (jobTitle || req.body.designation).trim();
      }
      await user.save();
    }

    // 3. Process Invited Members
    if (Array.isArray(invitedEmails) && invitedEmails.length > 0) {
      for (const email of invitedEmails) {
        if (!email || typeof email !== 'string') continue;
        const normalized = email.toLowerCase().trim();
        const token = crypto.randomBytes(24).toString('hex');
        await Invitation.create({
          organizationId: organization._id,
          email: normalized,
          role: 'employee',
          token,
          invitedBy: req.user._id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        await emailService.sendTeamInvitationEmail(
          normalized,
          organization.name,
          req.user?.name || 'Organization Owner',
          'employee',
          token
        );
      }
    }

    // 4. Create First Project
    const pKey = (projectKey || 'CORE').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const project = await Project.create({
      organizationId: organization._id,
      name: projectName || 'General Operations',
      key: pKey,
      description: 'Primary project workspace created during onboarding.',
      priority: 'high',
      status: 'active',
      projectManagerId: req.user._id,
      members: [
        {
          userId: req.user._id,
          role: 'lead',
          assignedAt: new Date(),
        },
      ],
      ticketStats: {
        total: 1,
        open: 1,
        inProgress: 0,
        resolved: 0,
        closed: 0,
      },
    });

    // 5. Create First Ticket
    const ticketSeq = 1;
    const ticketNumber = `${organization.settings.ticketPrefix || 'QUB'}-000001`;
    const ticket = await Ticket.create({
      organizationId: organization._id,
      projectId: project._id,
      ticketNumber,
      sequenceNumber: ticketSeq,
      title: firstTicketTitle || 'Welcome to QubixDesk - Set up your team workflow',
      description:
        'Welcome to your new QubixDesk issue tracking workspace! Here you can assign tasks, collaborate on bug fixes, drag cards across your Kanban board, and track progress effortlessly.',
      category: firstTicketCategory || 'General Request',
      priority: firstTicketPriority || 'Normal',
      status: 'To Do',
      reporterId: req.user._id,
      assigneeId: req.user._id,
      tags: ['onboarding', 'getting-started'],
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });

    await logAuditEvent({
      userId: req.user._id as any,
      organizationId: organization._id as any,
      action: 'ORGANIZATION_ONBOARDED',
      entity: 'Organization',
      entityId: organization._id.toString(),
      req,
      details: { organizationName, projectKey: pKey, ticketNumber },
    });

    res.status(201).json({
      success: true,
      data: {
        organization: {
          id: organization._id,
          name: organization.name,
          slug: organization.slug,
          subscriptionPlan: organization.subscriptionPlan,
        },
        project: {
          id: project._id,
          name: project.name,
          key: project.key,
        },
        ticket: {
          id: ticket._id,
          ticketNumber: ticket.ticketNumber,
          title: ticket.title,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const getCurrentOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const organization = await Organization.findById(req.organizationId);
    if (!organization) {
      res.status(404).json({ success: false, error: { message: 'Organization not found' } });
      return;
    }

    res.json({
      success: true,
      data: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        logoUrl: organization.logoUrl,
        website: organization.website,
        industry: organization.industry,
        size: organization.size,
        status: organization.status,
        subscriptionPlan: organization.subscriptionPlan,
        subscriptionStatus: organization.subscriptionStatus,
        trialEndsAt: organization.trialEndsAt,
        settings: organization.settings,
        userRole: req.membershipRole,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const updateCurrentOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, logoUrl, website, industry, size, settings } = req.body;

    const organization = await Organization.findById(req.organizationId);
    if (!organization) {
      res.status(404).json({ success: false, error: { message: 'Organization not found' } });
      return;
    }

    if (name) organization.name = name.trim();
    if (logoUrl !== undefined) organization.logoUrl = logoUrl;
    if (website !== undefined) organization.website = website.trim();
    if (industry) organization.industry = industry;
    if (size) organization.size = size;
    if (settings) {
      organization.settings = {
        ...organization.settings,
        ...settings,
      };
    }

    await organization.save();

    await logAuditEvent({
      userId: req.user?._id as any,
      organizationId: organization._id as any,
      action: 'ORGANIZATION_UPDATED',
      entity: 'Organization',
      entityId: organization._id.toString(),
      req,
    });

    res.json({ success: true, data: organization });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const getMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const members = await OrganizationMembership.find({
      organizationId: req.organizationId,
    })
      .populate('userId', 'name email avatarUrl lastLoginAt')
      .sort({ createdAt: 1 });

    // Calculate workload / assigned tickets per member
    const tickets = await Ticket.find({
      organizationId: req.organizationId,
      status: { $nin: ['Resolved', 'Closed'] },
    }).select('assigneeId');

    const workloadMap: Record<string, number> = {};
    for (const t of tickets) {
      if (t.assigneeId) {
        const idStr = t.assigneeId.toString();
        workloadMap[idStr] = (workloadMap[idStr] || 0) + 1;
      }
    }

    const formatted = members
      .filter((m) => m.userId)
      .map((m: any) => ({
        id: m._id,
        user: {
          id: m.userId._id,
          name: m.userId.name,
          email: m.userId.email,
          avatarUrl: m.userId.avatarUrl,
          lastLoginAt: m.userId.lastLoginAt,
        },
        role: m.role,
        jobTitle: m.jobTitle,
        department: m.department,
        status: m.status,
        joinedAt: m.joinedAt,
        activeTicketCount: workloadMap[m.userId._id.toString()] || 0,
      }));

    res.json({ success: true, data: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const inviteMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, role, jobTitle, department } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(String(email).trim())) {
      res.status(400).json({ success: false, error: { message: 'A valid email address is required.' } });
      return;
    }

    const normalized = String(email).toLowerCase().trim();

    // Prevent inviting yourself
    if (req.user && req.user.email.toLowerCase() === normalized) {
      res.status(400).json({
        success: false,
        error: { message: 'You cannot invite your own email address to this workspace.' },
      });
      return;
    }

    // Enforce Plan & Trial limits on member count
    const limitCheck = await checkUserLimit(req.organizationId!);
    if (!limitCheck.allowed) {
      res.status(403).json({
        success: false,
        error: { code: 'PLAN_LIMIT_REACHED', message: limitCheck.message },
      });
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');

    // Check if user already exists
    let existingUser = await User.findOne({ email: normalized });

    if (existingUser) {
      const existingMembership = await OrganizationMembership.findOne({
        organizationId: req.organizationId,
        userId: existingUser._id,
      });

      if (existingMembership) {
        res.status(409).json({
          success: false,
          error: { message: 'This user is already an active member of this workspace.' },
        });
        return;
      }

      // Add directly as member
      const membership = await OrganizationMembership.create({
        organizationId: req.organizationId,
        userId: existingUser._id,
        role: (role as OrgRole) || 'employee',
        jobTitle: jobTitle || '',
        department: department || 'General',
        status: 'active',
      });

      const org = await Organization.findById(req.organizationId);
      await emailService.sendWorkspaceAddedEmail(
        normalized,
        org?.name || 'Team Workspace',
        req.user?.name || 'Workspace Administrator',
        role || 'employee',
        existingUser.name
      );

      res.status(201).json({
        success: true,
        message: `${existingUser.name} has been added to the workspace. An access notification email has been dispatched.`,
        data: membership,
      });
      return;
    }

    // Check if a pending invitation already exists for this email
    const pendingInvitation = await Invitation.findOne({
      organizationId: req.organizationId,
      email: normalized,
      status: 'pending',
    });

    if (pendingInvitation) {
      pendingInvitation.token = token;
      pendingInvitation.role = (role as OrgRole) || pendingInvitation.role;
      pendingInvitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await pendingInvitation.save();

      const org = await Organization.findById(req.organizationId);
      await emailService.sendTeamInvitationEmail(
        normalized,
        org?.name || 'Workspace',
        req.user?.name || 'Workspace Administrator',
        role || pendingInvitation.role,
        token
      );

      res.status(200).json({
        success: true,
        message: `An invitation was already pending for ${normalized}. A fresh invitation email has been resent.`,
        data: pendingInvitation,
      });
      return;
    }

    // Generate temporary password for direct login with forced password change on first sign-in
    const tempPassword = `Qubix#${crypto.randomBytes(3).toString('hex').toUpperCase()}!`;
    const passwordHash = await hashPassword(tempPassword);

    const newUser = await User.create({
      name: email.split('@')[0].replace(/[._]/g, ' '),
      email: normalized,
      passwordHash,
      isVerified: true,
      mustChangePassword: true,
      activeOrganizationId: req.organizationId,
    });

    const membership = await OrganizationMembership.create({
      organizationId: req.organizationId,
      userId: newUser._id,
      role: (role as OrgRole) || 'employee',
      jobTitle: jobTitle || '',
      department: department || 'General',
      status: 'active',
    });

    const org = await Organization.findById(req.organizationId);
    await emailService.sendTeamInvitationWithTempPassword(
      normalized,
      org?.name || 'Workspace',
      req.user?.name || 'Workspace Administrator',
      role || 'employee',
      tempPassword
    );

    res.status(201).json({
      success: true,
      message: `Teammate added! Temporary login password has been dispatched to ${normalized}.`,
      data: membership,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const updateMemberRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId } = req.params;
    const { role, jobTitle, department, status } = req.body;

    const membership = await OrganizationMembership.findOne({
      _id: memberId,
      organizationId: req.organizationId,
    });

    if (!membership) {
      res.status(404).json({ success: false, error: { message: 'Member not found' } });
      return;
    }

    if (membership.role === 'owner' && role !== 'owner') {
      res.status(400).json({
        success: false,
        error: { message: 'Cannot demote the primary organization owner.' },
      });
      return;
    }

    if (role) membership.role = role as OrgRole;
    if (jobTitle !== undefined) membership.jobTitle = jobTitle;
    if (department !== undefined) membership.department = department;
    if (status) membership.status = status;

    await membership.save();

    res.json({ success: true, data: membership });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const removeMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId } = req.params;

    const membership = await OrganizationMembership.findOne({
      _id: memberId,
      organizationId: req.organizationId,
    });

    if (!membership) {
      res.status(404).json({ success: false, error: { message: 'Member not found' } });
      return;
    }

    if (membership.role === 'owner') {
      res.status(400).json({
        success: false,
        error: { message: 'Cannot remove organization owner.' },
      });
      return;
    }

    await OrganizationMembership.deleteOne({ _id: membership._id });

    res.json({ success: true, message: 'Member removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

