import { Router } from 'express';
import {
  getCommentsByTicket,
  createComment,
  updateComment,
  toggleReaction,
  getTicketActivities,
} from '../controllers/ticketComment.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenantIsolation.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

router.use(requireAuth, requireTenant);

router.get('/ticket/:ticketId', getCommentsByTicket);
router.post('/ticket/:ticketId', requirePermission('addComments'), createComment);
router.patch('/:commentId', updateComment);
router.post('/:commentId/reactions', toggleReaction);
router.get('/ticket/:ticketId/activities', getTicketActivities);

export default router;

