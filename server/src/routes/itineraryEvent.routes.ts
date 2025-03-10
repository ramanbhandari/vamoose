import express from 'express';
import validationErrorHandler from '@/middleware/validationErrorHandler.js';
import {
  validateCreateItineraryEventInput,
  validateGetAllItineraryEventsInput,
  validateGetSingleItineraryEventInput,
} from '@/middleware/itineraryEvent.validators.js';
import {
  createItineraryEventHandler,
  getItineraryEventByIdHandler,
  getAllItineraryEventsForTripHandler,
} from '@/controllers/itineraryEvent.controller.js';

const router = express.Router({ mergeParams: true });

router
  .post(
    '/',
    validateCreateItineraryEventInput,
    validationErrorHandler,
    createItineraryEventHandler,
  )
  .get(
    '/:eventId',
    validateGetSingleItineraryEventInput,
    validationErrorHandler,
    getItineraryEventByIdHandler,
  )
  .get(
    '/',
    validateGetAllItineraryEventsInput,
    validationErrorHandler,
    getAllItineraryEventsForTripHandler,
  );

export default router;
