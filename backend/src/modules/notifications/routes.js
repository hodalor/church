import { Router } from 'express';
import { param } from 'express-validator';
import auth from '../../middleware/auth.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import * as notificationController from './controller.js';

const router = Router();

router.use(auth, tenantScope);

router.get('/', notificationController.listNotifications);
router.patch(
  '/:id/read',
  [param('id').trim().notEmpty().withMessage('Notification ID is required.')],
  validate,
  notificationController.markNotificationRead,
);
router.patch('/read-all', notificationController.markAllNotificationsRead);

export default router;
