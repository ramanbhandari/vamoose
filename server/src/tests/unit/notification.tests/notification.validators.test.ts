import {
  validateGetNotificationsInput,
  validateToggleNotificationReadStatusInput,
  validateBatchMarkNotificationsAsReadInput,
} from '@/middleware/notification.validators.js';
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

  describe('validateToggleNotificationReadStatusInput', () => {
    it('should pass validation for a valid notification ID', async () => {
      mockReq = { params: { notificationId: '5' } };

      const result = await runValidation(
        mockReq,
        validateToggleNotificationReadStatusInput,
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail if notification ID is not an integer', async () => {
      mockReq = { params: { notificationId: 'invalid' } };

      const result = await runValidation(
        mockReq,
        validateToggleNotificationReadStatusInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Notification ID must be a valid integer greater than 0',
          }),
        ]),
      );
    });
  });

  describe('validateBatchMarkNotificationsAsReadInput', () => {
    it('should pass validation for a valid array of notification IDs', async () => {
      mockReq = { body: { notificationIds: [1, 2, 3] } };

      const result = await runValidation(
        mockReq,
        validateBatchMarkNotificationsAsReadInput,
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail if notificationIds is not an array', async () => {
      mockReq = { body: { notificationIds: 'notAnArray' } };

      const result = await runValidation(
        mockReq,
        validateBatchMarkNotificationsAsReadInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Notification IDs must be a non-empty array',
          }),
        ]),
      );
    });

    it('should fail if any notification ID is not an integer', async () => {
      mockReq = { body: { notificationIds: [1, 'invalid', 3] } };

      const result = await runValidation(
        mockReq,
        validateBatchMarkNotificationsAsReadInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Each Notification ID must be a valid integer greater than 0',
          }),
        ]),
      );
    });
  });
});
