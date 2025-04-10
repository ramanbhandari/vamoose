import express from 'express';

import validationErrorHandler from '@/middlewares/validationErrorHandler.js';

import {
  validateAddExpenseInput,
  validateFetchExpense,
  validateDeleteSingleExpense,
  validateDeleteMultipleExpenses,
} from '@/middlewares/expense.validators.js';

import {
  addExpenseHandler,
  fetchSingleExpenseHandler,
  deleteSingleExpenseHandler,
  deleteMultipleExpensesHandler,
} from '@/controllers/expense.controller.js';

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

  // Delete a single expense from the trip
  .delete(
    '/:expenseId',
    validateDeleteSingleExpense,
    validationErrorHandler,
    deleteSingleExpenseHandler,
  )

  // Delete multiple expenses from trip
  .delete(
    '/',
    validateDeleteMultipleExpenses,
    validationErrorHandler,
    deleteMultipleExpensesHandler,
  );

export default router;
