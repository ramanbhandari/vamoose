import prisma from '../config/prismaClient.ts';
import { handlePrismaError } from '../utils/errorHandlers.ts';

// Gets a member who shares an expense using expenseId and userId
export const isPartOfExpenseSplit = async (expenseId: number, userId: string) => {
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

// Gets multiple expenses where userId is an expense sharer
export const getExpensesForUser = async (expenseIds: number[], userId: string) => {
  try {
    return await prisma.expenseShare.findMany({
      where: {
        expenseId: { in: expenseIds },
        userId,
      },
      select: {
        expenseId: true,
      },
    });
  } catch (error) {
    console.error('Error fetching expenses for user:', error);
    throw handlePrismaError(error);
  }
};