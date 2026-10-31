import { Router } from 'express';
import {
  getMyOrganizations,
  completeOnboarding,
  getCurrentOrganization,
  updateCurrentOrganization,
  getMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
} from '../controllers/organization.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenantIsolation.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

router.use(requireAuth);

router.get('/my-organizations', getMyOrganizations);
router.post('/onboarding', completeOnboarding);

// Tenant-scoped routes
router.get('/current', requireTenant, getCurrentOrganization);
router.patch('/current', requireTenant, requirePermission('manageOrganization'), updateCurrentOrganization);
router.get('/members', requireTenant, getMembers);
router.post('/members/invite', requireTenant, requirePermission('manageUsers'), inviteMember);
router.patch('/members/:memberId/role', requireTenant, requirePermission('manageUsers'), updateMemberRole);
router.delete('/members/:memberId', requireTenant, requirePermission('manageUsers'), removeMember);

export default router;

