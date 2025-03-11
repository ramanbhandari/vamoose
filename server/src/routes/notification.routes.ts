import express from 'express';
import validationErrorHandler from '@/middleware/validationErrorHandler.js';
import { validateGetNotificationsInput } from '@/middleware/notification.validators.js';
import { getNotificationsHandler } from '@/controllers/notification.controller.js';

const router = express.Router({ mergeParams: true });

router.get(
  '/',
  validateGetNotificationsInput,
  validationErrorHandler,
  getNotificationsHandler,
);

export default router;
