import express from 'express';
import validationErrorHandler from '@/middleware/validationErrorHandler.js';
import {
  validateCreatePollInput,
  validateDeletePollInput,
  validateBatchDeletePollsInput,
  validateGetAllPollsForTripInput,
} from '@/middleware/poll.validators';
import {
  createPollHandler,
  deletePollHandler,
  batchDeletePollsHandler,
  getAllPollsForTripHandler,
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
