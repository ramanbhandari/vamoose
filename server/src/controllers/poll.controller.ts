import { Request, Response } from 'express';
import { getTripMember } from '@/models/member.model.js';
import {
  createPoll,
  deletePoll,
  getPollById,
  deletePollsByIds,
  getAllPollsForTrip,
  markPollAsCompleted,
} from '@/models/poll.model.js';
import { NotificationType, PollStatus } from '@/daos/enums.js';
import { AuthenticatedRequest } from '@/daos/interfaces.js';
import { handleControllerError } from '@/utils/errorHandlers.js';
import { DateTime } from 'luxon';
import { notifyTripMembersExceptInitiator } from '@/utils/notificationHandlers.js';
import { fetchSingleTrip } from '@/models/trip.model.js';

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

    // send notification to everyone except creator of the Poll
    const trip = await fetchSingleTrip(userId, tripId);
    await notifyTripMembersExceptInitiator(tripId, userId, {
      type: NotificationType.POLL_CREATED,
      relatedId: poll.id,
      title: `New Poll in trip "${trip.name}"`,
      message: `A new poll was created by ${requestingMember.user.fullName}.`,
      channel: 'IN_APP',
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

export const getAllPollsForTripHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    // Check if the user is a member of the trip
    const isMember = await getTripMember(tripId, userId);
    if (!isMember) {
      res.status(403).json({
        error: `You are not a member of this trip: ${tripId}`,
      });
      return;
    }

    // Fetch polls from the model
    const polls = await getAllPollsForTrip(tripId);

    const formattedPolls = polls.map((poll) => {
      const totalVotes = poll.options.reduce(
        (acc, option) => acc + option.votes.length,
        0,
      );

      const options = poll.options.map((option) => {
        const voteCount = option.votes.length;
        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

        return {
          id: option.id,
          option: option.option,
          voteCount,
          percentage: parseFloat(percentage.toFixed(2)),
          voters: option.votes.map((vote) => vote.user),
        };
      });

      // Determine if the poll resulted in a tie
      let winner = null;
      if (poll.status === PollStatus.COMPLETED && poll.winner) {
        const winningOption = options.find((o) => o.id === poll.winner?.id);
        winner = winningOption
          ? {
              id: poll.winner.id,
              option: poll.winner.option,
              voteCount: winningOption.voteCount,
            }
          : null;
      } else if (poll.status === PollStatus.TIE) {
        const maxVotes = Math.max(...options.map((option) => option.voteCount));
        winner = {
          options: options
            .filter((option) => option.voteCount === maxVotes)
            .map((option) => ({
              id: option.id,
              option: option.option,
              voteCount: option.voteCount,
            })),
        };
      }

      return {
        id: poll.id,
        question: poll.question,
        status: poll.status,
        expiresAt: poll.expiresAt,
        createdAt: poll.createdAt,
        completedAt: poll.completedAt,
        createdBy: poll.createdBy,
        options,
        totalVotes,
        winner,
      };
    });

    res.status(200).json({ polls: formattedPolls });
  } catch (error) {
    handleControllerError(error, res, 'Error fetching polls for trip:');
  }
};

export const completePollHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const pollId = Number(req.params.pollId);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (isNaN(pollId)) {
      res.status(400).json({ error: 'Invalid poll ID' });
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

    // Fetch the poll with its options and votes
    const poll = await getPollById(pollId);

    if (!poll || poll.tripId !== tripId) {
      res.status(404).json({ error: 'Poll not found in this trip' });
      return;
    }

    const isPollCreator = poll.createdById === userId;
    const isTripCreator = requestingMember.role === 'creator';
    const isAdmin = requestingMember.role === 'admin';

    // Authorization: Only the poll creator, an admin, or the trip creator can complete the poll
    if (!isPollCreator && !isTripCreator && !isAdmin) {
      res.status(403).json({
        error:
          'Only the poll creator, an admin, or the trip creator can complete this poll',
      });
      return;
    }

    // Determine the winning option or if there is a tie
    const options = poll.options.map((option) => ({
      id: option.id,
      option: option.option,
      voteCount: option.votes.length,
    }));

    const maxVotes = Math.max(...options.map((o) => o.voteCount));
    const topOptions = options.filter((o) => o.voteCount === maxVotes);

    let status: PollStatus = PollStatus.COMPLETED;
    let winnerId: number | null = null;
    let tiedOptions: { id: number; option: string; voteCount: number }[] = [];

    if (topOptions.length > 1) {
      status = PollStatus.TIE;
      tiedOptions = topOptions;
    } else if (topOptions.length === 1) {
      winnerId = topOptions[0].id;
    }

    // Update the poll status and winner
    const updatedPoll = await markPollAsCompleted(pollId, status, winnerId);

    await notifyTripMembersExceptInitiator(tripId, userId, {
      type: NotificationType.POLL_COMPLETE,
      relatedId: poll.id,
      title: 'Poll Completed',
      message:
        status === PollStatus.TIE
          ? `Poll "${poll.question}" ended in a tie among the top options: ${tiedOptions.map((opt) => opt.option).join(', ')}.`
          : `Poll "${poll.question}" has been completed. The winning option is "${poll.options.find((option) => option.id === winnerId)?.option}".`,
      channel: 'IN_APP',
    });

    res.status(200).json({
      message: 'Poll marked as completed successfully',
      poll: updatedPoll,
      status,
      winnerId,
      tiedOptions,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error marking polls as completed:');
  }
};
