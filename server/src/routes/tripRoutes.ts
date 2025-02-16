import express from 'express';
import validationErrorHandler from '../middleware/validationErrorHandler.ts';
import { authMiddleware } from '../middleware/authMiddleware.ts';
import {
  validateCreateTripInput,
  validateDeleteTripInput,
  validateUpdateTripInput,
} from '../middleware/validators.ts';

import {
  createTripHandler,
  deleteTripHandler,
  deleteMultipleTripsHandler,
  updateTripHandler,
} from '../controllers/tripController.ts';

const router = express.Router();

router
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
  );

export default router;
