import {
  validateCastVoteInput,
  validateDeleteVoteInput,
} from '@/middleware/pollVote.validators.js';
import { validationResult } from 'express-validator';
import { Request } from 'express';

describe('Cast Vote Validator', () => {
  let mockReq: Partial<Request>;

  const runValidation = async (req: Partial<Request>, validation: any) => {
    await validation.run(req);
    return validationResult(req);
  };

  it('should pass validation for a valid request', async () => {
    mockReq = {
      params: { tripId: '1', pollId: '1' },
      body: { pollOptionId: 1 },
    };

    const result = await runValidation(mockReq, validateCastVoteInput);
    expect(result.isEmpty()).toBe(true);
  });

  it.each([
    {
      scenario: 'Invalid trip ID',
      params: { tripId: 'abc', pollId: '1' },
      body: { pollOptionId: 1 },
      expectedError: 'Trip ID must be a positive integer',
    },
    {
      scenario: 'Invalid poll ID',
      params: { tripId: '1', pollId: 'abc' },
      body: { pollOptionId: 1 },
      expectedError: 'Poll ID must be a positive integer',
    },
    {
      scenario: 'Invalid poll option ID',
      params: { tripId: '1', pollId: '1' },
      body: { pollOptionId: 'abc' },
      expectedError: 'Poll Option ID must be a positive integer',
    },
  ])(
    '[$scenario] → should fail validation',
    async ({ params, body, expectedError }) => {
      mockReq = { params, body };

      const result = await runValidation(mockReq, validateCastVoteInput);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: expectedError }),
        ]),
      );
    },
  );
});

describe('Delete Vote Validator', () => {
  let mockReq: Partial<Request>;

  const runValidation = async (req: Partial<Request>, validation: any) => {
    await validation.run(req);
    return validationResult(req);
  };

  it('should pass validation for valid input', async () => {
    mockReq = {
      params: { tripId: '1', pollId: '10' },
    };

    const result = await runValidation(mockReq, validateDeleteVoteInput);

    expect(result.isEmpty()).toBe(true);
  });

  it.each([
    [{ tripId: 'abc' }, 'Trip ID must be a valid positive integer'],
    [{ pollId: '-1' }, 'Poll ID must be a valid positive integer'],
  ])('should fail for invalid input: %p', async (params, expectedError) => {
    mockReq = { params };

    const result = await runValidation(mockReq, validateDeleteVoteInput);

    expect(result.isEmpty()).toBe(false);
    expect(result.array()).toEqual(
      expect.arrayContaining([expect.objectContaining({ msg: expectedError })]),
    );
  });
});
