import prisma from '../config/prismaClient.ts';
import { handlePrismaError } from '../utils/errorHandlers.ts';

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
