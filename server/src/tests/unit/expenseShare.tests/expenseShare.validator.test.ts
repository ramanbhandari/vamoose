import {
  validateTripDebtSummaryInput,
  validateUserDebtSummaryInput,
  validateSettleExpenseSharesInput,
} from '@/middleware/expenseShare.validators.js';
import { validationResult } from 'express-validator';
import { Request } from 'express';

describe('Expense Share Validators Middleware', () => {
  let mockReq: Partial<Request>;

  const runValidation = async (req: Partial<Request>, validation: any) => {
    await validation.run(req);
    return validationResult(req);
  };

  /** ───────────────────────────────────────────────────────
   *  Trip Debt Summary VALIDATION TESTS
   *  ─────────────────────────────────────────────────────── */
  describe('Trip Debt Summary Validation', () => {
    it('should pass validation for a valid trip ID', async () => {
      mockReq = { params: { tripId: '1' } };
      const result = await runValidation(mockReq, validateTripDebtSummaryInput);
      expect(result.isEmpty()).toBe(true);
    });

    it.each([
      {
        scenario: 'Invalid trip ID (non-numeric)',
        params: { tripId: 'abc' },
        expectedError: 'Trip ID must be a positive integer',
      },
      {
        scenario: 'Missing trip ID',
        params: {},
        expectedError: 'Trip ID must be a positive integer',
      },
    ])('$scenario', async ({ params, expectedError }) => {
      mockReq = { params } as Partial<Request>;
      const result = await runValidation(mockReq, validateTripDebtSummaryInput);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: expectedError }),
        ]),
      );
    });
  });

  /** ───────────────────────────────────────────────────────
   *  User Debt Details VALIDATION TESTS
   *  ─────────────────────────────────────────────────────── */
  describe('User Debt Details Validation', () => {
    it('should pass validation for valid trip ID and user ID', async () => {
      mockReq = { params: { tripId: '1', userId: 'user-123' } };
      const result = await runValidation(mockReq, validateUserDebtSummaryInput);
      expect(result.isEmpty()).toBe(true);
    });

    it.each([
      {
        scenario: 'Invalid trip ID',
        params: { tripId: 'abc', userId: 'user-123' },
        expectedError: 'Trip ID must be a positive integer',
      },
      {
        scenario: 'Missing user ID',
        params: { tripId: '1' },
        expectedError: 'User ID is required',
      },
      {
        scenario: 'Empty user ID',
        params: { tripId: '1', userId: '' },
        expectedError: 'User ID is required',
      },
    ])('$scenario', async ({ params, expectedError }) => {
      mockReq = { params } as Partial<Request>;
      const result = await runValidation(mockReq, validateUserDebtSummaryInput);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: expectedError }),
        ]),
      );
    });
  });

  /** ───────────────────────────────────────────────────────
   *  Settle ExpenseShare VALIDATION TESTS
   *  ─────────────────────────────────────────────────────── */
  describe('Settle Expenses Validator', () => {
    it('should pass validation for valid input', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          expenseSharesToSettle: [
            { expenseId: 1, debtorUserId: 'user-123' },
            { expenseId: 2, debtorUserId: 'user-456' },
          ],
        },
      };

      const result = await runValidation(
        mockReq,
        validateSettleExpenseSharesInput,
      );

      expect(result.isEmpty()).toBe(true);
    });

    it.each([
      {
        scenario: 'Invalid trip ID',
        params: { tripId: 'invalid' },
        body: { expenseSharesToSettle: [] },
        expectedError: 'Trip ID must be a valid number',
      },
      {
        scenario: 'Invalid expenseSharesToSettle format (not an array)',
        params: { tripId: '1' },
        body: { expenseSharesToSettle: 'not-an-array' },
        expectedError: 'expenseSharesToSettle must be a non-empty array',
      },
      {
        scenario: 'Invalid expense object in array',
        params: { tripId: '1' },
        body: {
          expenseSharesToSettle: [
            { expenseId: 'abc', debtorUserId: 'user-id' },
          ],
        },
        expectedError: 'Each expenseId must be a positive integer',
      },
      {
        scenario: 'Invalid expense object in array',
        params: { tripId: '1' },
        body: {
          expenseSharesToSettle: [{ expenseId: 1, debtorUserId: '' }],
        },
        expectedError: 'Each debtorUserId must be a non-empty string',
      },
    ])('$scenario', async ({ params, body, expectedError }) => {
      mockReq = { params, body } as Partial<Request>;
      const result = await runValidation(
        mockReq,
        validateSettleExpenseSharesInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: expectedError }),
        ]),
      );
    });
  });
});
