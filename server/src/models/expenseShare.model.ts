import prisma from '@/config/prismaClient.js';
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
            paidBy: { select: { email: true } },
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
            paidBy: { select: { email: true } },
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
