import express from 'express';
import validationErrorHandler from '@/middleware/validationErrorHandler.js';
import { validateCreatePollInput } from '@/middleware/poll.validators';
import { createPollHandler } from '@/controllers/poll.controller';

const router = express.Router({ mergeParams: true });

router.post(
  '/',
  validateCreatePollInput,
  validationErrorHandler,
  createPollHandler,
);

export default router;
