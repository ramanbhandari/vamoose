import { Request, Response } from 'express';
import { createPoll } from '@/models/poll.model.js';
import { getTripMember } from '@/models/member.model.js';
import { AuthenticatedRequest } from '@/interfaces/interfaces.js';
import { handleControllerError } from '@/utils/errorHandlers.js';
import { DateTime } from 'luxon';

export const createPollHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const { question, expiresAt, options } = req.body;

    // Authorization check
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    // Check if the user is a member of the trip and fetch their role
    const requestingMember = await getTripMember(tripId, userId);
    if (!requestingMember) {
      res.status(403).json({
        error: `You are not a member of this trip: ${tripId}`,
      });
      return;
    }

    // Only creators and admins can create polls
    const allowedRoles = ['creator', 'admin'];
    if (!allowedRoles.includes(requestingMember.role)) {
      res.status(403).json({
        error: 'Only creators and admins can create polls',
      });
      return;
    }

    // Parse expiration date with Luxon
    const expiresAtUtc = DateTime.fromISO(expiresAt).toUTC();

    // Create the poll
    const poll = await createPoll({
      tripId,
      question,
      expiresAt: expiresAtUtc.toJSDate(),
      createdById: userId,
      options,
    });

    res.status(201).json({ message: 'Poll created successfully', poll });
  } catch (error) {
    handleControllerError(error, res, 'Error creating poll:');
  }
};
