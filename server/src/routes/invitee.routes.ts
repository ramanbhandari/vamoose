import express from 'express';
import {
  createInvite,
  deleteInvite,
  validateInvite,
  acceptInvite,
  rejectInvite,
} from '../controllers/invitee.controller.ts';

import { authMiddleware } from '../middleware/authMiddleware.ts';
import {
  validateCreateInviteInput,
  validateInviteParams,
} from '../middleware/invitee.validators.ts';
import validationErrorHandler from '../middleware/validationErrorHandler.ts';

const router = express.Router({ mergeParams: true });

router.post(
  '/create',
  validateCreateInviteInput,
  validationErrorHandler,
  authMiddleware,
  createInvite,
);
router.get(
  '/validate/:token',
  validateInviteParams,
  validationErrorHandler,
  authMiddleware,
  validateInvite,
);
router.post(
  '/accept/:token',
  validateInviteParams,
  validationErrorHandler,
  authMiddleware,
  acceptInvite,
);
router.post(
  '/reject/:token',
  validateInviteParams,
  validationErrorHandler,
  authMiddleware,
  rejectInvite,
);
router.delete(
  '/delete/:token',
  validateInviteParams,
  validationErrorHandler,
  authMiddleware,
  deleteInvite,
);

export default router;
