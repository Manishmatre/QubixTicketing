import { Router } from 'express';
import {
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
} from '../controllers/workflow.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenantIsolation.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

router.use(requireAuth, requireTenant);

router.get('/', getWorkflows);
router.post('/', requirePermission('manageWorkflows'), createWorkflow);
router.patch('/:id', requirePermission('manageWorkflows'), updateWorkflow);
router.delete('/:id', requirePermission('manageWorkflows'), deleteWorkflow);

export default router;

