import express from 'express';
import tripRouter from './trip.routes.ts';
import expenseRouter from './expense.routes.ts';
import inviteRouter, { nonAuthInviteRouter } from './invitee.routes.ts';
import memberRouter from './member.routes.ts';
import { authMiddleware } from '../middleware/authMiddleware.ts';

const router = express.Router();

//Non-Auth routes
router.use('/trips/invites', nonAuthInviteRouter);

// Apply authMiddleware globally to all routes
router.use(authMiddleware);

router.use('/trips', tripRouter);
router.use('/trips/:tripId/expenses', expenseRouter);
router.use('/trips/:tripId/invites', inviteRouter);
router.use('/trips/:tripId/members', memberRouter);

export default router;
