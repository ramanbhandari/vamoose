import { validationResult } from 'express-validator';
import { Request } from 'express';
import { validateItineraryEventAssignmentInput } from '@/middlewares/itineraryEventAssignment.validators.js';

describe('Itinerary Event Assignment Validators Middleware', () => {
  let mockReq: Partial<Request>;

  const runValidation = async (req: Partial<Request>, validation: any) => {
    await validation.run(req);
    return validationResult(req);
  };

  describe('validateItineraryEventAssignmentInput', () => {
    it('should pass validation for a valid request', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1' },
        body: {
          userIds: ['user-1', 'user-2'],
        },
      };

      const result = await runValidation(
        mockReq,
        validateItineraryEventAssignmentInput,
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if tripId is not a number', async () => {
      mockReq = {
        params: { tripId: 'abc', eventId: '1' },
        body: {
          userIds: ['user-1', 'user-2'],
        },
      };

      const result = await runValidation(
        mockReq,
        validateItineraryEventAssignmentInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a number' }),
        ]),
      );
    });

    it('should fail validation if eventId is not a number', async () => {
      mockReq = {
        params: { tripId: '1', eventId: 'abc' },
        body: {
          userIds: ['user-1', 'user-2'],
        },
      };

      const result = await runValidation(
        mockReq,
        validateItineraryEventAssignmentInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Event ID must be a number' }),
        ]),
      );
    });

    it('should fail validation if userIds is not an array', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1' },
        body: {
          userIds: 'not-an-array',
        },
      };

      const result = await runValidation(
        mockReq,
        validateItineraryEventAssignmentInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'User IDs must be a non-empty array of strings',
          }),
        ]),
      );
    });

    it('should fail validation if userIds array is empty', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1' },
        body: {
          userIds: [],
        },
      };

      const result = await runValidation(
        mockReq,
        validateItineraryEventAssignmentInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'User IDs must be a non-empty array of strings',
          }),
        ]),
      );
    });

    it('should fail validation if userIds contains non-string values', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1' },
        body: {
          userIds: [123, true, 'user-1'],
        },
      };

      const result = await runValidation(
        mockReq,
        validateItineraryEventAssignmentInput,
      );
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Each user ID must be a string',
          }),
        ]),
      );
    });

    it('should fail validation if userIds contains empty strings', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1' },
        body: {
          userIds: ['user-1', '', 'user-2'],
        },
      };

      const result = await runValidation(
        mockReq,
        validateItineraryEventAssignmentInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Each user ID must be a non-empty string',
          }),
        ]),
      );
    });
  });
});
