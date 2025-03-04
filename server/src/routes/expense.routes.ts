import express from 'express';

import validationErrorHandler from '@/middleware/validationErrorHandler.js';

import {
  validateAddExpenseInput,
  validateFetchExpense,
  validateDeleteSingleExpense,
  validateDeleteMultipleExpenses,
  validateUpdateExpense,
} from '@/middleware/expense.validators.js';

import {
  addExpenseHandler,
  fetchSingleExpenseHandler,
  deleteSingleExpenseHandler,
  deleteMultipleExpensesHandler,
  updateExpenseHandler,
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
  )

  // Update an expense in trip
  .patch(
    '/:expenseId',
    validateUpdateExpense,
    validationErrorHandler,
    updateExpenseHandler,
  );

export default router;
