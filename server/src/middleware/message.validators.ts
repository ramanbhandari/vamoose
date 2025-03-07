import { body, checkExact, param } from 'express-validator';

export const validateCreateMessageInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a positive number'),
  body('text')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Message text must be non-empty string'),
]);

export const validateGetMessagesInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a positive number'),
]);

export const validateUpdateMessageInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a positive number'),
  param('messageId').isString().withMessage('Message ID must be a string.'),
  body('text')
    .optional()
    .notEmpty()
    .withMessage('Message text must be non-empty.')
    .isString()
    .trim()
    .withMessage('Message text must be a string'),
  body('reactions')
    .optional()
    .isObject()
    .withMessage('Reactions must be an object'),
  body('emoji').optional().isString().withMessage('Emoji must be a string'),
  // Custom validator to ensure either text, reactions, or emoji are provided
  body().custom((value) => {
    const hasText = value.text !== undefined;
    const hasReactions = value.reactions !== undefined;
    const hasEmoji = value.emoji;

    if (!hasText && !hasReactions && !hasEmoji) {
      throw new Error('At least one update field is required');
    }
    return true;
  }),
]);
