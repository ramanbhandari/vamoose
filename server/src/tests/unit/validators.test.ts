import {
  validateCreateTripInput,
  validateUpdateTripInput,
  validateDeleteTripInput,
  validateFetchSingleTrip,
  validateFetchTripsWithFilters,
} from '../../middleware/validators.ts';
import { validationResult } from 'express-validator';
import { Request, Response } from 'express';

describe('Validators Middleware', () => {
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

  // Fetch Single Trip Validation Tests
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

  // Fetch Multiple Trips with Filters Validation Tests
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

    const result = await runValidation(mockReq, validateFetchTripsWithFilters);

    expect(result.isEmpty()).toBe(true);
  });

  it('should fail validation if startDate is invalid', async () => {
    mockReq = {
      query: {
        startDate: 'invalid-date',
      },
    };

    const result = await runValidation(mockReq, validateFetchTripsWithFilters);

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

    const result = await runValidation(mockReq, validateFetchTripsWithFilters);

    expect(result.isEmpty()).toBe(false);
    expect(result.array()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: 'Invalid end date format' }),
      ]),
    );
  });

  it('should fail validation if limit is not a positive integer', async () => {
    mockReq = {
      query: {
        limit: '-1',
      },
    };

    const result = await runValidation(mockReq, validateFetchTripsWithFilters);

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

    const result = await runValidation(mockReq, validateFetchTripsWithFilters);

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
