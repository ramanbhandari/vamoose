import prisma from '@/config/prismaClient.js';
import { handlePrismaError } from '@/utils/errorHandlers.js';

export interface TripDebtDetail {
  creditor: string;
  amount: number;
  description?: string | null;
  category?: string;
  settled: boolean;
}

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

// Fetch a summary of debts for a specific trip
export const getTripDebtsSummary = async (tripId: number) => {
  try {
    const expenseShares = await prisma.expenseShare.findMany({
      where: { expense: { tripId } },
      include: {
        expense: {
          select: {
            description: true,
            paidBy: {
              select: { email: true },
            },
            category: true,
          },
        },
        user: {
          select: { email: true },
        },
      },
    });

    const summary: Record<
      string,
      {
        outstanding: TripDebtDetail[];
        settled: TripDebtDetail[];
        totalOwed: number;
      }
    > = {};

    expenseShares.forEach((share) => {
      const owedBy = share.user.email;
      const owedTo = share.expense.paidBy?.email ?? '';

      if (owedBy !== owedTo) {
        if (!summary[owedBy]) {
          summary[owedBy] = {
            outstanding: [],
            settled: [],
            totalOwed: 0,
          };
        }

        const debtDetail: TripDebtDetail = {
          creditor: owedTo,
          amount: share.share,
          description: share.expense.description,
          category: share.expense.category,
          settled: share.settled,
        };

        if (share.settled) {
          summary[owedBy].settled.push(debtDetail);
        } else {
          summary[owedBy].outstanding.push(debtDetail);
        }

        summary[owedBy].totalOwed += share.share;
      }
    });

    // Convert the summary object into an array format
    const summaryArray = Object.entries(summary).map(([email, details]) => ({
      email,
      ...details,
    }));

    return summaryArray;
  } catch (error) {
    console.error('Error fetching trip debts summary:', error);
    throw new Error('Failed to fetch trip debts summary');
  }
};

// Fetch detailed debt information for a specific user in a trip
/**
 * Get the owed summary for a specific user within a trip
 */
export const getUserDebtDetails = async (tripId: number, userId: string) => {
  try {
    const expenseShares = await prisma.expenseShare.findMany({
      where: {
        expense: { tripId },
        userId,
      },
      include: {
        expense: {
          select: {
            description: true,
            paidBy: {
              select: { email: true },
            },
            category: true,
          },
        },
        user: {
          select: { email: true },
        },
      },
    });

    const outstanding: TripDebtDetail[] = [];
    const settled: TripDebtDetail[] = [];
    let totalOwed = 0;

    expenseShares.forEach((share) => {
      const owedTo = share.expense.paidBy?.email ?? '';

      if (share.user.email !== owedTo) {
        const debtDetail: TripDebtDetail = {
          creditor: owedTo,
          amount: share.share,
          description: share.expense.description,
          category: share.expense.category,
          settled: share.settled,
        };

        if (share.settled) {
          settled.push(debtDetail);
        } else {
          outstanding.push(debtDetail);
        }

        totalOwed += share.share;
      }
    });

    return {
      outstanding,
      settled,
      totalOwed,
    };
  } catch (error) {
    console.error('Error fetching user owed summary:', error);
    throw new Error('Failed to fetch user owed summary');
  }
};
