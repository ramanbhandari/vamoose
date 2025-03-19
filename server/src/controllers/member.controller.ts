import { Request, Response } from 'express';
import {
  updateTripMember,
  getTripMember,
  getAllTripMembers,
  deleteTripMember,
  deleteManyTripMembers,
  getTripMemberCount,
  getManyTripMembersFilteredByUserId,
} from '@/models/member.model.js';
import { AuthenticatedRequest } from '@/interfaces/interfaces.js';
import { handleControllerError } from '@/utils/errorHandlers.js';
import {
  notifyIndividual,
  notifyIndividuals,
  notifyTripMembers,
  notifyTripMembersExceptInitiator,
} from '@/utils/notificationHandlers.js';
import { NotificationType } from '@/interfaces/enums.js';
import { fetchSingleTrip } from '@/models/trip.model.js';

/**
 * Update just trip member role for now until some other fields are added.
 * - The trip **creator** can change any member’s role.
 * - An **admin** can only update a **member's** role (not other admins or the creator).
 */
export const updateTripMemberHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const targetUserId = req.params.userId; // The user whose role is being updated
    const { role } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (!role || !['admin', 'member'].includes(role)) {
      res.status(400).json({ error: 'Invalid role update request' });
      return;
    }

    // Fetch the requester’s role
    const requestingMember = await getTripMember(tripId, userId);
    if (!requestingMember) {
      res.status(403).json({ error: 'You are not a member of this trip' });
      return;
    }

    // Fetch the target member
    const targetMember = await getTripMember(tripId, targetUserId);
    if (!targetMember) {
      res.status(404).json({ error: 'Target member not found in this trip' });
      return;
    }

    // Permission checks
    if (requestingMember.role === 'creator') {
      // The creator can update any role
    } else if (requestingMember.role === 'admin') {
      if (targetMember.role !== 'member') {
        res.status(403).json({ error: 'Admins can only update member roles' });
        return;
      }
    } else {
      res
        .status(403)
        .json({ error: 'Only admins and creators can update roles' });
      return;
    }

    // Perform update
    const updatedMember = await updateTripMember(tripId, targetUserId, {
      role,
    });

    res.status(200).json({
      message: `Member role updated successfully`,
      member: updatedMember,
    });

    // Notify the member whose role was changed
    const trip = await fetchSingleTrip(userId, tripId);

    await notifyIndividual(targetUserId, tripId, {
      type: NotificationType.MEMBER_ROLE_UPDATED,
      relatedId: tripId,
      title: 'Your Role Has Been Updated',
      message: `Your role in the trip "${trip.name}" has been changed to ${role}.`,
      channel: 'IN_APP',
    });
  } catch (error) {
    handleControllerError(error, res, 'Error updating trip member:');
  }
};

/**
 * Fetch a single trip member
 */
export const getTripMemberHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const memberUserId = req.params.userId; // ID of the member to fetch

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    const requestingMember = await getTripMember(tripId, userId);
    if (!requestingMember) {
      res.status(403).json({ error: 'You are not a member of this trip' });
      return;
    }

    const member = await getTripMember(tripId, memberUserId);

    if (!member) {
      res.status(404).json({ error: 'Trip member not found' });
      return;
    }

    res.status(200).json({ member });
    return;
  } catch (error) {
    handleControllerError(error, res, 'Error fetching trip member:');
  }
};

/**
 * Fetch all members of a trip
 */
export const getTripMembersHandler = async (req: Request, res: Response) => {
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

    const requestingMember = await getTripMember(tripId, userId);
    if (!requestingMember) {
      res.status(403).json({ error: 'You are not a member of this trip' });
      return;
    }

    const members = await getAllTripMembers(tripId);

    res.status(200).json({ members });
    return;
  } catch (error) {
    handleControllerError(error, res, 'Error fetching trip members:');
  }
};

/**
 * Allows a user to leave a trip.
 */
export const leaveTripHandler = async (req: Request, res: Response) => {
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

    // Fetch the user's role in the trip
    const member = await getTripMember(tripId, userId);
    if (!member) {
      res.status(404).json({ error: 'You are not a member of this trip' });
      return;
    }

    // Prevent the creator from leaving the trip
    if (member.role === 'creator') {
      res.status(403).json({
        error: 'Creators cannot leave a trip. Delete the trip instead.',
      });
      return;
    }

    // Proceed with removal
    await deleteTripMember(tripId, userId);

    res.status(200).json({ message: 'You have left the trip successfully' });

    // Notify the trip members that a member left
    const trip = await fetchSingleTrip(userId, tripId);
    await notifyTripMembers(tripId, {
      type: NotificationType.MEMBER_LEFT,
      relatedId: tripId,
      title: 'A Member Has Left the Trip',
      message: `${member.user.fullName} has left the trip "${trip.name}".`,
      channel: 'IN_APP',
    });
  } catch (error) {
    handleControllerError(error, res, 'Error leaving trip:');
  }
};

/**
 * Remove a member from a trip
 */
export const removeTripMemberHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const memberUserId = req.params.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (!memberUserId) {
      res.status(400).json({ error: 'Member user ID is required' });
      return;
    }

    // Fetch requester
    const requester = await getTripMember(tripId, userId);
    if (!requester) {
      res.status(403).json({ error: 'You are not a member of this trip' });
      return;
    }

    // Fetch target member
    const targetMember = await getTripMember(tripId, memberUserId);
    if (!targetMember) {
      res.status(404).json({ error: 'Member not found in this trip' });
      return;
    }

    // If user is trying to remove themselves, suggest leaving instead
    if (userId === memberUserId) {
      res.status(400).json({
        error:
          requester.role === 'creator'
            ? 'As the creator, you cannot leave the trip. You must delete it instead.'
            : 'Use the Leave Trip endpoint instead of removing yourself.',
      });
      return;
    }

    // Ensure only creator or admins can remove members
    if (requester.role !== 'creator' && requester.role !== 'admin') {
      res
        .status(403)
        .json({ error: 'Only the creator or an admin can remove members' });
      return;
    }

    // Ensure creator cannot be removed
    if (targetMember.role === 'creator') {
      res
        .status(403)
        .json({ error: 'The creator cannot be removed from the trip' });
      return;
    }

    // Ensure admins can only remove members
    if (requester.role === 'admin' && targetMember.role !== 'member') {
      res.status(403).json({ error: 'Admins can only remove regular members' });
      return;
    }

    // Ensure the trip always has at least the creator
    const remainingMembers = await getTripMemberCount(tripId);
    if (remainingMembers === 1) {
      res
        .status(403)
        .json({ error: 'You cannot remove the last member of the trip' });
      return;
    }

    // Proceed with removal
    await deleteTripMember(tripId, memberUserId);

    res.status(200).json({ message: 'Member removed successfully' });

    // Notify trip members that a member was kicked
    const trip = await fetchSingleTrip(userId, tripId);
    await notifyTripMembersExceptInitiator(tripId, userId, {
      type: NotificationType.MEMBER_REMOVED,
      relatedId: tripId,
      title: 'A Member Has Been Removed',
      message: `${targetMember.user.fullName} has been removed from the trip "${trip.name}".`,
      channel: 'IN_APP',
    });

    // Notify the kicked user
    await notifyIndividual(memberUserId, tripId, {
      type: NotificationType.MEMBER_REMOVED,
      relatedId: tripId,
      title: 'You Have Been Removed from the Trip',
      message: `You have been removed from the trip "${trip.name}" by an admin.`,
      channel: 'IN_APP',
    });
  } catch (error) {
    handleControllerError(error, res, 'Error removing trip member:');
  }
};

// remove multiple members from the trip
export const batchRemoveTripMembersHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const { memberUserIds } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (!Array.isArray(memberUserIds) || memberUserIds.length === 0) {
      res
        .status(400)
        .json({ error: 'memberUserIds must be a non-empty array' });
      return;
    }

    // Fetch requester
    const requester = await getTripMember(tripId, userId);
    if (!requester) {
      res.status(403).json({ error: 'You are not a member of this trip' });
      return;
    }

    // Check if requester is in the batch and suggest correct action
    if (memberUserIds.includes(userId)) {
      res.status(400).json({
        error:
          requester.role === 'creator'
            ? 'As the creator, you cannot leave the trip. You must delete it instead.'
            : 'Use the Leave Trip endpoint instead of removing yourself.',
      });
      return;
    }

    // Ensure only creator or admins can remove members
    if (requester.role !== 'creator' && requester.role !== 'admin') {
      res
        .status(403)
        .json({ error: 'Only the creator or an admin can remove members' });
      return;
    }

    // Fetch valid target members
    const targetMembers = await getManyTripMembersFilteredByUserId(
      tripId,
      memberUserIds,
    );

    // Separate valid and invalid members
    const validMemberIds = targetMembers.map((member) => member.userId);
    const ignoredMemberIds = memberUserIds.filter(
      (id) => !validMemberIds.includes(id),
    );

    // If no valid members to remove, return an error
    if (validMemberIds.length === 0) {
      res.status(404).json({
        error: 'No valid members found to remove from the trip',
        ignoredMembers: ignoredMemberIds,
      });
      return;
    }

    // Ensure the creator is not being removed
    const containsCreator = targetMembers.some(
      (member) => member.role === 'creator',
    );
    if (containsCreator) {
      res
        .status(403)
        .json({ error: 'The creator cannot be removed from the trip' });
      return;
    }

    // Ensure admins can only remove members
    if (requester.role === 'admin') {
      const hasNonMember = targetMembers.some(
        (member) => member.role !== 'member',
      );
      if (hasNonMember) {
        res
          .status(403)
          .json({ error: 'Admins can only remove regular members' });
        return;
      }
    }

    // Ensure the trip always has at least the creator
    const remainingMembers = await getTripMemberCount(tripId);
    if (remainingMembers - validMemberIds.length < 1) {
      res
        .status(403)
        .json({ error: 'You cannot remove the last member of the trip' });
      return;
    }

    // Proceed with removal for valid members only
    await deleteManyTripMembers(tripId, validMemberIds);

    res.status(200).json({
      message: 'Batch removal completed',
      removedMembers: validMemberIds,
      ignoredMembers: ignoredMemberIds,
    });

    // Notify trip members that some members were kicked
    const trip = await fetchSingleTrip(userId, tripId);
    await notifyTripMembers(tripId, {
      type: NotificationType.MEMBERS_REMOVED,
      relatedId: tripId,
      title: 'Members Have Been Removed',
      message: `Some members have been removed from the trip "${trip.name}".`,
      channel: 'IN_APP',
    });

    // Notify the kicked users
    await notifyIndividuals(validMemberIds, tripId, {
      type: NotificationType.MEMBERS_REMOVED,
      relatedId: tripId,
      title: 'You Have Been Removed from the Trip',
      message: `You have been removed from the trip "${trip.name}" by an admin.`,
      channel: 'IN_APP',
    });
  } catch (error) {
    handleControllerError(error, res, 'Error removing trip members:');
  }
};
