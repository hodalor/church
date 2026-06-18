import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from './controller.js';
import validate from '../../middleware/validate.js';
import auth from '../../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
  },
});

router.post(
  '/login',
  [
    body('tenantId').trim().notEmpty().withMessage('Tenant ID is required.'),
    body('username').trim().notEmpty().withMessage('Username or phone is required.'),
    body('pin')
      .matches(/^\d{4,6}$/)
      .withMessage('PIN must be a 4 to 6 digit numeric value.'),
  ],
  loginLimiter,
  validate,
  authController.login,
);
router.post(
  '/refresh',
  [body('refreshToken').trim().notEmpty().withMessage('Refresh token is required.')],
  validate,
  authController.refreshSession,
);
router.post(
  '/logout',
  [body('refreshToken').optional({ nullable: true }).isString().withMessage('Refresh token must be a string.')],
  validate,
  authController.logout,
);
router.get('/me', auth, authController.getMe);
router.patch(
  '/fcm-token',
  auth,
  [body('fcmToken').optional({ nullable: true }).isString().withMessage('FCM token must be a string.')],
  validate,
  authController.updateFcmToken,
);

export default router;
