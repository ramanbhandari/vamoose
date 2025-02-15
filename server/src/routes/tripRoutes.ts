import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.ts';
import { validateCreateTrip, validateDeleteTrip, validateUpdateTrip } from '../middleware/validators.ts';

import {
  createTripHandler,
  deleteTripHandler,
  deleteMultipleTripsHandler,
  updateTripHandler,
} from '../controllers/tripController.ts';

const router = express.Router();

router.post('/', authMiddleware(validateCreateTrip), createTripHandler)
  .patch('/:tripId', authMiddleware(validateUpdateTrip), updateTripHandler)
  .delete('/:tripId', authMiddleware(validateDeleteTrip), deleteTripHandler)
  .delete('/', authMiddleware(validateDeleteTrip), deleteMultipleTripsHandler);

export default router;
