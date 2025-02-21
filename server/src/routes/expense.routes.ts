import express from 'express';

import validationErrorHandler from '../middleware/validationErrorHandler.ts';
import { authMiddleware } from '../middleware/authMiddleware.ts';

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
    authMiddleware,
    addExpenseHandler,
  )

  // Fetch a single Expense from the Trip
  .get(
    '/:tripId/:expenseId',
    validateFetchExpense,
    validationErrorHandler,
    authMiddleware,
    fetchSingleExpenseHandler,
  );

export default router;
