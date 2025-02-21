import prisma from '../config/prismaClient.ts';
import { handlePrismaError } from '../utils/errorHandlers.ts';

/**
 * Creates an expense and associated shares in the database.
 */
export const addExpense = async ({
  tripId,
  amount,
  category,
  description,
  paidById,
  splitAmongUserIds,
}: {
  tripId: number;
  amount: number;
  category: string;
  description?: string | null;
  paidById: string;
  splitAmongUserIds: string[];
}) => {
  try {
    // Calculate equal shares
    const shareAmount = parseFloat(
      (amount / splitAmongUserIds.length).toFixed(2),
    );

    // Create the expense with associated shares
    return await prisma.expense.create({
      data: {
        amount,
        category,
        description,
        tripId,
        paidById,
        shares: {
          create: splitAmongUserIds.map((userId) => ({
            userId,
            share: shareAmount,
          })),
        },
      },
      include: { shares: true },
    });
  } catch (error) {
    console.error('Error adding expense:', error);
    throw handlePrismaError(error);
  }
};
