/**
 * @file appRouter.ts
 * @description Main router configuration that combines all sub-routes.
 * Handles authentication middleware and organizes routes into trip-specific and non-trip-specific categories.
 */

import express from 'express';
import tripRouter from '@/routes/trip.routes.js';
import expenseRouter from '@/routes/expense.routes.js';
import expenseShareRouter from '@/routes/expenseShare.routes.js';
import inviteRouter, { nonAuthInviteRouter } from '@/routes/invitee.routes.js';
import memberRouter from '@/routes/member.routes.js';
import messageRouter from '@/routes/message.routes.js';
import pollRouter from '@/routes/poll.routes.js';
import itineraryEventRouter from '@/routes/itineraryEvent.routes.js';
import notificationRouter from '@/routes/notification.routes.js';
import markedLocationRouter from '@/routes/markedLocation.routes.js';
import { authMiddleware } from '@/middlewares/authMiddleware.js';

const router = express.Router();

//Non-Auth routes

// TODO: Find a better way to pass global auth
router.use('/trips/invites', nonAuthInviteRouter);

// Apply authMiddleware globally to all routes
router.use(authMiddleware);

// Non-trip-specific routes
router.use('/notifications', notificationRouter);

// Trip-specific routes
router.use('/trips', tripRouter);
router.use('/trips/:tripId/expenses', expenseRouter);
router.use('/trips/:tripId/expenseShares', expenseShareRouter);
router.use('/trips/:tripId/invites', inviteRouter);
router.use('/trips/:tripId/members', memberRouter);
router.use('/trips/:tripId/messages', messageRouter);
router.use('/trips/:tripId/polls', pollRouter);
router.use('/trips/:tripId/itinerary-events', itineraryEventRouter);
router.use('/trips/:tripId/marked-locations', markedLocationRouter);

export default router;
