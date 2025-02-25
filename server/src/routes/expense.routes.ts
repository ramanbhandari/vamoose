import express from 'express';

import validationErrorHandler from '../middleware/validationErrorHandler.ts';

import {
  validateAddExpenseInput,
  validateFetchExpense,
  validateDeleteSingleExpense,
  validateDeleteMultipleExpense,
} from '../middleware/expense.validators.ts';

import {
  addExpenseHandler,
  fetchSingleExpenseHandler,
  deleteSingleExpenseHandler,
  deleteMultipleExpenseHandler,
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
    validateDeleteMultipleExpense,
    validationErrorHandler,
    deleteMultipleExpenseHandler,
  );

export default router;
