import express from 'express';
import { createTripHandler, deleteTripHandler, deleteMultipleTripsHandler } from '../controllers/tripController.ts';

const router = express.Router();

router.post('/', createTripHandler);
router.delete('/:tripId', deleteTripHandler);
router.delete("/", deleteMultipleTripsHandler);

export default router;
