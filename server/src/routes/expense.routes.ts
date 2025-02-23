import express from 'express';
import validationErrorHandler from '../middleware/validationErrorHandler.ts';
import { validateAddExpenseInput } from '../middleware/expense.validators.ts';

import { addExpenseHandler } from '../controllers/expense.controller.ts';

const router = express.Router({ mergeParams: true });

router
  //  Trip Expense CRUD routes
  .post(
    '/',
    validateAddExpenseInput,
    validationErrorHandler,
    addExpenseHandler,
  );

export default router;
