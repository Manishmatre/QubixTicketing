import { Router } from 'express';
import {
  getAttachmentsByTicket,
  uploadAttachment,
  downloadAttachment,
  deleteAttachment,
} from '../controllers/attachment.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenantIsolation.js';
import { requirePermission } from '../middleware/rbac.js';
import { uploadMiddleware } from '../services/storageAdapter.js';

const router = Router();

router.use(requireAuth, requireTenant);

router.get('/ticket/:ticketId', getAttachmentsByTicket);
router.post(
  '/ticket/:ticketId',
  requirePermission('uploadAttachments'),
  uploadMiddleware.single('file'),
  uploadAttachment
);
router.get('/:id/download', downloadAttachment);
router.delete('/:id', requirePermission('editProjects'), deleteAttachment);

export default router;

