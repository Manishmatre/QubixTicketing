import { Request, Response } from 'express';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { OrganizationMembership } from '../models/OrganizationMembership.js';
import { Invitation } from '../models/Invitation.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { logAuditEvent } from '../services/auditService.js';
import { emailService } from '../services/emailAdapter.js';
import { processUploadedFile } from '../services/storageAdapter.js';
import mongoose from 'mongoose';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, organizationName, slug, phoneNumber } = req.body;

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
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : '',
      passwordHash,
      isSuperAdmin: false,
      isVerified: false,
      verificationToken,
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Dispatch verification email via SMTP
    emailService.sendVerificationEmail(user.email, user.name, verificationToken).catch((err) => {
      console.error('[Auth] Failed to send verification email:', err);
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
          phoneNumber: user.phoneNumber || '',
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
          phoneNumber: user.phoneNumber || '',
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
          phoneNumber: user.phoneNumber || '',
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

    const { name, avatarUrl, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
      return;
    }

    if (name) user.name = name.trim();
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ success: false, error: { message: 'Current password is required.' } });
        return;
      }
      const isMatch = await comparePassword(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ success: false, error: { message: 'Current password is incorrect.' } });
        return;
      }
      if (newPassword.length < 6) {
        res.status(400).json({ success: false, error: { message: 'New password must be at least 6 characters.' } });
        return;
      }
      user.passwordHash = await hashPassword(newPassword);
    }

    await user.save();

    res.json({
      success: true,
      message: newPassword ? 'Profile and password updated successfully!' : 'Profile updated successfully!',
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

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, error: { message: 'Verification token is required.' } });
      return;
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid or expired verification link. Please request a new verification email.' },
      });
      return;
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    await logAuditEvent({
      userId: user._id as any,
      action: 'EMAIL_VERIFIED',
      entity: 'User',
      entityId: user._id.toString(),
      req,
    });

    res.json({ success: true, message: 'Email verified successfully! Your account is active.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: { message: 'Email address is required.' } });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.json({ success: true, message: 'If an account exists with this email, a new verification link has been sent.' });
      return;
    }

    if (user.isVerified) {
      res.json({ success: true, message: 'This email is already verified. You can log in.' });
      return;
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await emailService.sendVerificationEmail(user.email, user.name, verificationToken);

    res.json({ success: true, message: 'A new verification email has been dispatched via SMTP.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: { message: 'Email address is required.' } });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.json({
        success: true,
        message: 'If an account exists with that email address, a password reset link has been dispatched.',
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

    res.json({
      success: true,
      message: 'If an account exists with that email address, a password reset link has been dispatched.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ success: false, error: { message: 'Token and new password are required.' } });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: { message: 'New password must be at least 6 characters.' } });
      return;
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ success: false, error: { message: 'Invalid or expired password reset link. Please request a new one.' } });
      return;
    }

    user.passwordHash = await hashPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await logAuditEvent({
      userId: user._id as any,
      action: 'PASSWORD_RESET',
      entity: 'User',
      entityId: user._id.toString(),
      req,
    });

    res.json({ success: true, message: 'Password reset successfully! You can now log in with your new credentials.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const getInvitationDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({ token, status: 'pending', expiresAt: { $gt: new Date() } })
      .populate('organizationId', 'name slug logoUrl')
      .populate('invitedBy', 'name email');

    if (!invitation) {
      res.status(404).json({ success: false, error: { message: 'Invitation not found or has expired.' } });
      return;
    }

    res.json({
      success: true,
      data: {
        email: invitation.email,
        role: invitation.role,
        organization: invitation.organizationId,
        invitedBy: invitation.invitedBy,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const acceptInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, name, password } = req.body;
    if (!token) {
      res.status(400).json({ success: false, error: { message: 'Invitation token is required.' } });
      return;
    }

    const invitation = await Invitation.findOne({ token, status: 'pending', expiresAt: { $gt: new Date() } });
    if (!invitation) {
      res.status(404).json({ success: false, error: { message: 'Invalid or expired invitation.' } });
      return;
    }

    let user = await User.findOne({ email: invitation.email });

    // If user does not exist yet, require name & password to create account
    if (!user) {
      if (!name || !password) {
        res.status(400).json({ success: false, error: { message: 'Name and password are required to create your account.' } });
        return;
      }
      if (password.length < 6) {
        res.status(400).json({ success: false, error: { message: 'Password must be at least 6 characters.' } });
        return;
      }

      const passwordHash = await hashPassword(password);
      user = await User.create({
        name: name.trim(),
        email: invitation.email,
        passwordHash,
        isVerified: true,
        activeOrganizationId: invitation.organizationId,
      });
    } else {
      user.activeOrganizationId = invitation.organizationId;
      await user.save();
    }

    // Check if membership already exists
    const existingMembership = await OrganizationMembership.findOne({
      organizationId: invitation.organizationId,
      userId: user._id,
    });

    if (!existingMembership) {
      await OrganizationMembership.create({
        organizationId: invitation.organizationId,
        userId: user._id,
        role: invitation.role,
        status: 'active',
      });
    }

    invitation.status = 'accepted';
    await invitation.save();

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      activeOrganizationId: invitation.organizationId.toString(),
    });

    res.json({
      success: true,
      message: 'Invitation accepted! Welcome to the team.',
      data: {
        accessToken,
        userId: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const uploadAvatar = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: { message: 'No image file uploaded.' } });
      return;
    }

    const { fileUrl } = await processUploadedFile(req.file);

    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found.' } });
      return;
    }

    user.avatarUrl = fileUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar uploaded successfully!',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        phoneNumber: user.phoneNumber,
        isSuperAdmin: user.isSuperAdmin,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const uploadUserDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: { message: 'No document file uploaded.' } });
      return;
    }

    const { fileUrl, fileName } = await processUploadedFile(req.file);
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found.' } });
      return;
    }

    const title = (req.body.title || req.file.originalname).trim();
    if (!user.documents) {
      user.documents = [];
    }

    const newDoc = {
      title,
      fileUrl,
      fileName,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      uploadedAt: new Date(),
    };

    user.documents.push(newDoc as any);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully!',
      data: user.documents,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const getUserDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found.' } });
      return;
    }

    res.json({
      success: true,
      data: user.documents || [],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const deleteUserDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found.' } });
      return;
    }

    user.documents = (user.documents || []).filter(
      (doc: any) => doc._id.toString() !== documentId
    );
    await user.save();

    res.json({
      success: true,
      message: 'Document removed successfully.',
      data: user.documents,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

