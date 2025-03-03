import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/interfaces/interfaces.js';
import {
  fetchExpenseSharesForTrip,
  fetchExpenseSharesForUser,
} from '@/models/expenseShare.model.js';
import { getTripMember } from '@/models/member.model.js';
import { handleControllerError } from '@/utils/errorHandlers.js';
import { TripDebtDetail } from '@/interfaces/interfaces.js';

/**
 * Get a detailed summary of all debts within a trip
 */
export const getTripDebtsSummaryHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    const isMember = await getTripMember(tripId, userId);
    if (!isMember) {
      res
        .status(403)
        .json({ error: `You are not a member of this trip: ${tripId}` });
      return;
    }

    const expenseShares = await fetchExpenseSharesForTrip(tripId);

    const summary = expenseShares.reduce(
      (acc, share) => {
        const owedBy = share.user.email;
        const owedTo = share.expense.paidBy?.email ?? '';

        if (owedBy !== owedTo) {
          if (!acc[owedBy]) {
            acc[owedBy] = {
              outstanding: [],
              settled: [],
              totalOwed: 0,
            };
          }

          const debtDetail: TripDebtDetail = {
            expenseShareId: share.expenseId,
            creditor: owedTo,
            amount: share.share,
            description: share.expense.description,
            category: share.expense.category,
            settled: share.settled,
          };

          if (share.settled) {
            acc[owedBy].settled.push(debtDetail);
          } else {
            acc[owedBy].outstanding.push(debtDetail);
            acc[owedBy].totalOwed += share.share;
          }
        }
        return acc;
      },
      {} as Record<
        string,
        {
          outstanding: TripDebtDetail[];
          settled: TripDebtDetail[];
          totalOwed: number;
        }
      >,
    );

    const summaryArray = Object.entries(summary).map(([email, details]) => ({
      email,
      ...details,
    }));

    res.status(200).json({ summary: summaryArray });
  } catch (error) {
    handleControllerError(error, res, 'Error fetching trip debts summary:');
  }
};

/**
 * Get detailed debt information for a specific user in a trip
 */
export const getUserDebtDetailsHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const targetUserId = req.params.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    const isMember = await getTripMember(tripId, userId);
    if (!isMember) {
      res
        .status(403)
        .json({ error: `You are not a member of this trip: ${tripId}` });
      return;
    }

    const targetMember = await getTripMember(tripId, targetUserId);
    if (!targetMember) {
      res.status(404).json({ error: 'Target member not found in this trip' });
      return;
    }

    const expenseShares = await fetchExpenseSharesForUser(tripId, targetUserId);

    const outstanding: TripDebtDetail[] = [];
    const settled: TripDebtDetail[] = [];
    let totalOwed = 0;

    expenseShares.forEach((share) => {
      const owedTo = share.expense.paidBy?.email ?? '';
      if (share.user.email !== owedTo) {
        const debtDetail: TripDebtDetail = {
          expenseShareId: share.expenseId,
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
          totalOwed += share.share;
        }
      }
    });

    res.status(200).json({ details: { outstanding, settled, totalOwed } });
  } catch (error) {
    handleControllerError(error, res, 'Error fetching user debt details:');
  }
};
