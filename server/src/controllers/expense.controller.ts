import { Request, Response } from 'express';
import { addExpense, fetchSingleExpense } from '../models/expense.model';
import { handleControllerError } from '../utils/errorHandlers.ts';
import { AuthenticatedRequest } from '../interfaces/interfaces';
import { ForbiddenError, NotFoundError } from '../utils/errors.ts';
import prisma from '../config/prismaClient.ts';

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
    const isMember = await prisma.tripMember.findFirst({
      where: { tripId, userId },
    });

    if (!isMember) {
      throw new ForbiddenError('You are not a member of this trip.');
    }

    // Convert `paidByEmail` to user ID
    let paidByUserId = userId; // Default to authenticated user
    if (paidByEmail) {
      const paidByUser = await prisma.user.findUnique({
        where: { email: paidByEmail },
        select: { id: true },
      });

      if (!paidByUser) {
        throw new NotFoundError('The user who paid is not found.');
      }

      // Ensure the paidBy user is a trip member
      const paidByMember = await prisma.tripMember.findFirst({
        where: { tripId, userId: paidByUser.id },
      });

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
      const allMembers = await prisma.tripMember.findMany({
        where: { tripId },
        select: { userId: true },
      });

      splitAmongUserIds = allMembers.map((member) => member.userId);
    } else {
      // Fetch users from provided emails and validate existence
      const userRecords = await prisma.user.findMany({
        where: { email: { in: splitAmongEmails } },
        select: { id: true },
      });

      splitAmongUserIds = userRecords.map((user) => user.id);

      if (splitAmongUserIds.length !== splitAmongEmails.length) {
        throw new ForbiddenError(
          'Some provided emails are not associated with valid users.',
        );
      }

      // Validate that all split users are trip members
      const tripMemberIds = await prisma.tripMember
        .findMany({
          where: { tripId, userId: { in: splitAmongUserIds } },
          select: { userId: true },
        })
        .then((members) => members.map((m) => m.userId));

      const nonMembers = splitAmongUserIds.filter(
        (id) => !tripMemberIds.includes(id),
      );

      if (nonMembers.length) {
        throw new ForbiddenError(
          'Some users included in the split are not members of this trip.',
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

export const fetchSingleExpenseHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const tripId = Number(req.params.tripId);
  const expenseId = Number(req.params.id);
  const paidById = req.params.paidById;

  try {
    // Validate tripId and expenseId
    if (isNaN(tripId) || isNaN(expenseId)) {
      res.status(400).json({ error: 'Invalid trip or expense ID' });
      return;
    }

    // Check if the user is a member of the trip
    const isTripMember = await prisma.tripMember.findFirst({
      where: {
        tripId: tripId,
        userId: paidById,
      },
    });

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
    // Ensure the error handler returns a 500 status code
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
