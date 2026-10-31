import { Router } from 'express';
import {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  addProjectMilestone,
} from '../controllers/project.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenantIsolation.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

router.use(requireAuth, requireTenant);

router.get('/', getProjects);
router.post('/', requirePermission('createProjects'), createProject);
router.get('/:id', getProjectById);
router.patch('/:id', requirePermission('editProjects'), updateProject);
router.delete('/:id', requirePermission('deleteProjects'), deleteProject);
router.post('/:id/members', requirePermission('editProjects'), addProjectMember);
router.post('/:id/milestones', requirePermission('editProjects'), addProjectMilestone);

export default router;

