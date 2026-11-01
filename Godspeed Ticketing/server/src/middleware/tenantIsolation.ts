import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Organization } from '../models/Organization.js';
import { OrganizationMembership, OrgRole } from '../models/OrganizationMembership.js';

export const requireTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    // Determine target organization ID from headers, query, or body
    let rawOrgId =
      (req.headers['x-organization-id'] as string) ||
      (req.query.organizationId as string) ||
      (req.query.orgId as string) ||
      (req.body && req.body.organizationId) ||
      (req.user.activeOrganizationId ? req.user.activeOrganizationId.toString() : null);

    if (!rawOrgId || !mongoose.Types.ObjectId.isValid(rawOrgId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'An active organization context (x-organization-id header) is required for this resource.',
        },
      });
      return;
    }

    const orgObjectId = new mongoose.Types.ObjectId(rawOrgId);

    // Verify Organization exists
    const organization = await Organization.findById(orgObjectId);
    if (!organization) {
      res.status(404).json({
        success: false,
        error: { code: 'ORGANIZATION_NOT_FOUND', message: 'Target organization does not exist.' },
      });
      return;
    }

    if (organization.status === 'suspended' && !req.user.isSuperAdmin) {
      res.status(403).json({
        success: false,
        error: {
          code: 'ORGANIZATION_SUSPENDED',
          message: 'This organization workspace has been suspended. Please contact platform support.',
        },
      });
      return;
    }

    // Check membership
    const membership = await OrganizationMembership.findOne({
      organizationId: orgObjectId,
      userId: req.user._id,
      status: 'active',
    });

    if (!membership && !req.user.isSuperAdmin) {
      res.status(403).json({
        success: false,
        error: {
          code: 'CROSS_TENANT_ACCESS_DENIED',
          message: 'Security Violation: You do not have active membership in this organization workspace.',
        },
      });
      return;
    }

    req.organizationId = orgObjectId;
    req.membership = membership || undefined;
    req.membershipRole = (membership ? membership.role : 'owner') as OrgRole;

    next();
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'TENANT_ISOLATION_ERROR', message: err.message },
    });
  }
};

/**
 * Helper to ensure any database query has tenant isolation strictly attached.
 */
export const tenantScope = <T extends Record<string, any>>(req: Request, query: T = {} as T): T & { organizationId: mongoose.Types.ObjectId } => {
  if (!req.organizationId) {
    throw new Error('Security Error: tenantScope called without active req.organizationId.');
  }
  return {
    ...query,
    organizationId: req.organizationId,
  };
};

