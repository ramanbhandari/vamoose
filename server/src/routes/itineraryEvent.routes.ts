import express from 'express';
import validationErrorHandler from '@/middleware/validationErrorHandler.js';
import {
  validateCreateItineraryEventInput,
  validateUpdateItineraryEventInput,
} from '@/middleware/itineraryEvent.validators.js';
import {
  createItineraryEventHandler,
  updateItineraryEventHandler,
} from '@/controllers/itineraryEvent.controller.js';

const router = express.Router({ mergeParams: true });

router.post(
  '/',
  validateCreateItineraryEventInput,
  validationErrorHandler,
  createItineraryEventHandler,
);

router.patch(
  '/:eventId',
  validateUpdateItineraryEventInput,
  validationErrorHandler,
  updateItineraryEventHandler,
);

export default router;
