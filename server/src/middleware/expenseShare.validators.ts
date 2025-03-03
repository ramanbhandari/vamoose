import { body, checkExact, param } from 'express-validator';

// Validator for /owed-summary/:userId
export const validateUserDebtSummaryInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a positive integer'),

  param('userId').isString().notEmpty().withMessage('User ID is required'),
]);

// Validator for /owed-summary
export const validateTripDebtSummaryInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a positive integer'),
]);

export const validateSettleExpenses = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a valid positive integer'),

  body('shareIds')
    .isArray({ min: 1 })
    .withMessage('ShareIds must be a non-empty array'),

  body('shareIds.*')
    .isInt({ min: 1 })
    .withMessage('Each share ID must be a positive integer'),
]);
