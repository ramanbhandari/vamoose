import express from 'express';
import tripRouter from './trip.routes.ts';
import expenseRouter from './expense.routes.ts';
import inviteRouter from './invitee.routes.ts';
import memberRouter from './member.routes.ts';
import { authMiddleware } from '../middleware/authMiddleware.ts';

const router = express.Router();

// Apply authMiddleware globally to all routes
// router.use(authMiddleware);

router.use('/trips', tripRouter);
router.use('/trips/:tripId/expenses', expenseRouter);
router.use('/trips/:tripId/invites', inviteRouter);
router.use('/trips/:tripId/members', memberRouter);

export default router;
