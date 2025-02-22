import express from 'express';
import tripRouter from './trip.routes.ts';
import expenseRouter from './expense.routes.ts';
import inviteRouter from './invitee.routes.ts';

const router = express.Router();

router.use('/trips', tripRouter);
router.use('/trips/:tripId/expenses', expenseRouter);
router.use('/trips/:tripId/invites', inviteRouter);

export default router;
