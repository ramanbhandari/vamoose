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

export const validateSettleExpenseSharesInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a valid number'),

  body('expenseSharesToSettle')
    .isArray({ min: 1 })
    .withMessage('expenseSharesToSettle must be a non-empty array'),

  body('expenseSharesToSettle.*.expenseId')
    .isInt({ min: 1 })
    .withMessage('Each expenseId must be a positive integer'),

  body('expenseSharesToSettle.*.debtorUserId')
    .isString()
    .notEmpty()
    .withMessage('Each debtorUserId must be a non-empty string'),
]);
