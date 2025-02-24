import express from 'express';
import {
  createInvite,
  deleteInvite,
  validateInvite,
  acceptInvite,
  rejectInvite,
} from '../controllers/invitee.controller.ts';
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
  createInvite,
);
router.get(
  '/validate/:token',
  validateInviteParams,
  validationErrorHandler,
  validateInvite,
);
router.post(
  '/accept/:token',
  validateInviteParams,
  validationErrorHandler,
  acceptInvite,
);
router.post(
  '/reject/:token',
  validateInviteParams,
  validationErrorHandler,
  rejectInvite,
);
router.delete(
  '/delete/:token',
  validateInviteParams,
  validationErrorHandler,
  deleteInvite,
);

export default router;
