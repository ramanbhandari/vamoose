import express from 'express';
import validationErrorHandler from '@/middleware/validationErrorHandler.js';
import {
  validateGetNotificationsInput,
  validateToggleNotificationReadStatusInput,
  validateBatchMarkNotificationsAsReadInput,
} from '@/middleware/notification.validators.js';
import {
  getNotificationsHandler,
  markNotificationAsReadHandler,
  markNotificationAsUnreadHandler,
  batchMarkNotificationsAsReadHandler,
} from '@/controllers/notification.controller.js';

const router = express.Router({ mergeParams: true });

router
  .get(
    '/',
    validateGetNotificationsInput,
    validationErrorHandler,
    getNotificationsHandler,
  )
  .patch(
    '/mark-as-read',
    validateBatchMarkNotificationsAsReadInput,
    validationErrorHandler,
    batchMarkNotificationsAsReadHandler,
  )
  .patch(
    '/:notificationId/mark-as-read',
    validateToggleNotificationReadStatusInput,
    validationErrorHandler,
    markNotificationAsReadHandler,
  )
  .patch(
    '/:notificationId/mark-as-unread',
    validateToggleNotificationReadStatusInput,
    validationErrorHandler,
    markNotificationAsUnreadHandler,
  );

export default router;
