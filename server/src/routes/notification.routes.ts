import express from 'express';
import validationErrorHandler from '@/middlewares/validationErrorHandler.js';
import {
  validateGetNotificationsInput,
  validateHandleSingleNotificationInput,
  validateHandleBatchNotificationsInput,
} from '@/middlewares/notification.validators.js';
import {
  getNotificationsHandler,
  markNotificationAsReadHandler,
  markNotificationAsUnreadHandler,
  batchMarkNotificationsAsReadHandler,
  deleteNotificationHandler,
  batchDeleteNotificationsHandler,
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
    validateHandleBatchNotificationsInput,
    validationErrorHandler,
    batchMarkNotificationsAsReadHandler,
  )
  .patch(
    '/:notificationId/mark-as-read',
    validateHandleSingleNotificationInput,
    validationErrorHandler,
    markNotificationAsReadHandler,
  )
  .patch(
    '/:notificationId/mark-as-unread',
    validateHandleSingleNotificationInput,
    validationErrorHandler,
    markNotificationAsUnreadHandler,
  )
  .delete(
    '/clear',
    validateHandleBatchNotificationsInput,
    validationErrorHandler,
    batchDeleteNotificationsHandler,
  )
  .delete(
    '/:notificationId/clear',
    validateHandleSingleNotificationInput,
    validationErrorHandler,
    deleteNotificationHandler,
  );

export default router;
