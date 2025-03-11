import { Request, Response } from 'express';
import {
  assignUsersToItineraryEvent,
  getAssignedUsersForEvent,
  unassignUserFromItineraryEvent,
} from '@/models/itineraryEventAssignment.model.js';
import {
  getTripMember,
  getManyTripMembersFilteredByUserId,
} from '@/models/member.model.js';
import { AuthenticatedRequest } from '@/interfaces/interfaces.js';
import { handleControllerError } from '@/utils/errorHandlers.js';
import { fetchSingleItineraryEvent } from '@/models/itineraryEvent.model';

export const assignUsersToItineraryEventHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const eventId = Number(req.params.eventId);
    const { userIds } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (isNaN(eventId)) {
      res.status(400).json({ error: 'Invalid event ID' });
      return;
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ error: 'Invalid user IDs' });
      return;
    }

    const requestingMember = await getTripMember(tripId, userId);
    if (!requestingMember) {
      res.status(403).json({ error: 'You are not a member of this trip' });
      return;
    }

    const event = await fetchSingleItineraryEvent(tripId, eventId);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const isEventCreator = event.createdById === userId;
    const isTripAdmin =
      requestingMember.role === 'creator' || requestingMember.role === 'admin';

    if (!isEventCreator && !isTripAdmin) {
      res
        .status(403)
        .json({ error: 'Only the creator or an admin can assign users.' });
      return;
    }

    const tripMembers = await getManyTripMembersFilteredByUserId(
      tripId,
      userIds,
    );
    const validTripMemberIds = new Set(
      tripMembers.map((member) => member.userId),
    );

    const nonMemberIds = userIds.filter((id) => !validTripMemberIds.has(id));

    if (validTripMemberIds.size === 0) {
      res.status(400).json({
        error: 'None of the provided users are members of this trip.',
      });
      return;
    }

    const assignedUsers = await getAssignedUsersForEvent(eventId);
    const assignedUserIds = new Set(assignedUsers.map((user) => user.userId));

    const usersToAssign = [...validTripMemberIds].filter(
      (id) => !assignedUserIds.has(id),
    );
    const alreadyAssignedIds = [...validTripMemberIds].filter((id) =>
      assignedUserIds.has(id),
    );

    if (usersToAssign.length === 0) {
      res.status(400).json({
        error: 'All provided users are already assigned to this event.',
      });
      return;
    }

    await assignUsersToItineraryEvent(eventId, usersToAssign);

    res.status(200).json({
      message: 'Users assigned successfully',
      assignedUsers: usersToAssign,
      ignoredUsers:
        alreadyAssignedIds.length > 0 ? alreadyAssignedIds : undefined,
      nonMembers: nonMemberIds.length > 0 ? nonMemberIds : undefined,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error assigning users to event:');
  }
};

export const unassignUserFromItineraryEventHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const eventId = Number(req.params.eventId);
    const { userIds } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (isNaN(eventId)) {
      res.status(400).json({ error: 'Invalid event ID' });
      return;
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ error: 'Invalid user IDs' });
      return;
    }

    const requestingMember = await getTripMember(tripId, userId);
    if (!requestingMember) {
      res.status(403).json({ error: 'You are not a member of this trip' });
      return;
    }

    const event = await fetchSingleItineraryEvent(tripId, eventId);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const isEventCreator = event.createdById === userId;
    const isTripAdmin =
      requestingMember.role === 'creator' || requestingMember.role === 'admin';

    if (!isEventCreator && !isTripAdmin) {
      res
        .status(403)
        .json({ error: 'Only the creator or an admin can unassign users.' });
      return;
    }

    const assignedUsers = await getAssignedUsersForEvent(eventId);
    const assignedUserIds = assignedUsers.map((user) => user.userId);

    const validUserIds = userIds.filter((id) => assignedUserIds.includes(id));
    const invalidUserIds = userIds.filter(
      (id) => !assignedUserIds.includes(id),
    );

    if (validUserIds.length === 0) {
      res.status(400).json({
        error: 'None of the provided users are assigned to this event.',
      });
      return;
    }

    await unassignUserFromItineraryEvent(eventId, validUserIds);

    res.status(200).json({
      message: 'Users unassigned successfully',
      unassignedUsers: validUserIds,
      ignoredUsers: invalidUserIds.length > 0 ? invalidUserIds : undefined,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error unassigning users from event:');
  }
};
