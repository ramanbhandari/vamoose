import prisma from '../config/prismaClient.ts';
import { handlePrismaError } from '../utils/errorHandlers.ts';
import { NotFoundError } from '../utils/errors.ts';

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

// Fetch Expense by trip and expense ID
export const fetchSingleExpense = async (tripId: number, expenseId: number) => {
  try {
    const expense = prisma.expense.findUnique({
      where: {
        id: expenseId,
        tripId: tripId,
      },
    });

    return expense;
  } catch (error) {
    console.error('Error fetching expense:', error);
    throw handlePrismaError(error);
  }
};

// Delete a single expense
export const deleteSingleExpense = async (tripId: number, expenseId: number) => {
  try{
    return await prisma.expense.delete({
      where: {
        id: expenseId,
        tripId: tripId,
      },
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw handlePrismaError(error);
  }
}

// Delete multiple expenses
export const deleteMultipleExpenses = async (tripId: number, expenseIds: number[]) => {
  try {
    const result = await prisma.expense.deleteMany({
      where: {
        tripId: tripId,
        id: {
          in: expenseIds, 
        },
      },
    });

    if (result.count === 0) {
      throw new NotFoundError('No expenses deleted. Expense not found')
    }

    return {
      message: 'Expenses deleted successfully',
      deletedCount: result.count,
    };

  } catch (error) {
    console.error('Error deleting multiple expenses:', error);
    throw handlePrismaError(error);
  }
};
