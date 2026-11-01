import { Router } from 'express';
import {
  getTickets,
  createTicket,
  getTicketById,
  updateTicket,
  updateTicketStatus,
  bulkUpdateTickets,
  deleteTicket,
  addTicketLink,
  deleteTicketLink,
} from '../controllers/ticket.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenantIsolation.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

router.use(requireAuth, requireTenant);

router.get('/', getTickets);
router.post('/', requirePermission('createTickets'), createTicket);
router.post('/bulk', requirePermission('changeTicketStatus'), bulkUpdateTickets);
router.get('/:id', getTicketById);
router.patch('/:id', requirePermission('changeTicketStatus'), updateTicket);
router.patch('/:id/status', requirePermission('changeTicketStatus'), updateTicketStatus);
router.post('/:id/links', requirePermission('createTickets'), addTicketLink);
router.delete('/:id/links/:linkId', requirePermission('createTickets'), deleteTicketLink);
router.delete('/:id', requirePermission('createTickets'), deleteTicket);

export default router;

