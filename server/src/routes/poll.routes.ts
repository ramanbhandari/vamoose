import express from 'express';
import validationErrorHandler from '@/middleware/validationErrorHandler.js';
import {
  validateCreatePollInput,
  validateDeletePollInput,
  validateBatchDeletePollsInput,
  validateGetAllPollsForTripInput,
  validateMarkPollsAsCompletedInput,
} from '@/middleware/poll.validators.js';
import {
  validateCastVoteInput,
  validateDeleteVoteInput,
} from '@/middleware/pollVote.validators.js';
import {
  createPollHandler,
  deletePollHandler,
  batchDeletePollsHandler,
  getAllPollsForTripHandler,
  markPollsAsCompletedHandler,
} from '@/controllers/poll.controller.js';
import {
  castVoteHandler,
  deleteVoteHandler,
} from '@/controllers/pollVote.controller.js';

const router = express.Router({ mergeParams: true });

router
  .get(
    '/',
    validateGetAllPollsForTripInput,
    validationErrorHandler,
    getAllPollsForTripHandler,
  )
  .post('/', validateCreatePollInput, validationErrorHandler, createPollHandler)
  .post(
    '/:pollId/vote',
    validateCastVoteInput,
    validationErrorHandler,
    castVoteHandler,
  )
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
    '/:pollId/vote',
    validateDeleteVoteInput,
    validationErrorHandler,
    deleteVoteHandler,
  )
  .delete(
    '/',
    validateBatchDeletePollsInput,
    validationErrorHandler,
    batchDeletePollsHandler,
  );

export default router;
