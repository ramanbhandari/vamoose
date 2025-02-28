import express from 'express';
import {
  createInvite,
  deleteInvite,
  validateInvite,
  acceptInvite,
  rejectInvite,
  checkInvite,
} from '@/controllers/invitee.controller.js';
import {
  validateCreateInviteInput,
  validateInviteParams,
} from '@/middleware/invitee.validators.js';
import validationErrorHandler from '@/middleware/validationErrorHandler.js';

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

export const nonAuthInviteRouter = express.Router({ mergeParams: true });
nonAuthInviteRouter.get('/check/:token', checkInvite);

export default router;
