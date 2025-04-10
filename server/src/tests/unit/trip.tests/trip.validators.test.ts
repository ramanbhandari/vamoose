import {
  validateCreateTripInput,
  validateUpdateTripInput,
  validateDeleteTripInput,
  validateFetchSingleTrip,
  validateFetchTripsWithFilters,
  validateDeleteMultipleTripsInput,
} from '@/middlewares/trip.validators.js';
import { validationResult } from 'express-validator';
import { Request } from 'express';

describe('Trip Validators Middleware', () => {
  let mockReq: Partial<Request>;

  const runValidation = async (req: Partial<Request>, validation: any) => {
    await validation.run(req);
    return validationResult(req);
  };

  /** ───────────────────────────────────────────────────────
   *  CREATE TRIP VALIDATION TESTS
   *  ─────────────────────────────────────────────────────── */
  describe('Create Trip Validation', () => {
    it('should pass validation for valid CreateTrip input', async () => {
      mockReq = {
        body: {
          name: 'Trip to Paris',
          description: 'A fun trip',
          destination: 'Paris',
          startDate: '2025-05-01',
          endDate: '2025-05-10',
          budget: 1000,
        },
      };

      const result = await runValidation(mockReq, validateCreateTripInput);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if required fields are missing', async () => {
      mockReq = { body: {} };

      const result = await runValidation(mockReq, validateCreateTripInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip name is required' }),
          expect.objectContaining({ msg: 'Destination is required' }),
          expect.objectContaining({ msg: 'Invalid start date format' }),
          expect.objectContaining({ msg: 'Invalid end date format' }),
        ]),
      );
    });
  });

  /** ───────────────────────────────────────────────────────
   *  UPDATE TRIP VALIDATION TESTS
   *  ─────────────────────────────────────────────────────── */
  describe('Update Trip Validation', () => {
    it('should pass validation for valid UpdateTrip input', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: { name: 'Updated Trip Name' },
      };

      const result = await runValidation(mockReq, validateUpdateTripInput);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if tripId is not a number', async () => {
      mockReq = {
        params: { tripId: 'abc' }, // Invalid tripId
        body: { name: 'Updated Name' },
      };

      const result = await runValidation(mockReq, validateUpdateTripInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a number' }),
        ]),
      );
    });
  });

  /** ───────────────────────────────────────────────────────
   *  DELETE TRIP VALIDATION TESTS
   *  ─────────────────────────────────────────────────────── */
  describe('Delete Trip Validation', () => {
    it('should pass validation for valid DeleteTrip input', async () => {
      mockReq = { params: { tripId: '2' } };

      const result = await runValidation(mockReq, validateDeleteTripInput);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if tripId is not provided for DeleteTrip', async () => {
      mockReq = { params: {} };

      const result = await runValidation(mockReq, validateDeleteTripInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a number' }),
        ]),
      );
    });
  });

  /** ───────────────────────────────────────────────────────
   *  DELETE Multiple TRIP VALIDATION TESTS
   *  ─────────────────────────────────────────────────────── */
  describe('Delete Trip Validation', () => {
    it('should pass validation for valid DeleteMultipleTrip input', async () => {
      mockReq = { body: { tripIds: [1, 2, 3] } };

      const result = await runValidation(
        mockReq,
        validateDeleteMultipleTripsInput,
      );

      expect(result.isEmpty()).toBe(true);
    });

    it.each([
      {
        tripIds: 'not-an-array',
        errorMsg: 'tripIds must be a non-empty array',
      },
      { tripIds: [], errorMsg: 'tripIds must be a non-empty array' },
      {
        tripIds: [1, 'invalid', 3],
        errorMsg: 'Each trip ID must be a positive integer',
      },
      {
        tripIds: [0, -1, 5],
        errorMsg: 'Each trip ID must be a positive integer',
      },
    ])(
      'should fail validation for invalid input',
      async ({ tripIds, errorMsg }) => {
        const result = await runValidation(
          { body: { tripIds } },
          validateDeleteMultipleTripsInput,
        );

        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([expect.objectContaining({ msg: errorMsg })]),
        );
      },
    );
  });

  /** ───────────────────────────────────────────────────────
   *  FETCH SINGLE TRIP VALIDATION TESTS
   *  ─────────────────────────────────────────────────────── */
  describe('Fetch Single Trip Validation', () => {
    it('should pass validation for valid fetchSingleTrip input', async () => {
      mockReq = { params: { tripId: '1' } };

      const result = await runValidation(mockReq, validateFetchSingleTrip);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if tripId is not a number for fetchSingleTrip', async () => {
      mockReq = { params: { tripId: 'abc' } };

      const result = await runValidation(mockReq, validateFetchSingleTrip);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a number' }),
        ]),
      );
    });
  });

  /** ───────────────────────────────────────────────────────
   *  FETCH MULTIPLE TRIPS VALIDATION TESTS
   *  ─────────────────────────────────────────────────────── */
  describe('Fetch Multiple Trips Validation', () => {
    it('should pass validation for valid fetchTripsWithFilters input', async () => {
      mockReq = {
        query: {
          destination: 'Paris',
          startDate: '2025-05-01',
          endDate: '2025-05-10',
          limit: '10',
          offset: '0',
        },
      };

      const result = await runValidation(
        mockReq,
        validateFetchTripsWithFilters,
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if startDate is invalid', async () => {
      mockReq = {
        query: {
          startDate: 'invalid-date',
        },
      };

      const result = await runValidation(
        mockReq,
        validateFetchTripsWithFilters,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Invalid start date format' }),
        ]),
      );
    });

    it('should fail validation if endDate is invalid', async () => {
      mockReq = {
        query: {
          endDate: 'invalid-date',
        },
      };

      const result = await runValidation(
        mockReq,
        validateFetchTripsWithFilters,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Invalid end date format' }),
        ]),
      );
    });

    it('should fail validation if status is not one of the allowed values', async () => {
      mockReq = {
        query: {
          status: 'invalid-status',
        },
      };

      const result = await runValidation(
        mockReq,
        validateFetchTripsWithFilters,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Invalid status. Allowed values: past, current, future',
          }),
        ]),
      );
    });

    it('should fail validation if limit is not a positive integer', async () => {
      mockReq = {
        query: {
          limit: '-1',
        },
      };

      const result = await runValidation(
        mockReq,
        validateFetchTripsWithFilters,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Limit must be a positive number' }),
        ]),
      );
    });

    it('should fail validation if offset is negative', async () => {
      mockReq = {
        query: {
          offset: '-5',
        },
      };

      const result = await runValidation(
        mockReq,
        validateFetchTripsWithFilters,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Offset must be a non-negative number',
          }),
        ]),
      );
    });
  });
});
