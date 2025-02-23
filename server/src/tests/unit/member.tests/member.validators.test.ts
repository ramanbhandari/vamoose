import {
  validateUpdateTripMemberInput,
  validateFetchTripMembers,
  validateFetchSingleTripMember,
  validateLeaveTripInput,
} from '../../../middleware/member.validators.ts';
import { validationResult } from 'express-validator';
import { Request, Response } from 'express';

describe('TripMember Validators Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  const runValidation = async (req: Partial<Request>, validation: any) => {
    await validation.run(req);
    return validationResult(req);
  };

  // Validate Updating a Trip Member Role
  describe('validateUpdateTripMemberRole', () => {
    it('should pass validation for a valid request', async () => {
      mockReq = {
        params: { tripId: '1', userId: 'user-id' },
        body: { role: 'admin' },
      };

      const result = await runValidation(
        mockReq,
        validateUpdateTripMemberInput,
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if tripId is not a number', async () => {
      mockReq = {
        params: { tripId: 'abc', userId: 'user-id' },
        body: { role: 'admin' },
      };

      const result = await runValidation(
        mockReq,
        validateUpdateTripMemberInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a positive number' }),
        ]),
      );
    });

    it('should fail validation if userId is missing', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: { role: 'admin' },
      };

      const result = await runValidation(
        mockReq,
        validateUpdateTripMemberInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: "Member's userId is required" }),
        ]),
      );
    });

    it('should fail validation if role is missing', async () => {
      mockReq = {
        params: { tripId: '1', userId: 'user-id' },
        body: {},
      };

      const result = await runValidation(
        mockReq,
        validateUpdateTripMemberInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Role must be either "admin" or "member"',
          }),
        ]),
      );
    });

    it('should fail validation if role is not a valid option', async () => {
      mockReq = {
        params: { tripId: '1', userId: 'user-id' },
        body: { role: 'invalid-role' },
      };

      const result = await runValidation(
        mockReq,
        validateUpdateTripMemberInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Role must be either "admin" or "member"',
          }),
        ]),
      );
    });
  });

  // Validate Fetching All Trip Members
  describe('validateFetchTripMembers', () => {
    it('should pass validation for a valid tripId', async () => {
      mockReq = {
        params: { tripId: '1' },
      };

      const result = await runValidation(mockReq, validateFetchTripMembers);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if tripId is not a number', async () => {
      mockReq = {
        params: { tripId: 'invalid' },
      };

      const result = await runValidation(mockReq, validateFetchTripMembers);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a positive number' }),
        ]),
      );
    });
  });

  // Validate Fetching a Single Trip Member
  describe('validateFetchSingleTripMember', () => {
    it('should pass validation for a valid tripId and userId', async () => {
      mockReq = {
        params: { tripId: '1', userId: 'user-id' },
      };

      const result = await runValidation(
        mockReq,
        validateFetchSingleTripMember,
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if tripId is not a number', async () => {
      mockReq = {
        params: { tripId: 'invalid', userId: 'member-id' },
      };

      const result = await runValidation(
        mockReq,
        validateFetchSingleTripMember,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a positive number' }),
        ]),
      );
    });

    it('should fail validation if userId is missing', async () => {
      mockReq = {
        params: { tripId: '1' },
      };

      const result = await runValidation(
        mockReq,
        validateFetchSingleTripMember,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: "Member's User ID must be a valid string",
          }),
        ]),
      );
    });
  });

  // Validate leaving a trip
  describe('validateLeaveTripInput', () => {
    let mockReq: Partial<Request>;

    const runValidation = async (req: Partial<Request>, validation: any) => {
      await validation.run(req);
      return validationResult(req);
    };

    it('should pass validation for a valid tripId', async () => {
      mockReq = { params: { tripId: '1' } };

      const result = await runValidation(mockReq, validateLeaveTripInput);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if tripId is missing', async () => {
      mockReq = { params: {} };

      const result = await runValidation(mockReq, validateLeaveTripInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Trip ID must be a valid positive number',
          }),
        ]),
      );
    });

    it('should fail validation if tripId is not a number', async () => {
      mockReq = { params: { tripId: 'invalid' } };

      const result = await runValidation(mockReq, validateLeaveTripInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Trip ID must be a valid positive number',
          }),
        ]),
      );
    });

    it('should fail validation if tripId is negative', async () => {
      mockReq = { params: { tripId: '-5' } };

      const result = await runValidation(mockReq, validateLeaveTripInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Trip ID must be a valid positive number',
          }),
        ]),
      );
    });
  });
});
