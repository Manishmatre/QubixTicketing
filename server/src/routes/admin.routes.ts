import { Router } from 'express';
import {
  getPlatformStats,
  listAllOrganizations,
  updateOrganizationStatus,
  listAllUsers,
  getPlatformAuditLogs,
} from '../controllers/admin.controller.js';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireSuperAdmin);

router.get('/stats', getPlatformStats);
router.get('/organizations', listAllOrganizations);
router.patch('/organizations/:id', updateOrganizationStatus);
router.get('/users', listAllUsers);
router.get('/audit-logs', getPlatformAuditLogs);

export default router;

