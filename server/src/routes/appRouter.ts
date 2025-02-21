import express from 'express';
import tripRouter from './trip.routes.ts';
import expenseRouter from './expense.routes.ts';
import inviteRouter from './invite.routes.ts'

const router = express.Router();

router.use('/trips', tripRouter);
router.use('/trips/:tripId/expenses', expenseRouter);
router.use('/invite', inviteRouter);

export default router;
