import { Request, Response } from 'express';
import { castVote, deleteVote } from '@/models/pollVote.model.js';
import { getTripMember } from '@/models/member.model.js';
import { getPollById } from '@/models/poll.model.js';
import { getPollOptionById } from '@/models/pollOption.model.js';
import { AuthenticatedRequest } from '@/daos/interfaces.js';
import { handleControllerError } from '@/utils/errorHandlers.js';
import { PollStatus } from '@/daos/enums.js';
import { DateTime } from 'luxon';

export const castVoteHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const pollId = Number(req.params.pollId);
    const { pollOptionId } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    // Check if user is a member of the trip
    const isMember = await getTripMember(tripId, userId);
    if (!isMember) {
      res.status(403).json({ error: 'You are not a member of this trip' });
      return;
    }

    // Check if poll is active and not expired
    const poll = await getPollById(pollId);
    if (!poll || poll.tripId !== tripId) {
      res.status(404).json({ error: 'Poll not found in this trip' });
      return;
    }

    if (poll.status !== PollStatus.ACTIVE) {
      res.status(403).json({ error: 'You cannot vote on a completed poll' });
      return;
    }

    const now = DateTime.now().toUTC();
    const expiresAt = DateTime.fromJSDate(poll.expiresAt).toUTC();

    if (expiresAt <= now) {
      res
        .status(403)
        .json({ error: 'Poll has expired and cannot accept votes' });
      return;
    }

    // Validate that the poll option belongs to the poll
    const pollOption = await getPollOptionById(pollOptionId);
    if (!pollOption || pollOption.pollId !== pollId) {
      res.status(400).json({
        error:
          'Invalid poll option. Please select a valid option for this poll.',
      });
      return;
    }

    // Cast the vote
    const vote = await castVote({ pollId, pollOptionId, userId });
    res.status(201).json({ message: 'Vote cast successfully', vote });
  } catch (error) {
    handleControllerError(error, res, 'Error casting vote:');
  }
};

export const deleteVoteHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const pollId = Number(req.params.pollId);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    // Check if user is a member of the trip
    const isMember = await getTripMember(tripId, userId);
    if (!isMember) {
      res.status(403).json({ error: 'You are not a member of this trip' });
      return;
    }

    // Check if the poll exists and is active
    const poll = await getPollById(pollId);
    if (!poll || poll.tripId !== tripId) {
      res.status(404).json({ error: 'Poll not found in this trip' });
      return;
    }

    if (poll.status !== PollStatus.ACTIVE) {
      res
        .status(403)
        .json({ error: 'You cannot delete a vote from a completed poll' });
      return;
    }

    const now = DateTime.now().toUTC();
    const expiresAt = DateTime.fromJSDate(poll.expiresAt).toUTC();

    if (expiresAt <= now) {
      res
        .status(403)
        .json({ error: 'Poll has expired and votes cannot be deleted' });
      return;
    }

    // Delete the vote using pollId and userId
    const deletedVote = await deleteVote({ pollId, userId });

    if (!deletedVote) {
      res.status(404).json({ error: 'Vote not found or already deleted' });
      return;
    }

    res.status(200).json({ message: 'Vote deleted successfully', deletedVote });
  } catch (error) {
    handleControllerError(error, res, 'Error deleting vote:');
  }
};
