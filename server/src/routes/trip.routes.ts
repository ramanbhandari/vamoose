import express from 'express';
import validationErrorHandler from '../middleware/validationErrorHandler.ts';
import {
  validateCreateTripInput,
  validateDeleteTripInput,
  validateUpdateTripInput,
  validateFetchSingleTrip,
  validateFetchTripsWithFilters,
  validateDeleteMultipleTripsInput,
} from '../middleware/trip.validators.ts';

import {
  createTripHandler,
  deleteTripHandler,
  deleteMultipleTripsHandler,
  updateTripHandler,
  fetchSingleTripHandler,
  fetchTripsWithFiltersHandler,
} from '../controllers/trip.controller.ts';

const router = express.Router();

// Trip CRUD routes
router
  .get(
    '/:tripId',
    validateFetchSingleTrip,
    validationErrorHandler,
    fetchSingleTripHandler,
  )
  .get(
    '/',
    validateFetchTripsWithFilters,
    validationErrorHandler,
    fetchTripsWithFiltersHandler,
  )
  .post('/', validateCreateTripInput, validationErrorHandler, createTripHandler)
  .patch(
    '/:tripId',
    validateUpdateTripInput,
    validationErrorHandler,
    updateTripHandler,
  )
  .delete(
    '/:tripId',
    validateDeleteTripInput,
    validationErrorHandler,
    deleteTripHandler,
  )
  .delete(
    '/',
    validateDeleteMultipleTripsInput,
    validationErrorHandler,
    deleteMultipleTripsHandler,
  );

export default router;
