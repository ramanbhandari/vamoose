import express from 'express';
import { createTripHandler, deleteTripHandler } from '../controllers/tripController.ts';

const router = express.Router();

router.post('/', createTripHandler);
router.delete('/:tripId', deleteTripHandler);

export default router;
