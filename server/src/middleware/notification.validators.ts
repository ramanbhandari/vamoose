import { body, checkExact, param, query } from 'express-validator';
import { NotificationType } from '@/daos/enums.js';

export const validateGetNotificationsInput = checkExact(
  query('type')
    .optional()
    .isString()
    .withMessage('Notification type must be a string')
    .trim()
    .notEmpty()
    .withMessage('Notification type cannot be empty')
    .toUpperCase()
    .isIn(Object.values(NotificationType))
    .withMessage(
      `Notification type must be one of: ${Object.values(NotificationType).join(', ')}`,
    ),
);

export const validateHandleSingleNotificationInput = checkExact([
  param('notificationId')
    .isInt({ min: 1 })
    .withMessage('Notification ID must be a valid integer greater than 0'),
]);

export const validateHandleBatchNotificationsInput = checkExact([
  body('notificationIds')
    .isArray({ min: 1 })
    .withMessage('Notification IDs must be a non-empty array'),
  body('notificationIds.*')
    .isInt({ min: 1 })
    .withMessage('Each Notification ID must be a valid integer greater than 0'),
]);
