import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { OrganizationMembership } from '../models/OrganizationMembership.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { logAuditEvent } from '../services/auditService.js';
import mongoose from 'mongoose';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, organizationName, slug } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name, email, and password are required.' },
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists.' },
      });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      isSuperAdmin: false,
      isVerified: true,
    });

    let organization = null;
    let membership = null;

    // If organization details provided, create organization & owner membership
    if (organizationName) {
      const generatedSlug = (slug || organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
      const uniqueSlug = `${generatedSlug}-${Date.now().toString().slice(-4)}`;

      organization = await Organization.create({
        name: organizationName.trim(),
        slug: uniqueSlug,
        ownerId: user._id,
        subscriptionPlan: 'starter',
        subscriptionStatus: 'trialing',
      });

      membership = await OrganizationMembership.create({
        organizationId: organization._id,
        userId: user._id,
        role: 'owner',
        department: 'Executive',
        jobTitle: 'Founder / Administrator',
      });

      user.activeOrganizationId = organization._id as any;
      await user.save();
    }

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      activeOrganizationId: organization ? organization._id.toString() : undefined,
    });

    const refreshToken = generateRefreshToken({ userId: user._id.toString() });

    res.cookie('qubix_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logAuditEvent({
      userId: user._id as any,
      organizationId: organization ? (organization._id as any) : undefined,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user._id.toString(),
      req,
      details: { email: user.email, hasOrg: !!organization },
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          isSuperAdmin: user.isSuperAdmin,
          activeOrganizationId: user.activeOrganizationId,
        },
        organization: organization
          ? {
              id: organization._id,
              name: organization.name,
              slug: organization.slug,
              role: 'owner',
            }
          : null,
        accessToken,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'REGISTRATION_FAILED', message: err.message },
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required.' },
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
      return;
    }

    user.lastLoginAt = new Date();
    await user.save();

    // Find user's memberships
    const memberships = await OrganizationMembership.find({
      userId: user._id,
      status: 'active',
    }).populate('organizationId');

    let activeOrg = null;
    let activeRole = 'employee';

    if (memberships.length > 0) {
      // Pick current active or first valid membership
      const matched = memberships.find(
        (m: any) => user.activeOrganizationId && m.organizationId && m.organizationId._id.toString() === user.activeOrganizationId.toString()
      );
      const chosenMembership: any = matched || memberships[0];
      if (chosenMembership && chosenMembership.organizationId) {
        activeOrg = chosenMembership.organizationId;
        activeRole = chosenMembership.role;
        user.activeOrganizationId = activeOrg._id;
        await user.save();
      }
    }

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      activeOrganizationId: activeOrg ? activeOrg._id.toString() : undefined,
    });

    const refreshToken = generateRefreshToken({ userId: user._id.toString() });

    res.cookie('qubix_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logAuditEvent({
      userId: user._id as any,
      organizationId: activeOrg ? (activeOrg._id as any) : undefined,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user._id.toString(),
      req,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          isSuperAdmin: user.isSuperAdmin,
          activeOrganizationId: user.activeOrganizationId,
        },
        organization: activeOrg
          ? {
              id: activeOrg._id,
              name: activeOrg.name,
              slug: activeOrg.slug,
              logoUrl: activeOrg.logoUrl,
              subscriptionPlan: activeOrg.subscriptionPlan,
              role: activeRole,
            }
          : null,
        memberships: memberships.map((m: any) => ({
          id: m._id,
          organization: m.organizationId
            ? {
                id: m.organizationId._id,
                name: m.organizationId.name,
                slug: m.organizationId.slug,
              }
            : null,
          role: m.role,
        })),
        accessToken,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'LOGIN_FAILED', message: err.message },
    });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawRefresh = req.cookies?.qubix_refresh || req.body?.refreshToken;

    if (!rawRefresh) {
      res.status(401).json({
        success: false,
        error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token provided.' },
      });
      return;
    }

    const payload = verifyRefreshToken(rawRefresh);
    if (!payload) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token expired or invalid.' },
      });
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' },
      });
      return;
    }

    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      activeOrganizationId: user.activeOrganizationId ? user.activeOrganizationId.toString() : undefined,
    });

    const newRefreshToken = generateRefreshToken({ userId: user._id.toString() });

    res.cookie('qubix_refresh', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'REFRESH_FAILED', message: err.message },
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
      return;
    }

    const user = req.user;
    const memberships = await OrganizationMembership.find({
      userId: user._id,
      status: 'active',
    }).populate('organizationId');

    let activeOrg = null;
    let activeRole = 'employee';

    if (memberships.length > 0) {
      const matched = memberships.find(
        (m: any) => user.activeOrganizationId && m.organizationId && m.organizationId._id.toString() === user.activeOrganizationId.toString()
      );
      const chosen: any = matched || memberships[0];
      if (chosen && chosen.organizationId) {
        activeOrg = chosen.organizationId;
        activeRole = chosen.role;
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          isSuperAdmin: user.isSuperAdmin,
          activeOrganizationId: user.activeOrganizationId,
        },
        organization: activeOrg
          ? {
              id: activeOrg._id,
              name: activeOrg.name,
              slug: activeOrg.slug,
              logoUrl: activeOrg.logoUrl,
              subscriptionPlan: activeOrg.subscriptionPlan,
              role: activeRole,
              settings: activeOrg.settings,
            }
          : null,
        memberships: memberships.map((m: any) => ({
          id: m._id,
          organization: m.organizationId
            ? {
                id: m.organizationId._id,
                name: m.organizationId.name,
                slug: m.organizationId.slug,
              }
            : null,
          role: m.role,
        })),
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'GET_ME_FAILED', message: err.message },
    });
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('qubix_refresh');
  res.json({ success: true, message: 'Logged out successfully.' });
};

export const switchOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.body;
    if (!req.user || !organizationId || !mongoose.Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({ success: false, error: { message: 'Valid organizationId is required' } });
      return;
    }

    const membership = await OrganizationMembership.findOne({
      userId: req.user._id,
      organizationId,
      status: 'active',
    }).populate('organizationId');

    if (!membership && !req.user.isSuperAdmin) {
      res.status(403).json({ success: false, error: { message: 'Not a member of this organization' } });
      return;
    }

    const user = await User.findById(req.user._id);
    if (user) {
      user.activeOrganizationId = new mongoose.Types.ObjectId(organizationId);
      await user.save();
    }

    const newAccessToken = generateAccessToken({
      userId: req.user._id.toString(),
      email: req.user.email,
      isSuperAdmin: req.user.isSuperAdmin,
      activeOrganizationId: organizationId,
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        organization: membership ? membership.organizationId : null,
        role: membership ? membership.role : 'owner',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
      return;
    }

    const { name, avatarUrl } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
      return;
    }

    if (name) user.name = name.trim();
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

