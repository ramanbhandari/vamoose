import express from 'express';
import { getTrips } from '../controllers/tripController.ts';

const router = express.Router();

router.get('/', getTrips);

export default router;
