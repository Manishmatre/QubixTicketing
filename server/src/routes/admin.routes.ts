import { Router } from 'express';
import {
  getPlatformStats,
  listAllOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  listAllUsers,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
  listPlans,
  updatePlan,
  getPlatformSettings,
  updatePlatformSettings,
  getPlatformAuditLogs,
} from '../controllers/admin.controller.js';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js';

const router = Router();

// Enforce strict SuperAdmin authentication on all platform routes
router.use(requireAuth, requireSuperAdmin);

// Platform Telemetry
router.get('/stats', getPlatformStats);

// Organizations CRUD
router.get('/organizations', listAllOrganizations);
router.post('/organizations', createOrganization);
router.patch('/organizations/:id', updateOrganization);
router.put('/organizations/:id', updateOrganization);
router.delete('/organizations/:id', deleteOrganization);

// Global Users CRUD
router.get('/users', listAllUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);
router.put('/users/:id', updateUser);
router.post('/users/:id/reset-password', resetUserPassword);
router.delete('/users/:id', deleteUser);

// Platform Plans
router.get('/plans', listPlans);
router.put('/plans/:id', updatePlan);

// Global Platform Settings & Maintenance
router.get('/settings', getPlatformSettings);
router.put('/settings', updatePlatformSettings);

// Audit Logging
router.get('/audit-logs', getPlatformAuditLogs);

export default router;
