import { body, checkExact, param } from 'express-validator';

// Validator for /debt-summary/:userId
export const validateUserDebtSummaryInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a positive integer'),

  param('userId').isString().notEmpty().withMessage('User ID is required'),
]);

// Validator for /debt-summary
export const validateTripDebtSummaryInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a positive integer'),
]);

export const validateSettleExpensesInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a valid number'),

  body('expensesToSettle')
    .isArray({ min: 1 })
    .withMessage('expensesToSettle must be a non-empty array'),

  body('expensesToSettle.*.expenseId')
    .isInt({ min: 1 })
    .withMessage('Each expenseId must be a positive integer'),

  body('expensesToSettle.*.debtorUserId')
    .isString()
    .notEmpty()
    .withMessage('Each debtorUserId must be a non-empty string'),
]);
