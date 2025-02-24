import express from 'express';

import validationErrorHandler from '../middleware/validationErrorHandler.ts';

import {
  validateAddExpenseInput,
  validateFetchExpense,
  validateDeleteSingleExpense,
} from '../middleware/expense.validators.ts';

import {
  addExpenseHandler,
  fetchSingleExpenseHandler,
  deleteSingleExpenseHandler,
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
  );

  // Delete a single expense from the trip
  .delete(
    '/:expenseId',
    validateDeleteSingleExpense,
    validationErrorHandler,
    deleteSingleExpenseHandler,
  );

export default router;
