import express from 'express';
import { register, login, getProfile, requestEmailVerification, verifyEmail, requestPasswordReset, resetPassword } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.post('/verify-email/request', authenticateToken, requestEmailVerification);
router.get('/verify-email', verifyEmail);
router.post('/password/forgot', requestPasswordReset);
router.post('/password/reset', resetPassword);

export default router;
