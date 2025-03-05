import {
  validateCreatePollInput,
  validateDeletePollInput,
  validateBatchDeletePollsInput,
} from '@/middleware/poll.validators.js';
import { validationResult } from 'express-validator';
import { Request } from 'express';

describe('Poll Validators Middleware', () => {
  let mockReq: Partial<Request>;

  const runValidation = async (req: Partial<Request>, validation: any) => {
    await validation.run(req);
    return validationResult(req);
  };

  describe('validateCreatePollInput', () => {
    it('should pass validation for valid input', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          question: 'What is the best option?',
          expiresAt: '2025-05-01T12:00:00Z',
          options: ['Option 1', 'Option 2'],
        },
      };

      const result = await runValidation(mockReq, validateCreatePollInput);

      expect(result.isEmpty()).toBe(true);
    });

    it.each([
      {
        params: { tripId: 'abc' },
        body: {
          question: 'What is the best option?',
          expiresAt: '2025-05-01T12:00:00Z',
          options: ['Option 1', 'Option 2'],
        },
        expectedError: 'Trip ID must be a positive integer',
      },
      {
        params: { tripId: '1' },
        body: {
          question: '',
          expiresAt: '2025-05-01T12:00:00Z',
          options: ['Option 1', 'Option 2'],
        },
        expectedError: 'Question is required',
      },
      {
        params: { tripId: '1' },
        body: {
          question: 'What is the best option?',
          expiresAt: 'invalid-date',
          options: ['Option 1', 'Option 2'],
        },
        expectedError: 'Expiration date must be a valid ISO8601 date',
      },
      {
        params: { tripId: '1' },
        body: {
          question: 'What is the best option?',
          expiresAt: '2025-05-01T12:00:00Z',
          options: [],
        },
        expectedError: 'At least two poll options are required',
      },
    ])(
      'should fail validation for invalid input: $expectedError',
      async ({ params, body, expectedError }) => {
        mockReq = { params, body };

        const result = await runValidation(mockReq, validateCreatePollInput);

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

describe('Delete Poll Validator', () => {
  let mockReq: Partial<Request>;

  const runValidation = async (req: Partial<Request>, validation: any) => {
    await validation.run(req);
    return validationResult(req);
  };

  describe('validateDeletePollInput', () => {
    it('should pass validation for valid trip ID and poll ID', async () => {
      mockReq = {
        params: { tripId: '1', pollId: '10' },
      };

      const result = await runValidation(mockReq, validateDeletePollInput);

      expect(result.isEmpty()).toBe(true);
    });

    it.each([
      {
        params: { tripId: 'abc', pollId: '10' },
        expectedError: 'Trip ID must be a positive integer',
      },
      {
        params: { tripId: '1', pollId: 'xyz' },
        expectedError: 'Poll ID must be a positive integer',
      },
      {
        params: { tripId: '', pollId: '10' },
        expectedError: 'Trip ID must be a positive integer',
      },
      {
        params: { tripId: '1', pollId: '' },
        expectedError: 'Poll ID must be a positive integer',
      },
    ])(
      'should fail validation for invalid input: $params',
      async ({ params, expectedError }) => {
        mockReq = { params };

        const result = await runValidation(mockReq, validateDeletePollInput);

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

describe('Batch Delete Polls Validator', () => {
  let mockReq: Partial<Request>;

  const runValidation = async (req: Partial<Request>, validation: any) => {
    await validation.run(req);
    return validationResult(req);
  };

  it('should pass validation for a valid request', async () => {
    mockReq = {
      params: { tripId: '1' },
      body: { pollIds: [1, 2, 3] },
    };

    const result = await runValidation(mockReq, validateBatchDeletePollsInput);

    expect(result.isEmpty()).toBe(true);
  });

  it.each([
    {
      params: { tripId: 'abc' },
      body: { pollIds: [1, 2, 3] },
      expectedError: 'Trip ID must be a positive integer',
    },
    {
      params: { tripId: '1' },
      body: { pollIds: [] },
      expectedError: 'pollIds must be a non-empty array of integers',
    },
    {
      params: { tripId: '1' },
      body: { pollIds: ['not-a-number'] },
      expectedError: 'Each poll ID must be a positive integer',
    },
  ])(
    'should fail validation for invalid input: %o',
    async ({ params, body, expectedError }) => {
      mockReq = { params, body };

      const result = await runValidation(
        mockReq,
        validateBatchDeletePollsInput,
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
