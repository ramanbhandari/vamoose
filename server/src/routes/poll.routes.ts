import express from 'express';
import validationErrorHandler from '@/middleware/validationErrorHandler.js';
import {
  validateCreatePollInput,
  validateDeletePollInput,
  validateBatchDeletePollsInput,
} from '@/middleware/poll.validators';
import {
  createPollHandler,
  deletePollHandler,
  batchDeletePollsHandler,
} from '@/controllers/poll.controller';

const router = express.Router({ mergeParams: true });

router
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
