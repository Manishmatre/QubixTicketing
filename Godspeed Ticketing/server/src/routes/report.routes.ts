import { Router } from 'express';
import { getDashboardStats, exportTicketsCSV } from '../controllers/report.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenantIsolation.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

router.use(requireAuth, requireTenant);

router.get('/dashboard-stats', getDashboardStats);
router.get('/export-csv', requirePermission('viewReports'), exportTicketsCSV);

export default router;

