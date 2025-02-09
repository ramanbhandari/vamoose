import express from 'express';
import { createTripHandler } from '../controllers/tripController.ts';

const router = express.Router();

router.post('/', createTripHandler);

export default router;
