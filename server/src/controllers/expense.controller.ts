import { Request, Response } from 'express';
import { addExpense } from '../models/expense.model';
import {
  getTripMember,
  getAllTripMembers,
  getManyTripMembersFilteredByUserId,
} from '../models/member.model.ts';
import { getUserByEmail, getUsersByEmails } from '../models/user.model.ts';
import { handleControllerError } from '../utils/errorHandlers.ts';
import { AuthenticatedRequest } from '../interfaces/interfaces';
import { ForbiddenError, NotFoundError } from '../utils/errors.ts';

/**
 * Add an expense to a trip
 */
export const addExpenseHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const {
      amount,
      category,
      description,
      paidByEmail,
      splitAmongEmails = [],
    } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (!amount || !category) {
      res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate that the user is a trip member
    const isMember = await getTripMember(tripId, userId);

    if (!isMember) {
      throw new ForbiddenError('You are not a member of this trip.');
    }

    // Convert `paidByEmail` to user ID
    let paidByUserId = userId; // Default to authenticated user
    if (paidByEmail) {
      const paidByUser = await getUserByEmail(paidByEmail);

      if (!paidByUser) {
        throw new NotFoundError('The user who paid is not found.');
      }

      // Ensure the paidBy user is a trip member
      const paidByMember = await getTripMember(tripId, paidByUser.id);

      if (!paidByMember) {
        throw new ForbiddenError(
          'The person who paid must be a member of the trip.',
        );
      }

      paidByUserId = paidByUser.id;
    }

    // Convert `splitAmongEmails` to user IDs
    let splitAmongUserIds: string[];

    if (splitAmongEmails.length === 0) {
      // If no specific splitAmong is provided, use all trip members
      const allMembers = await getAllTripMembers(tripId);

      splitAmongUserIds = allMembers.map((member) => member.userId);
    } else {
      // Fetch users from provided emails and validate existence
      const userRecords = await getUsersByEmails(splitAmongEmails);

      splitAmongUserIds = userRecords.map((user) => user.id);

      if (splitAmongUserIds.length !== splitAmongEmails.length) {
        throw new ForbiddenError(
          'Some provided emails are not associated with valid users.',
        );
      }

      // Validate that all split users are trip members
      const validTripMembers = await getManyTripMembersFilteredByUserId(
        tripId,
        splitAmongUserIds,
      );

      if (validTripMembers.length !== splitAmongUserIds.length) {
        throw new ForbiddenError(
          'Some provided emails included in the split are not members of this trip.',
        );
      }
    }

    // Create the expense
    const expense = await addExpense({
      tripId,
      amount,
      category,
      description,
      paidById: paidByUserId,
      splitAmongUserIds,
    });

    res.status(201).json({
      message: 'Expense added successfully',
      expense,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error adding expense:');
  }
};
