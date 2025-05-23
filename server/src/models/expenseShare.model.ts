import prisma from '@/configs/prismaClient.js';
import { handlePrismaError } from '@/utils/errorHandlers.js';

// Gets a member who shares an expense using expenseId and userId
export const isPartOfExpenseSplit = async (
  expenseId: number,
  userId: string,
) => {
  try {
    return await prisma.expenseShare.findUnique({
      where: {
        expenseId_userId: { expenseId, userId },
      },
    });
  } catch (error) {
    console.error('Error getting the expense share member:', error);
    throw handlePrismaError(error);
  }
};

/**
 * Fetch all expense shares for a specific trip
 */
export const fetchExpenseSharesForTrip = async (tripId: number) => {
  try {
    return await prisma.expenseShare.findMany({
      where: { expense: { tripId } },
      include: {
        expense: {
          select: {
            description: true,
            paidBy: { select: { email: true, id: true } },
            category: true,
          },
        },
        user: { select: { email: true } },
      },
    });
  } catch (error) {
    console.error('Error fetching expense shares for trip:', error);
    throw handlePrismaError(error);
  }
};

/**
 * Fetch all expense shares for a specific user in a trip
 */
export const fetchExpenseSharesForUser = async (
  tripId: number,
  userId: string,
) => {
  try {
    return await prisma.expenseShare.findMany({
      where: { expense: { tripId }, userId },
      include: {
        expense: {
          select: {
            description: true,
            paidBy: { select: { email: true, id: true } },
            category: true,
          },
        },
        user: { select: { email: true } },
      },
    });
  } catch (error) {
    console.error('Error fetching expense shares for user:', error);
    throw handlePrismaError(error);
  }
};

export const fetchExpenseShares = async (
  expensesToSettle: { expenseId: number; debtorUserId: string }[],
  tripId: number,
) => {
  return await prisma.expenseShare.findMany({
    where: {
      OR: expensesToSettle.map((pair) => ({
        expenseId: pair.expenseId,
        userId: pair.debtorUserId,
        expense: { tripId },
        settled: false,
      })),
    },
    include: {
      expense: {
        select: {
          paidById: true,
        },
      },
    },
  });
};

export const settleExpenseShares = async (
  expensesToSettle: { expenseId: number; debtorUserId: string }[],
  tripId: number,
) => {
  try {
    const updatePromises = expensesToSettle.map((pair) =>
      prisma.expenseShare.update({
        where: {
          expenseId_userId: {
            expenseId: pair.expenseId,
            userId: pair.debtorUserId,
          },
          expense: { tripId },
        },
        data: { settled: true },
      }),
    );

    const results = await Promise.all(updatePromises);
    return { count: results.length };
  } catch (error) {
    console.error('Error settling expense shares by pairs:', error);
    throw new Error('Failed to settle expense shares');
  }
};
