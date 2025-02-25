import {
  validateCreateInviteInput,
  validateInviteParams,
} from '../../../middleware/invitee.validators.ts';
import { validationResult } from 'express-validator';
import { Request } from 'express';

describe('Invitee Validators Middleware', () => {
  let mockReq: Partial<Request>;

  const runValidation = async (req: Partial<Request>, validation: any) => {
    await validation.run(req);
    return validationResult(req);
  };

  /** ───────────────────────────────────────────────────────
   *  CREATE Invite VALIDATION TESTS
   *  ─────────────────────────────────────────────────────── */
  describe('Create Invite Validation', () => {
    it('should pass validation for valid CreateInvite input', async () => {
      mockReq = {
        params: {
          tripId: '1',
        },
        body: {
          email: 'test@test.com',
        },
      };

      const result = await runValidation(mockReq, validateCreateInviteInput);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if email field is not a valid email', async () => {
      mockReq = {
        params: {
          tripId: '1',
        },
        body: {
          email: '',
        },
      };

      const result = await runValidation(mockReq, validateCreateInviteInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Email must be a valid email address',
          }),
        ]),
      );
    });

    it('should fail validation if tripId is not a number', async () => {
      mockReq = {
        params: {
          tripId: 'abc',
        },
        body: {
          email: 'test@test.com',
        },
      };

      const result = await runValidation(mockReq, validateCreateInviteInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a number' }),
        ]),
      );
    });
  });

  /** ───────────────────────────────────────────────────────
   *  Invite Token VALIDATION TESTS
   *  ─────────────────────────────────────────────────────── */
  describe('Invite Token Validation', () => {
    it('should pass validation for valid params', async () => {
      mockReq = {
        params: {
          token: 'token',
          tripId: '1',
        },
      };

      const result = await runValidation(mockReq, validateInviteParams);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if invalid params', async () => {
      mockReq = {
        params: {
          token: '',
          tripId: 'abc',
        },
      };

      const result = await runValidation(mockReq, validateInviteParams);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Token must be a string' }),
          expect.objectContaining({ msg: 'Trip ID must be a number' }),
        ]),
      );
    });
  });
});
