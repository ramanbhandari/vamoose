import express from 'express';
import validationErrorHandler from '../middleware/validationErrorHandler.ts';
import { authMiddleware } from '../middleware/authMiddleware.ts';
import { validateUpdateTripMemberInput } from '../middleware/member.validators.ts';
import { updateTripMemberHandler } from '../controllers/member.controller.ts';

const router = express.Router({ mergeParams: true });

router
  //  Trip Expense CRUD routes
  .patch(
    '/:userId',
    validateUpdateTripMemberInput,
    validationErrorHandler,
    authMiddleware,
    updateTripMemberHandler,
  );

export default router;
