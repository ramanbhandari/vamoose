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

interface RoleHierarchy {
  [key: string]: number;
}

// Role hierarchy levels
const ROLE_HIERARCHY: RoleHierarchy = {
  creator: 3,
  admin: 2,
  member: 1,
};

/**
 * Update just trip member role for now until some other fields are added.
 * - The trip **creator** can change any member’s role.
 * - An **admin** can only update a **member's** role (not other admins or the creator).
 */

export const updateTripMemberHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const targetUserId = req.params.userId;
    const { role: newRole }: { role: 'admin' | 'member' } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized Request' });
    }

    if (isNaN(tripId)) {
      return res.status(400).json({ error: 'Invalid trip ID' });
    }

    if (!newRole || !['admin', 'member'].includes(newRole)) {
      return res.status(400).json({ error: 'Invalid role update request' });
    }

    // Fetch both the requesting member and the target member in parallel
    const [requestingMember, targetMember] = await Promise.all([
      getTripMember(tripId, userId),
      getTripMember(tripId, targetUserId),
    ]);

    if (!requestingMember) {
      return res
        .status(403)
        .json({ error: 'You are not a member of this trip' });
    }

    if (!targetMember) {
      return res
        .status(404)
        .json({ error: 'Target member not found in this trip' });
    }

    // Skip update if the role is not actually changing
    if (targetMember.role === newRole) {
      return res
        .status(200)
        .json({ message: 'No changes made. Role is already set.' });
    }

    // Prevent users from updating their own role
    if (userId === targetUserId) {
      return res.status(403).json({ error: 'You cannot update your own role' });
    }

    // Get role levels
    const requesterLevel = ROLE_HIERARCHY[requestingMember.role] ?? 0;
    const targetLevel = ROLE_HIERARCHY[targetMember.role] ?? 0;
    const newRoleLevel = ROLE_HIERARCHY[newRole] ?? 0;

    // Prevent modifying an equal or higher role
    if (requesterLevel <= targetLevel) {
      return res.status(403).json({
        error: 'You cannot update someone with an equal or higher role',
      });
    }

    // Prevent promoting someone beyond the requester's level
    if (newRoleLevel > requesterLevel) {
      return res.status(403).json({
        error: 'You cannot promote someone to a role higher than your own',
      });
    }

    // Ensure only the creator can promote members to admin
    if (newRole === 'admin' && requestingMember.role !== 'creator') {
      return res
        .status(403)
        .json({ error: 'Only the creator can promote members to admin' });
    }

    // Perform the update
    const updatedMember = await updateTripMember(tripId, targetUserId, {
      role: newRole,
    });

    res.status(200).json({
      message: 'Member role updated successfully',
      member: updatedMember,
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
  } catch (error) {
    handleControllerError(error, res, 'Error removing trip members:');
  }
};
