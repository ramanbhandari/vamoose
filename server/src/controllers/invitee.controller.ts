import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/daos/interfaces.js';
import TripInvite from '@/models/invitee.model.js';
import { getUserByEmail, getUserById } from '@/models/user.model.js';
import { addTripMember, getTripMember } from '@/models/member.model.js';
import { fetchSingleTrip } from '@/models/trip.model.js';
import { handleControllerError } from '@/utils/errorHandlers.js';
import {
  notifyIndividual,
  notifyTripAdmins,
  notifyTripMembersExceptInitiator,
} from '@/utils/notificationHandlers.js';
import { NotificationType } from '@/daos/enums.js';
import prisma from '@/configs/prismaClient.js';

export const checkInvite = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Find the invite by token
    const invite = await TripInvite.getInviteByToken(token);

    if (!invite || invite.status !== 'pending') {
      res.status(400).json({ error: 'Invite not found' });
      return;
    }

    const user = await getUserById(invite.createdBy);

    const trip = await fetchSingleTrip('', invite.tripId, true);

    const inviteDetails = {
      inviter: user?.fullName || 'Full Name',
      invited: invite.email,
      destination: trip.destination,
      from: trip.startDate,
      to: trip.endDate,
    };

    res.status(200).json(inviteDetails);
  } catch (error) {
    handleControllerError(error, res, 'Error checking the invite:');
  }
};

export const createInvite = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      body: { email },
    } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (!email) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    const trip = await fetchSingleTrip(userId, tripId);

    if (!trip) {
      res.status(404).json({ error: 'Trip not found.' });
      return;
    }

    // Check if the user sending the invite is the trip creator/admin
    const isAdmin = trip.members.some(
      (member) =>
        member.userId === userId &&
        (member.role === 'creator' || member.role === 'admin'),
    );

    if (!isAdmin) {
      res.status(403).json({ error: 'Only admin can send invites.' });
      return;
    }

    const invitedUser = await getUserByEmail(email);

    //if invited user exists check if they are part of the trip already
    if (invitedUser) {
      // Check if the invitee is already a trip member
      const existingMember = await getTripMember(tripId, invitedUser.id);

      if (existingMember) {
        res
          .status(400)
          .json({ error: 'User is already a member of this trip.' });
        return;
      }
    }

    const existingInvite = await TripInvite.getExistingInvite(tripId, email);

    if (existingInvite) {
      if (existingInvite.status !== 'pending') {
        await TripInvite.updateInviteStatus(
          existingInvite.inviteToken,
          'pending',
        );
      }
      res.status(200).json({
        inviteUrl: `${process.env.FRONTEND_URL}/invite/${existingInvite.inviteToken}`,
      });
      return;
    }

    const inviteData = {
      tripId,
      email,
      createdBy: userId,
      ...(invitedUser && { invitedUserId: invitedUser.id }),
    };
    // Create invite
    const invite = await TripInvite.createTripInvite(inviteData);

    // Return invite URL
    res.status(201).json({
      inviteUrl: `${process.env.FRONTEND_URL}/invite/${invite.inviteToken}`,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error sending invite:');
  }
};

export const validateInvite = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      params: { token },
    } = req as AuthenticatedRequest;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    // Find the invite by token
    let invite = await TripInvite.getInviteByToken(token);

    if (!invite) {
      res.status(400).json({ error: 'Invite not found' });
      return;
    }

    const user = await getUserById(userId);

    // Ensure the logged-in user matches the invitee email
    if (invite.email !== user?.email) {
      res.status(403).json({
        error: `This invite is for ${invite.email}. Please log in with that email.`,
      });
      return;
    }

    //attach the user to the invite if not already attached
    if (!invite.invitedUserId) {
      invite = await TripInvite.updateInvitedUser(invite.inviteToken, userId);
    }

    const trip = await fetchSingleTrip(userId, invite.tripId, true);

    // Return trip details
    res.status(200).json({ trip });
  } catch (error) {
    handleControllerError(error, res, 'Error validating invite:');
  }
};

export const acceptInvite = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      params: { token },
    } = req as AuthenticatedRequest;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    // Find the invite by token
    const invite = await TripInvite.getInviteByToken(token);

    if (!invite) {
      res.status(400).json({ error: 'Invite not found' });
      return;
    }

    const user = await getUserById(userId);

    // Ensure email matches
    if (invite.email !== user?.email) {
      res.status(403).json({
        error: `This invite is for ${invite.email}. Please log in with that email.`,
      });
      return;
    }

    if (invite.status === 'accepted') {
      res.status(400).json({ error: 'Invite already accepted' });
      return;
    }

    await prisma.$transaction([
      // add user to trip
      addTripMember(invite.tripId, userId, 'member', true),

      // Update invite status to "accepted"
      TripInvite.updateInviteStatus(token, 'accepted', true),
    ]);

    // Notify other trip members
    if (user?.id) {
      await notifyTripMembersExceptInitiator(invite.tripId, user.id, {
        type: NotificationType.MEMBER_JOINED,
        relatedId: invite.tripId,
        title: 'New Trip Member',
        message: `${user?.fullName || 'A new member'} has joined the trip!`,
        channel: 'IN_APP',
      });

      // Notify the new member
      const trip = await fetchSingleTrip(userId, invite.tripId);
      await notifyIndividual(userId, invite.tripId, {
        type: NotificationType.MEMBER_JOINED,
        relatedId: invite.tripId,
        title: 'Welcome to the Trip!',
        message: `You have successfully joined trip "${trip.name}". Start planning with your trip members!`,
        channel: 'IN_APP',
      });
    }

    res.status(200).json({ message: 'Invite accepted' });
  } catch (error) {
    handleControllerError(error, res, 'Error accepting invite:');
  }
};

export const rejectInvite = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      params: { token },
    } = req as AuthenticatedRequest;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    // Find the invite by token
    const invite = await TripInvite.getInviteByToken(token);

    if (!invite) {
      res.status(400).json({ error: 'Invite not found' });
      return;
    }

    const user = await getUserById(userId);

    // Ensure email matches
    if (invite.email !== user?.email) {
      res.status(403).json({
        error: `This invite is for ${invite.email}. Please log in with that email.`,
      });
      return;
    }

    if (invite.status !== 'pending') {
      res.status(400).json({ error: 'Invite not pending' });
      return;
    }

    // Update invite status to "rejected"
    await TripInvite.updateInviteStatus(invite.inviteToken, 'rejected');

    // Notify trip creator and admins
    await notifyTripAdmins(invite.tripId, {
      type: NotificationType.INVITE_REJECTED,
      relatedId: invite.tripId,
      title: 'Invitation Rejected',
      message: `${user?.fullName || 'An invitee'} has rejected the trip invitation.`,
      channel: 'IN_APP',
    });

    res.status(200).json({ message: 'Invite rejected.' });
  } catch (error) {
    handleControllerError(error, res, 'Error rejecting invite:');
  }
};

export const deleteInvite = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      params: { token },
    } = req as AuthenticatedRequest;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    // Find the invite
    const invite = await TripInvite.getInviteByToken(token);

    if (!invite) {
      res.status(400).json({ error: 'Invite not found' });
      return;
    }

    // to get the role of this user in the trip
    const tripMember = await getTripMember(invite.tripId, userId);

    // ensure the delete is called by the admin
    if (
      !tripMember ||
      !(tripMember.role === 'creator' || tripMember.role === 'admin')
    ) {
      res.status(403).json({ error: 'Only admin can delete invites.' });
      return;
    }

    if (invite.status === 'accepted') {
      res.status(400).json({ error: 'Invite already accepted' });
      return;
    }

    // Delete the invite
    await TripInvite.deleteInvite(token);

    res.status(200).json({ message: 'Invite deleted successfully' });
  } catch (error) {
    handleControllerError(error, res, 'Error deleting invite:');
  }
};
