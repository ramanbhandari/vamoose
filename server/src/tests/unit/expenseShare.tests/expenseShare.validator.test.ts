import {
  validateTripDebtSummaryInput,
  validateUserDebtSummaryInput,
} from '@/middleware/expenseShare.validators.js';
import { validationResult } from 'express-validator';
import { Request } from 'express';

describe('Owed Summary Validators Middleware', () => {
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
      [{ tripId: 'abc' }, 'Trip ID must be a positive integer'],
      [{}, 'Trip ID must be a positive integer'],
    ])(
      'should fail validation for invalid trip ID: %p',
      async (params, expectedError) => {
        mockReq = { params };
        const result = await runValidation(
          mockReq,
          validateTripDebtSummaryInput,
        );
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ msg: expectedError }),
          ]),
        );
      },
    );
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
      [
        { tripId: 'abc', userId: 'user-123' },
        'Trip ID must be a positive integer',
      ],
      [{ tripId: '1' }, 'User ID is required'],
      [{ tripId: '1', userId: '' }, 'User ID is required'],
    ])(
      'should fail validation for invalid input: %p',
      async (params, expectedError) => {
        mockReq = { params };
        const result = await runValidation(
          mockReq,
          validateUserDebtSummaryInput,
        );
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ msg: expectedError }),
          ]),
        );
      },
    );
  });
});
