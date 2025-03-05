import { body, checkExact, param } from 'express-validator';

export const validateCreatePollInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a positive integer'),

  body('question')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Question is required'),

  body('expiresAt')
    .isISO8601()
    .withMessage('Expiration date must be a valid ISO8601 date'),

  body('options')
    .isArray({ min: 2 })
    .withMessage('At least two poll options are required'),
  body('options.*')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Each option must be a non-empty string'),
]);
