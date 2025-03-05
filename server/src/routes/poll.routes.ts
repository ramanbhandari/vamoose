import express from 'express';
import validationErrorHandler from '@/middleware/validationErrorHandler.js';
import {
  validateCreatePollInput,
  validateDeletePollInput,
  validateBatchDeletePollsInput,
  validateGetAllPollsForTripInput,
  validateMarkPollsAsCompletedInput,
} from '@/middleware/poll.validators';
import {
  createPollHandler,
  deletePollHandler,
  batchDeletePollsHandler,
  getAllPollsForTripHandler,
  markPollsAsCompletedHandler,
} from '@/controllers/poll.controller';

const router = express.Router({ mergeParams: true });

router
  .get(
    '/',
    validateGetAllPollsForTripInput,
    validationErrorHandler,
    getAllPollsForTripHandler,
  )
  .post('/', validateCreatePollInput, validationErrorHandler, createPollHandler)
  .patch(
    '/complete',
    validateMarkPollsAsCompletedInput,
    validationErrorHandler,
    markPollsAsCompletedHandler,
  )
  .delete(
    '/:pollId',
    validateDeletePollInput,
    validationErrorHandler,
    deletePollHandler,
  )
  .delete(
    '/',
    validateBatchDeletePollsInput,
    validationErrorHandler,
    batchDeletePollsHandler,
  );

export default router;
