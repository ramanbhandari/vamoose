import express from 'express';
import validationErrorHandler from '@/middlewares/validationErrorHandler.js';
import {
  validateCreatePollInput,
  validateDeletePollInput,
  validateBatchDeletePollsInput,
  validateGetAllPollsForTripInput,
  validateCompletePollInput,
} from '@/middlewares/poll.validators.js';
import {
  validateCastVoteInput,
  validateDeleteVoteInput,
} from '@/middlewares/pollVote.validators.js';
import {
  createPollHandler,
  deletePollHandler,
  batchDeletePollsHandler,
  getAllPollsForTripHandler,
  completePollHandler,
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
    '/:pollId/complete',
    validateCompletePollInput,
    validationErrorHandler,
    completePollHandler,
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
