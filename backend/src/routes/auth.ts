import { Router } from 'express';
import {
  getAvailableRoles,
  login,
  logout,
  refresh,
  selectRole,
  forgotPassword,
  verifyOtp,
  resetPasswordWithOtp,
  changePassword,
  registerPanel,
} from '../controllers/authController';
import { validate } from '../middleware/validate';
import { loginSchema, selectRoleSchema } from './auth.schemas';
import { authLimiter } from '../middleware/rateLimiters';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/roles', authLimiter, getAvailableRoles);
router.post('/select-role', authLimiter, validate(selectRoleSchema), selectRole);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', logout);

// Password management
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/reset-password', authLimiter, resetPasswordWithOtp);
router.post('/change-password', authLimiter, requireAuth(), changePassword);

// Self-service panel member registration
router.post('/register-panel', authLimiter, registerPanel);

export default router;
