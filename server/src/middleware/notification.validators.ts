import { checkExact, query } from 'express-validator';
import { NotificationType } from '@/interfaces/enums.js';

export const validateGetNotificationsInput = checkExact([
  query('tripId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a valid positive integer')
    .toInt(),

  query('isRead')
    .optional()
    .isBoolean()
    .withMessage('isRead must be a boolean (true or false)')
    .toBoolean(),

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
]);
