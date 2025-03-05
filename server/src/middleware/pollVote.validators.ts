import { checkExact, param, body } from 'express-validator';

export const validateCastVoteInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a positive integer'),
  param('pollId')
    .isInt({ min: 1 })
    .withMessage('Poll ID must be a positive integer'),
  body('pollOptionId')
    .isInt({ min: 1 })
    .withMessage('Poll Option ID must be a positive integer'),
]);

export const validateDeleteVoteInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a valid positive integer'),
  param('pollId')
    .isInt({ min: 1 })
    .withMessage('Poll ID must be a valid positive integer'),
]);
