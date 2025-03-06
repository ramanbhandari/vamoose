import {
  validateCreateMessageInput,
  validateGetMessagesInput,
  validateUpdateMessageInput,
} from '@/middleware/message.validators.js';
import { validationResult } from 'express-validator';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

// Add Jest types
declare const describe: jest.Describe;
declare const it: jest.It;
declare const expect: jest.Expect;

describe('Message Validators Middleware', () => {
  let mockReq: Partial<Request>;

  const runValidation = async (req: Partial<Request>, validation: any) => {
    await validation.run(req);
    return validationResult(req);
  };

  /*
   *  CREATE MESSAGE VALIDATION TESTS
   */
  describe('Create Message Validation', () => {
    it('should pass validation for valid tripId param', async () => {
      mockReq = {
        params: { tripId: '1' } as ParamsDictionary,
      };

      const result = await runValidation(mockReq, validateCreateMessageInput);
      expect(result.isEmpty()).toBe(true);
    });

    it.each([
      {
        scenario: 'invalid tripId (non-numeric)',
        params: { tripId: 'abc' },
        expectedError: 'Trip ID must be a positive number',
      },
      {
        scenario: 'invalid tripId (zero)',
        params: { tripId: '0' },
        expectedError: 'Trip ID must be a positive number',
      },
      {
        scenario: 'invalid tripId (negative)',
        params: { tripId: '-1' },
        expectedError: 'Trip ID must be a positive number',
      },
    ])(
      'should fail validation when $scenario',
      async ({ params, expectedError }) => {
        mockReq = { params: params as ParamsDictionary };
        const result = await runValidation(mockReq, validateCreateMessageInput);

        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ msg: expectedError }),
          ]),
        );
      },
    );
  });

  /*
   *  GET MESSAGES VALIDATION TESTS
   */
  describe('Get Messages Validation', () => {
    it('should pass validation for valid tripId param', async () => {
      mockReq = {
        params: { tripId: '1' } as ParamsDictionary,
      };

      const result = await runValidation(mockReq, validateGetMessagesInput);
      expect(result.isEmpty()).toBe(true);
    });

    it.each([
      {
        scenario: 'invalid tripId (non-numeric)',
        params: { tripId: 'abc' },
        expectedError: 'Trip ID must be a positive number',
      },
      {
        scenario: 'invalid tripId (zero)',
        params: { tripId: '0' },
        expectedError: 'Trip ID must be a positive number',
      },
      {
        scenario: 'invalid tripId (negative)',
        params: { tripId: '-1' },
        expectedError: 'Trip ID must be a positive number',
      },
      {
        scenario: 'missing tripId',
        params: {},
        expectedError: 'Trip ID must be a positive number',
      },
    ])(
      'should fail validation when $scenario',
      async ({ params, expectedError }) => {
        mockReq = { params: params as ParamsDictionary };
        const result = await runValidation(mockReq, validateGetMessagesInput);

        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ msg: expectedError }),
          ]),
        );
      },
    );
  });

  /*
   *  UPDATE MESSAGE VALIDATION TESTS
   */
  describe('Update Message Validation', () => {
    it('should pass validation for valid text update', async () => {
      mockReq = {
        params: { messageId: 'msg123' } as ParamsDictionary,
        body: { text: 'Updated message' },
      };

      const result = await runValidation(mockReq, validateUpdateMessageInput);
      expect(result.isEmpty()).toBe(true);
    });

    it('should pass validation for valid reactions update', async () => {
      mockReq = {
        params: { messageId: 'msg123' } as ParamsDictionary,
        body: { reactions: { '👍': ['user1', 'user2'] } },
      };

      const result = await runValidation(mockReq, validateUpdateMessageInput);
      expect(result.isEmpty()).toBe(true);
    });

    it('should pass validation for valid emoji reaction update', async () => {
      mockReq = {
        params: { messageId: 'msg123' } as ParamsDictionary,
        body: { emoji: '👍', userId: 'user123' },
      };

      const result = await runValidation(mockReq, validateUpdateMessageInput);
      expect(result.isEmpty()).toBe(true);
    });

    it.each([
      {
        scenario: 'missing messageId',
        params: {},
        body: { text: 'Hello' },
        expectedError: 'Message ID must be a string.',
      },
      {
        scenario: 'no update fields provided',
        params: { messageId: 'msg123' },
        body: {},
        expectedError: 'At least one update field is required',
      },
      {
        scenario: 'invalid text type',
        params: { messageId: 'msg123' },
        body: { text: 123 },
        expectedError: 'Message text must be a string',
      },
      {
        scenario: 'invalid reactions type',
        params: { messageId: 'msg123' },
        body: { reactions: 'not-an-object' },
        expectedError: 'Reactions must be an object',
      },
      {
        scenario: 'emoji without userId',
        params: { messageId: 'msg123' },
        body: { emoji: '👍' },
        expectedError: 'At least one update field is required',
      },
      {
        scenario: 'userId without emoji',
        params: { messageId: 'msg123' },
        body: { userId: 'user123' },
        expectedError: 'At least one update field is required',
      },
    ])(
      'should fail validation when $scenario',
      async ({ params, body, expectedError }) => {
        mockReq = { params: params as ParamsDictionary, body };
        const result = await runValidation(mockReq, validateUpdateMessageInput);

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
