import express from 'express';
import {
  createTripHandler,
  deleteTripHandler,
  deleteMultipleTripsHandler,
  updateTripHandler,
  fetchTripHandler,
} from '../controllers/tripController.ts';

const router = express.Router();

router.post('/', createTripHandler);
router.get('/:tripId', fetchTripHandler);
router.patch('/:tripId', updateTripHandler);
router.delete('/:tripId', deleteTripHandler);
router.delete('/', deleteMultipleTripsHandler);

export default router;
