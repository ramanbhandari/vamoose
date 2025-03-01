import express from 'express';
import tripRouter from './trip.routes.js';
import expenseRouter from './expense.routes.js';
import inviteRouter, { nonAuthInviteRouter } from './invitee.routes.js';
import memberRouter from './member.routes.js';
import { authMiddleware } from '@/middleware/authMiddleware.js';

const router = express.Router();

//Non-Auth routes

// TODO: Find a better way to pass global auth
router.use('/trips/invites', nonAuthInviteRouter);

// Apply authMiddleware globally to all routes
router.use(authMiddleware);

router.use('/trips', tripRouter);
router.use('/trips/:tripId/expenses', expenseRouter);
router.use('/trips/:tripId/invites', inviteRouter);
router.use('/trips/:tripId/members', memberRouter);

export default router;
