import { validateGetNotificationsInput } from '@/validators/notification.validators.js';
import { validationResult } from 'express-validator';
import { Request } from 'express';

describe('Notification Validators Middleware', () => {
  let mockReq: Partial<Request>;

  const runValidation = async (req: Partial<Request>, validation: any) => {
    await validation.run(req);
    return validationResult(req);
  };

  describe('validateGetNotificationsInput', () => {
    it('should pass validation for a valid request', async () => {
      mockReq = {
        query: {
          isRead: 'true',
          type: 'REMINDER',
          tripId: '1',
        },
      };

      const result = await runValidation(
        mockReq,
        validateGetNotificationsInput,
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail if isRead is not a boolean', async () => {
      mockReq = {
        query: { isRead: 'notBoolean' },
      };

      const result = await runValidation(
        mockReq,
        validateGetNotificationsInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'isRead must be a boolean (true or false)',
          }),
        ]),
      );
    });

    it('should fail if type is not a string', async () => {
      mockReq = {
        query: { type: 123 },
      };

      const result = await runValidation(
        mockReq,
        validateGetNotificationsInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Notification type must be a string',
          }),
        ]),
      );
    });

    it('should fail if tripId is not a valid positive integer', async () => {
      mockReq = {
        query: { tripId: '-1' },
      };

      const result = await runValidation(
        mockReq,
        validateGetNotificationsInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Trip ID must be a valid positive integer',
          }),
        ]),
      );
    });
  });
});
