import { Request, Response } from 'express';
import {
  getTripMember,
  getAllTripMembers,
  getManyTripMembersFilteredByUserId,
} from '@/models/member.model.js';
import { isPartOfExpenseSplit } from '@/models/expenseShare.model.js';
import { getUserByEmail, getUsersByEmails } from '@/models/user.model.js';
import {
  addExpense,
  deleteSingleExpense,
  fetchSingleExpense,
  getExpensesForUserFiltered,
  deleteMultipleExpenses,
} from '@/models/expense.model.js';
import { handleControllerError } from '@/utils/errorHandlers.js';
import { AuthenticatedRequest } from '@/interfaces/interfaces';
import { ForbiddenError, NotFoundError } from '@/utils/errors.js';
import {
  notifySpecificTripMembers,
  notifyTripMembersExceptInitiator,
} from '@/utils/notificationHandlers.js';
import { NotificationType } from '@/interfaces/enums.js';
import { fetchSingleTrip } from '@/models/trip.model.js';

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

    // Notify the members of the trip of the new expense
    const trip = await fetchSingleTrip(userId, tripId);
    await notifyTripMembersExceptInitiator(tripId, userId, {
      type: NotificationType.EXPENSE_CREATED,
      relatedId: expense.id,
      title: `Expense Added to trip "${trip.name}"`,
      message: `A new expense of $${amount} has been added the trip.`,
      channel: 'IN_APP',
    });

    // Notify people part of the expense split
    const splitMembersToNotify = splitAmongUserIds.filter(
      (id) => id !== userId && id !== paidByUserId,
    );
    await notifySpecificTripMembers(tripId, splitMembersToNotify, {
      type: NotificationType.EXPENSE_SHARE_ADDED,
      relatedId: expense.id,
      title: `You’ve Been Added to an Expense for trip "${trip.name}"`,
      message: `You have been included in a shared expense of $${amount} for the trip. Check your balances in the Expenses tab.`,
      channel: 'IN_APP',
    });
  } catch (error) {
    handleControllerError(error, res, 'Error adding expense:');
  }
};

export const fetchSingleExpenseHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;

  const tripId = Number(req.params.tripId);
  const expenseId = Number(req.params.expenseId);

  try {
    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (isNaN(expenseId)) {
      res.status(400).json({ error: 'Invalid expense ID' });
      return;
    }

    const isTripMember = await getTripMember(tripId, userId);

    if (!isTripMember) {
      res.status(403).json({ error: 'You are not a member of this trip.' });
      return;
    }

    const expense = await fetchSingleExpense(tripId, expenseId);

    if (!expense) {
      res.status(404).json({ error: 'Expense not found for this trip' });
      return;
    }

    res.status(200).json({
      message: 'Expense fetched successfully',
      expense,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
    console.error(error);
  }
};

/**
 * Delete a Single Expense (Only the Members can Delete)
 */
export const deleteSingleExpenseHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const expenseId = Number(req.params.expenseId);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (isNaN(expenseId)) {
      res.status(400).json({ error: 'Invalid expense ID' });
    }

    // Check if the expense even exists
    const expense = await fetchSingleExpense(tripId, expenseId);
    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    // Ensure the user is included in the trip
    const isMember = await getTripMember(tripId, userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this trip');
    }

    // Ensure the user is included in the expense split
    const isPartOfSplit = await isPartOfExpenseSplit(expenseId, userId);
    if (!isPartOfSplit) {
      throw new ForbiddenError('You are not included in this expense split');
    }

    const deletedExpense = await deleteSingleExpense(expenseId, tripId);
    if (deletedExpense) {
      res.status(200).json({
        message: 'Expense deleted successfully',
        expense: deletedExpense,
      });
      return;
    } else {
      res.status(404).json({ error: 'Nothing deleted. Expense not found' });
    }
  } catch (error) {
    handleControllerError(error, res, 'Error deleting expense:');
  }
};

/**
 * Delete Multiple Expenses from a trip (Only the Members can Delete)
 */
export const deleteMultipleExpensesHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      userId,
      body: { expenseIds },
    } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (!Array.isArray(expenseIds) || expenseIds.length === 0) {
      res.status(400).json({ error: 'Invalid expense ID list' });
      return;
    }

    const isMember = await getTripMember(tripId, userId);
    if (!isMember) {
      res
        .status(403)
        .json({ error: `You are not a member of this trip: ${tripId}` });
      return;
    }

    const userExpenses = await getExpensesForUserFiltered(expenseIds, userId);
    const userExpenseIds = userExpenses.map((expense) => expense.id);

    const validExpenseIds = expenseIds.filter((id) =>
      userExpenseIds.includes(id),
    );
    const invalidExpenseIds = expenseIds.filter(
      (id) => !userExpenseIds.includes(id),
    );

    if (validExpenseIds.length === 0) {
      res.status(404).json({
        error: 'No valid expenses found for deletion',
        invalidExpenseIds,
      });
      return;
    }

    const result = await deleteMultipleExpenses(tripId, validExpenseIds);

    res.status(200).json({
      message: 'Expenses deleted successfully',
      deletedCount: result.deletedCount,
      validExpenseIds,
      invalidExpenseIds,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error deleting multiple expenses:');
  }
};
