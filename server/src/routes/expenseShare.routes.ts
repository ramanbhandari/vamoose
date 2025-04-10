import express from 'express';

import validationErrorHandler from '@/middleware/validationErrorHandler.js';

import {
  validateTripDebtSummaryInput,
  validateUserDebtSummaryInput,
  validateSettleExpenseSharesInput,
} from '@/middleware/expenseShare.validators.js';

import {
  getTripDebtsSummaryHandler,
  getUserDebtDetailsHandler,
  settleExpenseSharesHandler,
} from '@/controllers/expenseShare.controller.js';

const router = express.Router({ mergeParams: true });

router
  // Returns a summary of how much each member owes to others within a specific trip.
  .get(
    '/debt-summary',
    validateTripDebtSummaryInput,
    validationErrorHandler,
    getTripDebtsSummaryHandler,
  )

  // Fetches detailed information about what a specific user owes to others, useful for when the expandable card is opened.
  .get(
    '/debt-summary/:userId',
    validateUserDebtSummaryInput,
    validationErrorHandler,
    getUserDebtDetailsHandler,
  )

  //  Settle expenses for a trip
  .patch(
    '/settle',
    validateSettleExpenseSharesInput,
    validationErrorHandler,
    settleExpenseSharesHandler,
  );

export default router;
