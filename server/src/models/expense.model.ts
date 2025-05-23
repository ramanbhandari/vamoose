import prisma from '@/configs/prismaClient.js';
import { handlePrismaError } from '@/utils/errorHandlers.js';
import { NotFoundError } from '@/utils/errors.js';

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

// Fetch Multiple Expenses
export const fetchMultipleExpenses = async (tripId: number) => {
  try {
    return await prisma.expense.findMany({
      where: { tripId: tripId },
    });
  } catch (error) {
    console.error('Error fetching expense by tripId:', error);
    throw handlePrismaError(error);
  }
};

// Gets multiple expenses where userId is an expense sharer
export const getExpensesForUserFiltered = async (
  expenseIds: number[],
  userId: string,
) => {
  try {
    return await prisma.expense.findMany({
      where: {
        id: { in: expenseIds },
        shares: {
          some: {
            userId: userId,
          },
        },
      },
      select: {
        id: true,
      },
    });
  } catch (error) {
    console.error('Error fetching expenses for user:', error);
    throw handlePrismaError(error);
  }
};

// Delete a single expense
export const deleteSingleExpense = async (
  expenseId: number,
  tripId: number,
) => {
  try {
    const deletedExpense = await prisma.expense.delete({
      where: { id: expenseId, tripId: tripId },
    });
    return deletedExpense;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw handlePrismaError(error);
  }
};

// Delete multiple expenses
export const deleteMultipleExpenses = async (
  tripId: number,
  expenseIds: number[],
) => {
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
      throw new NotFoundError('Expense not found');
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

// Fetch expense breakdown for a single or multiple trips
export const getTripExpensesGrouped = async (tripIds: number | number[]) => {
  try {
    const tripIdsArray = Array.isArray(tripIds) ? tripIds : [tripIds];

    const expenseBreakdowns = await prisma.expense.groupBy({
      by: ['tripId', 'category'],
      where: { tripId: { in: tripIdsArray } },
      _sum: { amount: true },
    });

    // Format the expense data as an object with tripId keys
    const expenseMap = tripIdsArray.reduce(
      (acc, id) => {
        acc[id] = { breakdown: [], totalExpenses: 0 };
        return acc;
      },
      {} as Record<
        number,
        {
          breakdown: { category: string; total: number }[];
          totalExpenses: number;
        }
      >,
    );

    expenseBreakdowns.forEach(({ tripId, category, _sum }) => {
      if (expenseMap[tripId]) {
        expenseMap[tripId].breakdown.push({
          category,
          total: _sum.amount ?? 0,
        });
        expenseMap[tripId].totalExpenses += _sum.amount ?? 0;
      }
    });

    return expenseMap;
  } catch (error) {
    console.error('Error deleting multiple expenses:', error);
    throw handlePrismaError(error);
  }
};
