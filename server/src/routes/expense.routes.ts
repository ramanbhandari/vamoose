import express from 'express';

import validationErrorHandler from '../middleware/validationErrorHandler.ts';

import {
  validateAddExpenseInput,
  validateFetchExpense,
  validateFetchMultipleExpenses,
} from '../middleware/expense.validators.ts';

import {
  addExpenseHandler,
  fetchSingleExpenseHandler,
  fetchMultipleExpensesHandler,
} from '../controllers/expense.controller.ts';

const router = express.Router({ mergeParams: true });

router
  //  Trip Expense CRUD routes
  .post('/', validateAddExpenseInput, validationErrorHandler, addExpenseHandler)

  // Fetch a single Expense from the Trip
  .get(
    '/:expenseId',
    validateFetchExpense,
    validationErrorHandler,
    fetchSingleExpenseHandler,
  )

  // Fetch multiple expenses from the Trip
  .get(
    '/',
    validateFetchMultipleExpenses,
    validationErrorHandler,
    fetchMultipleExpensesHandler,
  );

export default router;
