import express from 'express';
import validationErrorHandler from '../middleware/validationErrorHandler.ts';
import { authMiddleware } from '../middleware/authMiddleware.ts';
import {
  validateUpdateTripMemberInput,
  validateFetchSingleTripMember,
  validateFetchTripMembers,
} from '../middleware/member.validators.ts';
import {
  updateTripMemberHandler,
  getTripMemberHandler,
  getTripMembersHandler,
} from '../controllers/member.controller.ts';

const router = express.Router({ mergeParams: true });

router
  .get(
    '/',
    validateFetchTripMembers,
    validationErrorHandler,
    authMiddleware,
    getTripMembersHandler,
  )
  .get(
    '/:userId',
    validateFetchSingleTripMember,
    validationErrorHandler,
    authMiddleware,
    getTripMemberHandler,
  )
  .patch(
    '/:userId',
    validateUpdateTripMemberInput,
    validationErrorHandler,
    authMiddleware,
    updateTripMemberHandler,
  );

export default router;
