import express from 'express';
import validationErrorHandler from '../middleware/validationErrorHandler.ts';
import { authMiddleware } from '../middleware/authMiddleware.ts';
import { validateAddExpenseInput } from '../middleware/expense.validators.ts';

import { addExpenseHandler } from '../controllers/expense.controller.ts';

const router = express.Router({ mergeParams: true });

router
  //  Trip Expense CRUD routes
  .post(
    '/',
    validateAddExpenseInput,
    validationErrorHandler,
    authMiddleware,
    addExpenseHandler,
  );

export default router;
