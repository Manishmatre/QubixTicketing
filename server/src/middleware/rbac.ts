import { Request, Response, NextFunction } from 'express';
import { OrgRole } from '../models/OrganizationMembership.js';

export type Permission =
  | 'manageOrganization'
  | 'manageBilling'
  | 'manageUsers'
  | 'createProjects'
  | 'editProjects'
  | 'deleteProjects'
  | 'createTickets'
  | 'assignTickets'
  | 'changeTicketStatus'
  | 'changePriority'
  | 'addComments'
  | 'uploadAttachments'
  | 'viewInternalNotes'
  | 'viewReports'
  | 'manageWorkflows';

const rolePermissions: Record<OrgRole, Permission[]> = {
  owner: [
    'manageOrganization',
    'manageBilling',
    'manageUsers',
    'createProjects',
    'editProjects',
    'deleteProjects',
    'createTickets',
    'assignTickets',
    'changeTicketStatus',
    'changePriority',
    'addComments',
    'uploadAttachments',
    'viewInternalNotes',
    'viewReports',
    'manageWorkflows',
  ],
  admin: [
    'manageOrganization',
    'manageBilling',
    'manageUsers',
    'createProjects',
    'editProjects',
    'deleteProjects',
    'createTickets',
    'assignTickets',
    'changeTicketStatus',
    'changePriority',
    'addComments',
    'uploadAttachments',
    'viewInternalNotes',
    'viewReports',
    'manageWorkflows',
  ],
  project_manager: [
    'createProjects',
    'editProjects',
    'createTickets',
    'assignTickets',
    'changeTicketStatus',
    'changePriority',
    'addComments',
    'uploadAttachments',
    'viewInternalNotes',
    'viewReports',
  ],
  team_lead: [
    'createTickets',
    'assignTickets',
    'changeTicketStatus',
    'changePriority',
    'addComments',
    'uploadAttachments',
    'viewInternalNotes',
    'viewReports',
  ],
  employee: [
    'createTickets',
    'changeTicketStatus',
    'changePriority',
    'addComments',
    'uploadAttachments',
    'viewInternalNotes',
    'viewReports',
  ],
  reporter: [
    'createTickets',
    'addComments',
    'uploadAttachments',
  ],
  viewer: [
    // Read-only
  ],
};

export const hasPermission = (role: OrgRole | undefined, permission: Permission, isSuperAdmin: boolean = false): boolean => {
  if (isSuperAdmin) return true;
  if (!role) return false;
  return rolePermissions[role]?.includes(permission) ?? false;
};

export const requireRole = (allowedRoles: OrgRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.isSuperAdmin) {
      return next();
    }
    const userRole = req.membershipRole;
    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_ROLE',
          message: `Permission denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${userRole || 'none'}`,
        },
      });
      return;
    }
    next();
  };
};

export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.isSuperAdmin) {
      return next();
    }
    const userRole = req.membershipRole;
    if (!hasPermission(userRole, permission, req.user?.isSuperAdmin)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: `Action requires '${permission}' permission. Your role '${userRole}' does not possess this privilege.`,
        },
      });
      return;
    }
    next();
  };
};

