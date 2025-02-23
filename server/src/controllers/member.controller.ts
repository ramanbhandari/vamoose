import { Request, Response } from 'express';
import {
  updateTripMember,
  getTripMember,
  getAllTripMembers,
} from '../models/member.model.ts';
import { AuthenticatedRequest } from '../interfaces/interfaces.ts';
import { handleControllerError } from '../utils/errorHandlers.ts';

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
