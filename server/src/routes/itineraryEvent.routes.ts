import express from 'express';
import validationErrorHandler from '@/middleware/validationErrorHandler.js';
import { validateCreateItineraryEventInput } from '@/middleware/itineraryEvent.validators.js';
import { createItineraryEventHandler } from '@/controllers/itineraryEvent.controller.js';

const router = express.Router({ mergeParams: true });

router.get(
  '/',
  validateCreateItineraryEventInput,
  validationErrorHandler,
  createItineraryEventHandler,
);

export default router;
