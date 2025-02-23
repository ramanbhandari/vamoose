import express from 'express';

import validationErrorHandler from '../middleware/validationErrorHandler.ts';

import {
  validateAddExpenseInput,
  validateFetchExpense,
} from '../middleware/expense.validators.ts';

import {
  addExpenseHandler,
  fetchSingleExpenseHandler,
} from '../controllers/expense.controller.ts';

const router = express.Router({ mergeParams: true });

router
  //  Trip Expense CRUD routes
  .post(
    '/',
    validateAddExpenseInput,
    validationErrorHandler,
    addExpenseHandler,
  )

  // Fetch a single Expense from the Trip
  .get(
    '/:expenseId',
    validateFetchExpense,
    validationErrorHandler,
    authMiddleware,
    fetchSingleExpenseHandler,
  );

export default router;
