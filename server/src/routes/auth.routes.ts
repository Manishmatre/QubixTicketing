import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  getCurrentUser,
  logout,
  switchOrganization,
  updateProfile,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getInvitationDetails,
  acceptInvitation,
  uploadAvatar,
  uploadUserDocument,
  getUserDocuments,
  deleteUserDocument,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadMiddleware } from '../services/storageAdapter.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/invitation/:token', getInvitationDetails);
router.post('/accept-invitation', acceptInvitation);

router.get('/me', requireAuth, getCurrentUser);
router.patch('/profile', requireAuth, updateProfile);
router.post('/avatar', requireAuth, uploadMiddleware.single('avatar'), uploadAvatar);
router.get('/documents', requireAuth, getUserDocuments);
router.post('/documents', requireAuth, uploadMiddleware.single('document'), uploadUserDocument);
router.delete('/documents/:documentId', requireAuth, deleteUserDocument);
router.post('/switch-org', requireAuth, switchOrganization);

export default router;

