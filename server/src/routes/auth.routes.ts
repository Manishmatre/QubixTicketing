import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  getCurrentUser,
  logout,
  switchOrganization,
  updateProfile,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

router.get('/me', requireAuth, getCurrentUser);
router.patch('/profile', requireAuth, updateProfile);
router.post('/switch-org', requireAuth, switchOrganization);

export default router;

