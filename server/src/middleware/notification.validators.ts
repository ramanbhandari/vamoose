import { checkExact, query } from 'express-validator';
import { NotificationType } from '@/interfaces/enums.js';

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
]);
