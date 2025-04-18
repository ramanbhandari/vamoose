import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/daos/interfaces.js';
import {
  fetchExpenseSharesForTrip,
  fetchExpenseSharesForUser,
  fetchExpenseShares,
  settleExpenseShares,
} from '@/models/expenseShare.model.js';
import { getTripMember } from '@/models/member.model.js';
import { handleControllerError } from '@/utils/errorHandlers.js';
import { TripDebtDetail } from '@/daos/interfaces.js';
import { notifyIndividual } from '@/utils/notificationHandlers.js';
import { NotificationType } from '@/daos/enums.js';
import { getUserById } from '@/models/user.model.js';

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
            debtorId: share.userId,
            creditorEmail: owedTo,
            creditorId: share.expense.paidBy?.id ?? '',
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
      debtorEmail: email,
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
          debtorId: share.userId,
          creditorEmail: owedTo,
          creditorId: share.expense.paidBy?.id ?? '',
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

    res.status(200).json({
      details: { outstanding, settled, totalOwed },
    });
  } catch (error) {
    handleControllerError(error, res, 'Error fetching user debt details:');
  }
};

export const settleExpenseSharesHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const { expenseSharesToSettle } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (
      !Array.isArray(expenseSharesToSettle) ||
      expenseSharesToSettle.length === 0
    ) {
      res
        .status(400)
        .json({ error: 'Invalid expenseSharesToSettle array provided' });
      return;
    }

    // Validate the format of expensesToSettle
    const wellFormattedExpenseShares = expenseSharesToSettle.filter(
      (item: any) =>
        item &&
        typeof item.expenseId === 'number' &&
        typeof item.debtorUserId === 'string' &&
        item.debtorUserId.trim(),
    );

    const poorlyFormattedExpenseShares = expenseSharesToSettle.filter(
      (item) => !wellFormattedExpenseShares.includes(item),
    );

    // Proceed with only well-formatted expenses
    if (wellFormattedExpenseShares.length === 0) {
      res.status(400).json({
        error: 'No well-formatted expense share objects provided',
        poorlyFormattedExpenseShares,
      });
      return;
    }

    // Check if the user is a member of the trip
    const requestingMember = await getTripMember(tripId, userId);
    if (!requestingMember) {
      res
        .status(403)
        .json({ error: `You are not a member of this trip: ${tripId}` });
      return;
    }

    // Fetch the expense shares using (expenseId, debtorUserId) pairs
    const matchingExpenseShares = await fetchExpenseShares(
      wellFormattedExpenseShares,
      tripId,
    );

    // Identify valid and non-existent expense shares based on the database query
    const validExpenseSharePairs = matchingExpenseShares.map((share) => ({
      expenseId: share.expenseId,
      debtorUserId: share.userId,
    }));

    const nonExistentExpenseSharePairs = wellFormattedExpenseShares.filter(
      (item) =>
        !validExpenseSharePairs.some(
          (valid) =>
            valid.expenseId === item.expenseId &&
            valid.debtorUserId === item.debtorUserId,
        ),
    );

    if (validExpenseSharePairs.length === 0) {
      res.status(404).json({
        error: 'No valid, unsettled expense shares found to settle',
        nonExistentExpenseSharePairs,
      });
      return;
    }

    // Filter out shares that the user is not allowed to settle
    const authorizedExpenseSharePairs = matchingExpenseShares
      .filter(
        (share) =>
          share.userId == userId || // Allow the debtor to mark the debt as settled
          share.expense.paidById === userId, // Allow the creditor to mark the debt as settled
      )
      .map((share) => ({
        expenseId: share.expenseId,
        creditorUserId: share.expense.paidById,
        debtorUserId: share.userId,
      }));

    const unauthorizedExpenseSharePairs = validExpenseSharePairs.filter(
      (item) =>
        !authorizedExpenseSharePairs.some(
          (allowed) =>
            allowed.expenseId === item.expenseId &&
            allowed.debtorUserId === item.debtorUserId,
        ),
    );

    // If no expenses are authorized, return an error
    if (authorizedExpenseSharePairs.length === 0) {
      res.status(403).json({
        error: 'You are not authorized to settle any of these expense shares',
        poorlyFormattedExpenseShares,
        nonExistentExpenseSharePairs,
        unauthorizedExpenseSharePairs,
      });
      return;
    }

    // Settle only authorized expense shares
    const result = await settleExpenseShares(
      authorizedExpenseSharePairs,
      tripId,
    );

    // Notify the debtor or creditor about the expense settlement
    for (const pair of authorizedExpenseSharePairs) {
      const share = matchingExpenseShares.find(
        (share) =>
          share.expenseId === pair.expenseId &&
          share.userId === pair.debtorUserId,
      );

      const debtorUser = share?.userId
        ? await getUserById(share.userId)
        : { fullName: 'A trip member' };
      const debtorName = debtorUser?.fullName;
      const amountPaid = share ? share.share : 0;

      const creditorUser = share?.expense?.paidById
        ? await getUserById(share.expense.paidById)
        : { fullName: 'A trip member' };
      const creditorName = creditorUser?.fullName;

      // If the debtor is not the one settling (i.e. current user), notify them.
      if (pair.debtorUserId !== userId) {
        await notifyIndividual(pair.debtorUserId, tripId, {
          type: NotificationType.EXPENSE_SHARE_SETTLED,
          relatedId: pair.expenseId,
          title: `Payment Completed: ${creditorName} Got Paid`,
          message: `You have successfully settled your share of $${amountPaid} for an expense covered by ${creditorName}.`,
          channel: 'IN_APP',
        });
      } else if (pair.creditorUserId && pair.creditorUserId !== userId) {
        await notifyIndividual(pair.creditorUserId, tripId, {
          type: NotificationType.EXPENSE_SHARE_SETTLED,
          relatedId: pair.expenseId,
          title: `Expense Share Received from ${debtorName}`,
          message: `${debtorName} has paid their share of $${amountPaid} for an expense you covered.`,
          channel: 'IN_APP',
        });
      }
    }

    res.status(200).json({
      message: 'Expense shares settled successfully',
      settledCount: result.count,
      settledExpenseShares: authorizedExpenseSharePairs,
      poorlyFormattedExpenseShares,
      nonExistentExpenseSharePairs,
      unauthorizedExpenseSharePairs,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error settling expenses:');
  }
};
