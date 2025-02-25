import {
  validateAddExpenseInput,
  validateFetchExpense,
} from '../../../middleware/expense.validators.ts';
import { validationResult } from 'express-validator';
import { Request } from 'express';

describe('Expense Validators Middleware', () => {
  let mockReq: Partial<Request>;

  const runValidation = async (req: Partial<Request>, validation: any) => {
    await validation.run(req);
    return validationResult(req);
  };

  /** ───────────────────────────────────────────────────────
   * ADD EXPENSE VALIDATION TESTS
   * ─────────────────────────────────────────────────────── */
  describe('Add Expense Validation', () => {
    it('should pass validation for a valid AddExpense input', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          amount: 50.0,
          category: 'Food',
          description: 'Lunch at restaurant',
          paidByEmail: 'user@example.com',
          splitAmongEmails: ['friend1@example.com', 'friend2@example.com'],
        },
      };

      const result = await runValidation(mockReq, validateAddExpenseInput);
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if tripId is missing', async () => {
      mockReq = {
        params: {},
        body: {
          amount: 50.0,
          category: 'Food',
        },
      };

      const result = await runValidation(mockReq, validateAddExpenseInput);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a valid number' }),
        ]),
      );
    });

    it('should fail validation if amount is missing', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: { category: 'Food' },
      };

      const result = await runValidation(mockReq, validateAddExpenseInput);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Amount must be a positive number' }),
        ]),
      );
    });

    it('should fail validation if amount is negative', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: { amount: -10, category: 'Food' },
      };

      const result = await runValidation(mockReq, validateAddExpenseInput);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Amount must be a positive number' }),
        ]),
      );
    });

    it('should fail validation if category is missing', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: { amount: 50.0 },
      };

      const result = await runValidation(mockReq, validateAddExpenseInput);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Category is required' }),
        ]),
      );
    });

    it('should fail validation if paidByEmail is invalid', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          amount: 50.0,
          category: 'Food',
          paidByEmail: 'invalid-email',
        },
      };

      const result = await runValidation(mockReq, validateAddExpenseInput);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Invalid email format for paidByEmail',
          }),
        ]),
      );
    });

    it('should fail validation if splitAmongEmails is not an array', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          amount: 50.0,
          category: 'Food',
          splitAmongEmails: 'invalid-data',
        },
      };

      const result = await runValidation(mockReq, validateAddExpenseInput);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'splitAmongEmails must be a non-empty array',
          }),
        ]),
      );
    });

    it('should fail validation if splitAmongEmails contains an invalid email', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          amount: 50.0,
          category: 'Food',
          splitAmongEmails: ['friend1@example.com', 'invalid-email'],
        },
      };

      const result = await runValidation(mockReq, validateAddExpenseInput);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Each email in splitAmongEmails must be a valid email',
          }),
        ]),
      );
    });

    it('should pass validation if description is omitted', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          amount: 100,
          category: 'Transport',
        },
      };

      const result = await runValidation(mockReq, validateAddExpenseInput);
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if description is not a string', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          amount: 100,
          category: 'Transport',
          description: 123, // Invalid type
        },
      };

      const result = await runValidation(mockReq, validateAddExpenseInput);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Description must be a string',
          }),
        ]),
      );
    });
  });

  /** ───────────────────────────────────────────────────────
   *  FETCH SINGLE EXPENSE VALIDATION TESTS
   *  ─────────────────────────────────────────────────────── */
  describe('Fetch Single Expense Validation', () => {
    it('should pass validation for valid fetchSingleExpense input', async () => {
      mockReq = { params: { tripId: '1', expenseId: '4' } };

      const result = await runValidation(mockReq, validateFetchExpense);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if tripId is not a number for fetchSingleExpense', async () => {
      mockReq = { params: { tripId: 'abc', expenseId: '10' } };

      const result = await runValidation(mockReq, validateFetchExpense);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a valid number' }),
        ]),
      );
    });

    it('should fail validation if expense id is not a number', async () => {
      mockReq = { params: { tripId: '1', expenseId: 'xyz' } };

      const result = await runValidation(mockReq, validateFetchExpense);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Expense ID must be a valid number' }),
        ]),
      );
    });

    it('should fail validation if both tripId and expense id are not numbers', async () => {
      mockReq = { params: { tripId: 'abc', expenseId: 'xyz' } };

      const result = await runValidation(mockReq, validateFetchExpense);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a valid number' }),
          expect.objectContaining({ msg: 'Expense ID must be a valid number' }),
        ]),
      );
    });
  });
});
