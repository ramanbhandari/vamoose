import express from 'express';
import tripRouter from './trip.routes.ts';
import expenseRouter from './expense.routes.ts';

const router = express.Router();

router.use('/trips', tripRouter);
router.use('/trips/:tripId/:expenseId', expenseRouter);

export default router;
