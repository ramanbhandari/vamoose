import { body, checkExact, param } from 'express-validator';

export const validateCreateMessageInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a positive number'),
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
    .isString()
    .withMessage('Message text must be a string'),
  body('reactions')
    .optional()
    .isObject()
    .withMessage('Reactions must be an object'),
  body('emoji').optional().isString().withMessage('Emoji must be a string'),
  body('userId').optional().isString().withMessage('User ID must be a string'),
  // Custom validator to ensure either text, reactions, or both emoji and userId are provided
  body().custom((value) => {
    const hasText = value.text !== undefined;
    const hasReactions = value.reactions !== undefined;
    const hasEmojiAndUserId = value.emoji && value.userId;

    if (!hasText && !hasReactions && !hasEmojiAndUserId) {
      throw new Error('At least one update field is required');
    }
    return true;
  }),
]);
