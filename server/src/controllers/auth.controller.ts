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
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : '',
      passwordHash,
      isSuperAdmin: false,
      isVerified: false,
      verificationToken,
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      otpCode,
      otpExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes validity
    });

    // Dispatch verification OTP email via SMTP
    await emailService.sendOtpVerificationEmail(user.email, user.name, otpCode, verificationToken);

    await logAuditEvent({
      userId: user._id as any,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user._id.toString(),
      req,
      details: { email: user.email },
    });

    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email for the 6-digit verification code.',
      data: {
        requiresVerification: true,
        email: user.email,
        name: user.name,
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

    if (!user.isVerified) {
      // Send fresh OTP if needed
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.otpCode = otpCode;
      user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
      emailService.sendOtpVerificationEmail(user.email, user.name, otpCode, user.verificationToken).catch(() => {});

      res.status(403).json({
        success: false,
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email address. A 6-digit verification code has been sent to your email.',
          email: user.email,
        },
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
          designation: user.designation || '',
          avatarUrl: user.avatarUrl,
          isSuperAdmin: user.isSuperAdmin,
          mustChangePassword: user.mustChangePassword || false,
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
          designation: user.designation || '',
          avatarUrl: user.avatarUrl,
          isSuperAdmin: user.isSuperAdmin,
          mustChangePassword: user.mustChangePassword || false,
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

    const allMemberships = await OrganizationMembership.find({
      userId: req.user._id,
      status: 'active',
    }).populate('organizationId');

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        organization: membership ? membership.organizationId : null,
        role: membership ? membership.role : 'owner',
        memberships: allMemberships.map((m: any) => ({
          id: m._id,
          organization: m.organizationId
            ? {
                id: m.organizationId._id,
                name: m.organizationId.name,
                slug: m.organizationId.slug,
                logoUrl: m.organizationId.logoUrl,
                subscriptionPlan: m.organizationId.subscriptionPlan,
              }
            : null,
          role: m.role,
          jobTitle: m.jobTitle,
          department: m.department,
        })),
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

    const { name, avatarUrl, phoneNumber, designation, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
      return;
    }

    if (name) user.name = name.trim();
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();
    if (designation !== undefined) user.designation = designation.trim();

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
        phoneNumber: user.phoneNumber || '',
        designation: user.designation || '',
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, email, otp } = req.body;

    let user = null;

    if (otp && email) {
      const cleanEmail = String(email).toLowerCase().trim();
      const cleanOtp = String(otp).trim();
      user = await User.findOne({
        email: cleanEmail,
        otpCode: cleanOtp,
        otpExpiresAt: { $gt: new Date() },
      });

      if (!user) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid or expired verification code. Please check your email or request a new code.' },
        });
        return;
      }
    } else if (token) {
      user = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: new Date() },
      });

      if (!user) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid or expired verification link. Please request a new verification code.' },
        });
        return;
      }
    } else {
      res.status(400).json({
        success: false,
        error: { message: 'Email and 6-digit verification code are required.' },
      });
      return;
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    await logAuditEvent({
      userId: user._id as any,
      action: 'EMAIL_VERIFIED',
      entity: 'User',
      entityId: user._id.toString(),
      req,
    });

    // Auto-login after successful email verification so user seamlessly enters onboarding
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      activeOrganizationId: user.activeOrganizationId ? user.activeOrganizationId.toString() : undefined,
    });

    const refreshToken = generateRefreshToken({ userId: user._id.toString() });

    res.cookie('qubix_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Email verified successfully! Proceeding to workspace setup.',
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber || '',
          designation: user.designation || '',
          avatarUrl: user.avatarUrl,
          isSuperAdmin: user.isSuperAdmin,
          isVerified: user.isVerified,
          activeOrganizationId: user.activeOrganizationId,
        },
      },
    });
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
      res.json({ success: true, message: 'If an account exists with this email, a new verification code has been sent.' });
      return;
    }

    if (user.isVerified) {
      res.json({ success: true, message: 'This email is already verified. You can log in.' });
      return;
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.otpCode = otpCode;
    user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await emailService.sendOtpVerificationEmail(user.email, user.name, otpCode, verificationToken);

    res.json({ success: true, message: `A fresh 6-digit verification code has been sent to ${user.email}.` });
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

    const existingUser = await User.findOne({ email: invitation.email.toLowerCase().trim() });

    res.json({
      success: true,
      data: {
        email: invitation.email,
        role: invitation.role,
        organization: invitation.organizationId,
        invitedBy: invitation.invitedBy,
        userExists: Boolean(existingUser),
        existingUserName: existingUser?.name || '',
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

    let user = await User.findOne({ email: invitation.email.toLowerCase().trim() });

    // If user does not exist yet, require name & password (min 8 characters)
    if (!user) {
      if (!name || !password) {
        res.status(400).json({ success: false, error: { message: 'Full name and password are required to create your account.' } });
        return;
      }
      if (password.length < 8) {
        res.status(400).json({ success: false, error: { message: 'Password must be at least 8 characters.' } });
        return;
      }

      const passwordHash = await hashPassword(password);
      user = await User.create({
        name: name.trim(),
        email: invitation.email.toLowerCase().trim(),
        passwordHash,
        isVerified: true,
        activeOrganizationId: invitation.organizationId,
      });
    } else {
      user.activeOrganizationId = invitation.organizationId;
      await user.save();
    }

    // Activate membership
    let existingMembership = await OrganizationMembership.findOne({
      organizationId: invitation.organizationId,
      userId: user._id,
    });

    if (!existingMembership) {
      existingMembership = await OrganizationMembership.create({
        organizationId: invitation.organizationId,
        userId: user._id,
        role: invitation.role,
        status: 'active',
      });
    } else {
      existingMembership.status = 'active';
      existingMembership.role = invitation.role;
      await existingMembership.save();
    }

    invitation.status = 'accepted';
    await invitation.save();

    const allMemberships = await OrganizationMembership.find({
      userId: user._id,
      status: 'active',
    }).populate('organizationId');

    const targetOrg = await Organization.findById(invitation.organizationId);

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      activeOrganizationId: invitation.organizationId.toString(),
    });

    const refreshToken = generateRefreshToken({ userId: user._id.toString() });

    res.cookie('qubix_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Invitation accepted! Welcome to the team.',
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber || '',
          designation: user.designation || '',
          avatarUrl: user.avatarUrl,
          isSuperAdmin: user.isSuperAdmin,
          isVerified: user.isVerified,
          activeOrganizationId: user.activeOrganizationId,
        },
        organization: targetOrg
          ? {
              id: targetOrg._id,
              name: targetOrg.name,
              slug: targetOrg.slug,
              logoUrl: targetOrg.logoUrl,
              subscriptionPlan: targetOrg.subscriptionPlan,
              role: invitation.role,
            }
          : null,
        memberships: allMemberships.map((m: any) => ({
          id: m._id,
          organization: m.organizationId
            ? {
                id: m.organizationId._id,
                name: m.organizationId.name,
                slug: m.organizationId.slug,
                logoUrl: m.organizationId.logoUrl,
                subscriptionPlan: m.organizationId.subscriptionPlan,
              }
            : null,
          role: m.role,
          jobTitle: m.jobTitle,
          department: m.department,
        })),
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

export const setPermanentPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 8 characters long.' },
      });
      return;
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found.' } });
      return;
    }

    user.passwordHash = await hashPassword(newPassword);
    user.mustChangePassword = false;
    await user.save();

    await logAuditEvent({
      userId: user._id as any,
      organizationId: user.activeOrganizationId as any,
      action: 'PASSWORD_UPDATED',
      entity: 'User',
      entityId: user._id.toString(),
      req,
    });

    res.json({
      success: true,
      message: 'Permanent password set successfully! Welcome to your workspace.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};


