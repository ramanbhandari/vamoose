import express from 'express';
import validationErrorHandler from '@/middleware/validationErrorHandler.js';
import {
  validateCreateTripInput,
  validateDeleteTripInput,
  validateUpdateTripInput,
  validateFetchSingleTrip,
  validateFetchTripsWithFilters,
  validateDeleteMultipleTripsInput,
} from '@/middleware/trip.validators.js';

import {
  createTripHandler,
  deleteTripHandler,
  deleteMultipleTripsHandler,
  updateTripHandler,
  fetchSingleTripHandler,
  fetchTripsWithFiltersHandler,
} from '@/controllers/trip.controller.js';

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
