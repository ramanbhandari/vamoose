import { Request, Response } from 'express';
import { createPoll } from '@/models/poll.model.js';
import { getTripMember } from '@/models/member.model.js';
import {
  deletePoll,
  getPollById,
  deletePollsByIds,
} from '@/models/poll.model.js';
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

export const deletePollHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const pollId = Number(req.params.pollId);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId) || isNaN(pollId)) {
      res
        .status(400)
        .json({ error: 'Trip ID and Poll ID must be valid numbers' });
      return;
    }

    // Check if the user is a member of the trip
    const requestingMember = await getTripMember(tripId, userId);
    if (!requestingMember) {
      res.status(403).json({
        error: `You are not a member of this trip: ${tripId}`,
      });
      return;
    }

    // Fetch the poll to check for permissions
    const poll = await getPollById(pollId);
    if (!poll || poll.tripId !== tripId) {
      res.status(404).json({ error: 'Poll not found in this trip' });
      return;
    }

    // Permission check: Only creator, admin, or trip creator can delete
    const isPollCreator = poll.createdById === userId;
    const isTripCreator = requestingMember.role === 'creator';
    const isAdmin = requestingMember.role === 'admin';

    if (!isPollCreator && !isTripCreator && !isAdmin) {
      res.status(403).json({
        error:
          'Only the poll creator, an admin, or the trip creator can delete this poll',
      });
      return;
    }

    // Delete the poll
    const result = await deletePoll(pollId);
    res
      .status(200)
      .json({ message: 'Poll deleted successfully', deletedPoll: result });
  } catch (error) {
    handleControllerError(error, res, 'Error deleting poll:');
  }
};

export const batchDeletePollsHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const { pollIds } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (!Array.isArray(pollIds) || pollIds.length === 0) {
      res.status(400).json({ error: 'Invalid poll IDs' });
      return;
    }

    // Check if the user is a member of the trip
    const requestingMember = await getTripMember(tripId, userId);
    if (!requestingMember) {
      res
        .status(403)
        .json({ error: `You are not a member of this trip: ${tripId}` });
      return;
    }

    // Only admins, creators, or poll creators can delete polls
    const isAdmin = requestingMember.role === 'admin';
    const isCreator = requestingMember.role === 'creator';

    const deletedCount = await deletePollsByIds(tripId, pollIds, {
      isAdmin,
      isCreator,
      userId,
    });

    if (deletedCount === 0) {
      res.status(404).json({
        error: 'No valid polls found to delete, or you are not authorized',
      });
      return;
    }

    res.status(200).json({
      message: 'Polls deleted successfully',
      deletedCount,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error deleting polls:');
  }
};
