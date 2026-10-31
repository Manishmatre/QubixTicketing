import { Router } from 'express';
import {
  getPlans,
  getCurrentSubscription,
  upgradeSubscription,
} from '../controllers/subscription.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenantIsolation.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

router.get('/plans', getPlans);

router.use(requireAuth, requireTenant);

router.get('/current', getCurrentSubscription);
router.post('/upgrade', requirePermission('manageBilling'), upgradeSubscription);

export default router;

