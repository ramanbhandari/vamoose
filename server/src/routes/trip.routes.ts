import express from 'express';
import validationErrorHandler from '../middleware/validationErrorHandler.ts';
import { authMiddleware } from '../middleware/authMiddleware.ts';
import {
  validateCreateTripInput,
  validateDeleteTripInput,
  validateUpdateTripInput,
  validateFetchSingleTrip,
  validateFetchTripsWithFilters,
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

router
  // Trip CRUD routes
  .post(
    '/',
    validateCreateTripInput,
    validationErrorHandler,
    authMiddleware,
    createTripHandler,
  )
  .patch(
    '/:tripId',
    validateUpdateTripInput,
    validationErrorHandler,
    authMiddleware,
    updateTripHandler,
  )
  .delete(
    '/:tripId',
    validateDeleteTripInput,
    validationErrorHandler,
    authMiddleware,
    deleteTripHandler,
  )
  .delete(
    '/',
    validateDeleteTripInput,
    validationErrorHandler,
    authMiddleware,
    deleteMultipleTripsHandler,
  )
  .get(
    '/:tripId',
    validateFetchSingleTrip,
    validationErrorHandler,
    authMiddleware,
    fetchSingleTripHandler,
  )
  .get(
    '/',
    validateFetchTripsWithFilters,
    validationErrorHandler,
    authMiddleware,
    fetchTripsWithFiltersHandler,
  );

export default router;
