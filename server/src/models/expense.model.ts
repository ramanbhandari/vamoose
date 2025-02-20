import prisma from '../config/prismaClient.ts';
import { handlePrismaError } from '../utils/errorHandlers.ts';
import { ForbiddenError, NotFoundError } from '../utils/errors.ts';

/**
 * Adds an expense to a trip.
 */
export const addExpense = async ({
  userId, // Authenticated user making the request
  tripId,
  amount,
  category,
  description = null, // Default to null
  paidByEmail,
  splitAmongEmails = [], // Default to empty array
}: {
  userId: string;
  tripId: number;
  amount: number;
  category: string;
  description?: string | null;
  paidByEmail?: string;
  splitAmongEmails?: string[];
}) => {
  try {
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
      // Convert emails to user IDs
      const userRecords = await prisma.user.findMany({
        where: { email: { in: splitAmongEmails } },
        select: { id: true },
      });

      splitAmongUserIds = userRecords.map((user) => user.id);

      if (splitAmongUserIds.length !== splitAmongEmails.length) {
        throw new ForbiddenError(
          'Some provided emails are not for users who are part of this trip.',
        );
      }
    }

    // Calculate equal shares
    const shareAmount = parseFloat(
      (amount / splitAmongUserIds.length).toFixed(2),
    );

    // Create the expense
    const expense = await prisma.expense.create({
      data: {
        amount,
        category,
        description,
        tripId,
        paidById: paidByUserId,
        shares: {
          create: splitAmongUserIds.map((splitUserId) => ({
            userId: splitUserId,
            share: shareAmount,
          })),
        },
      },
      include: { shares: true },
    });

    return expense;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw handlePrismaError(error);
  }
};
