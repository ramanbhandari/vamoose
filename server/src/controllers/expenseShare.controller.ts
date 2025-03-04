import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/interfaces/interfaces.js';
import {
  fetchExpenseSharesForTrip,
  fetchExpenseSharesForUser,
  fetchExpenseShares,
  settleExpenseShares,
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

export const settleExpensesHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const { expensesToSettle } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (!Array.isArray(expensesToSettle) || expensesToSettle.length === 0) {
      res
        .status(400)
        .json({ error: 'Invalid expensesToSettle array provided' });
      return;
    }

    // Validate the format of expensesToSettle
    const wellFormattedExpenses = expensesToSettle.filter(
      (item: any) =>
        item &&
        typeof item.expenseId === 'number' &&
        typeof item.debtorUserId === 'string' &&
        item.debtorUserId.trim(),
    );

    const poorlyFormattedExpenses = expensesToSettle.filter(
      (item) => !wellFormattedExpenses.includes(item),
    );

    // Proceed with only well-formatted expenses
    if (wellFormattedExpenses.length === 0) {
      res.status(400).json({
        error: 'No well-formatted expense objects provided',
        poorlyFormattedExpenses,
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
      wellFormattedExpenses,
      tripId,
    );

    // Identify valid and non-existent expense shares based on the database query
    const validExpensePairs = matchingExpenseShares.map((share) => ({
      expenseId: share.expenseId,
      debtorUserId: share.userId,
    }));

    const nonExistentExpensePairs = wellFormattedExpenses.filter(
      (item) =>
        !validExpensePairs.some(
          (valid) =>
            valid.expenseId === item.expenseId &&
            valid.debtorUserId === item.debtorUserId,
        ),
    );

    if (validExpensePairs.length === 0) {
      res.status(404).json({
        error: 'No valid, unsettled expense shares found to settle',
        nonExistentExpensePairs,
      });
      return;
    }

    // Permission checks
    const isAdmin = requestingMember.role === 'admin';
    const isCreator = requestingMember.role === 'creator';

    // Filter out shares that the user is not allowed to settle
    const authorizedExpensePairs = matchingExpenseShares
      .filter(
        (share) => share.expense.paidById === userId || isAdmin || isCreator,
      )
      .map((share) => ({
        expenseId: share.expenseId,
        debtorUserId: share.userId,
      }));

    const unauthorizedExpensePairs = validExpensePairs.filter(
      (item) =>
        !authorizedExpensePairs.some(
          (allowed) =>
            allowed.expenseId === item.expenseId &&
            allowed.debtorUserId === item.debtorUserId,
        ),
    );

    // If no expenses are authorized, return an error
    if (authorizedExpensePairs.length === 0) {
      res.status(403).json({
        error: 'You are not authorized to settle any of these expenses',
        poorlyFormattedExpenses,
        nonExistentExpensePairs,
        unauthorizedExpensePairs,
      });
      return;
    }

    // Settle only authorized expense shares
    const result = await settleExpenseShares(authorizedExpensePairs, tripId);

    res.status(200).json({
      message: 'Expenses settled successfully',
      settledCount: result.count,
      settledExpenses: authorizedExpensePairs,
      poorlyFormattedExpenses,
      nonExistentExpensePairs,
      unauthorizedExpensePairs,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error settling expenses:');
  }
};
