import express from 'express';
import tripRouter from './trip.routes.ts';
import expenseRouter from './expense.routes.ts';
import inviteRouter from './invitee.routes.ts';
import memberRouter from './member.routes.ts';

const router = express.Router();

router.use('/trips', tripRouter);
router.use('/trips/:tripId/expenses', expenseRouter);
router.use('/trips/:tripId/invites', inviteRouter);
router.use('/trips/:tripId/members', memberRouter);

export default router;
