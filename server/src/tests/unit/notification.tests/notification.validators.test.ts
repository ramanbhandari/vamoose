import { validateGetNotificationsInput } from '@/middleware/notification.validators.js';
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
          type: 'POLL_COMPLETED',
        },
      };

      const result = await runValidation(
        mockReq,
        validateGetNotificationsInput,
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail if type is not a string', async () => {
      mockReq = {
        query: { type: '123' },
      };

      const result = await runValidation(
        mockReq,
        validateGetNotificationsInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringContaining('Notification type must be one of:'),
          }),
        ]),
      );
    });

    it('should fail if type is not a valid NotificationType enum value', async () => {
      mockReq = {
        query: { type: 'INVALID_TYPE' },
      };

      const result = await runValidation(
        mockReq,
        validateGetNotificationsInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringContaining('Notification type must be one of:'),
          }),
        ]),
      );
    });
  });
});
