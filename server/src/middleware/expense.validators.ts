import { body, checkExact, param } from 'express-validator';

export const validateAddExpenseInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a valid number'),

  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),

  body('category').isString().notEmpty().withMessage('Category is required'),

  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),

  body('paidByEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid email format for paidByEmail'),

  body('splitAmongEmails')
    .optional()
    .isArray({ min: 1 })
    .withMessage('splitAmongEmails must be a non-empty array'),

  body('splitAmongEmails.*')
    .optional()
    .isEmail()
    .withMessage('Each email in splitAmongEmails must be a valid email'),
]);

export const validateFetchExpense = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a valid number'),

  param('expenseId')
    .isInt({ min: 1 })
    .withMessage('Expense ID must be a valid number'),
]);

export const validateDeleteSingleExpense = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a valid number'),

  param('expenseId')
    .isInt({ min: 1 })
    .withMessage('Expense ID must be a valid number'),
]);

export const validateDeleteMultipleExpenses = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a valid number'),

  body('expenseIds')
    .isArray({ min: 1 })
    .withMessage('expenseIds must be a non-empty array'),

  body('expenseIds.*')
    .isInt({ min: 1 })
    .withMessage('Each expense ID in expenseIds must be a valid number'),
]);
