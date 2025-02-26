import express from 'express';
import validationErrorHandler from '../middleware/validationErrorHandler.ts';
import {
  validateUpdateTripMemberInput,
  validateFetchSingleTripMember,
  validateFetchTripMembers,
  validateLeaveTripInput,
  validateRemoveTripMemberInput,
  validateBatchRemoveTripMembersInput,
} from '../middleware/member.validators.ts';
import {
  updateTripMemberHandler,
  getTripMemberHandler,
  getTripMembersHandler,
  leaveTripHandler,
  removeTripMemberHandler,
  batchRemoveTripMembersHandler,
} from '../controllers/member.controller.ts';

const router = express.Router({ mergeParams: true });

router
  .get(
    '/',
    validateFetchTripMembers,
    validationErrorHandler,
    getTripMembersHandler,
  )
  .get(
    '/:userId',
    validateFetchSingleTripMember,
    validationErrorHandler,
    getTripMemberHandler,
  )
  .patch(
    '/:userId',
    validateUpdateTripMemberInput,
    validationErrorHandler,
    updateTripMemberHandler,
  )
  .delete(
    '/leave',
    validateLeaveTripInput,
    validationErrorHandler,
    leaveTripHandler,
  )
  .delete(
    '/:userId',
    validateRemoveTripMemberInput,
    validationErrorHandler,
    removeTripMemberHandler,
  )
  .delete(
    '/',
    validateBatchRemoveTripMembersInput,
    validationErrorHandler,
    batchRemoveTripMembersHandler,
  );

export default router;
