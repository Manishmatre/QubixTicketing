import { Router } from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenantIsolation.js';

const router = Router();

router.use(requireAuth, requireTenant);

router.get('/', getMyNotifications);
router.patch('/:id/read', markAsRead);
router.post('/mark-all-read', markAllAsRead);

export default router;

