import { body, checkExact, param } from 'express-validator';
import { DateTime } from 'luxon';

export const validateCreatePollInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a positive integer'),

  body('question')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Question is required'),

  body('expiresAt')
    .isISO8601()
    .withMessage('Expiration date must be a valid ISO8601 date')
    .custom((value) => {
      const backendTime = DateTime.now().toUTC();
      const minExpireTime = backendTime.plus({ minutes: 4, seconds: 50 }); // Allows 10s buffer for latency from frontend
      const inputExpireTime = DateTime.fromISO(value).toUTC();

      if (inputExpireTime < minExpireTime) {
        throw new Error('Poll expiration must be at least 5 minutes from now');
      }
      return true;
    }),

  body('options')
    .isArray({ min: 2 })
    .withMessage('At least two poll options are required'),
  body('options.*')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Each option must be a non-empty string'),
]);

export const validateDeletePollInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a positive integer'),
  param('pollId')
    .isInt({ min: 1 })
    .withMessage('Poll ID must be a positive integer'),
]);

export const validateBatchDeletePollsInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a positive integer'),
  body('pollIds')
    .isArray({ min: 1 })
    .withMessage('pollIds must be a non-empty array of integers'),
  body('pollIds.*')
    .isInt({ min: 1 })
    .withMessage('Each poll ID must be a positive integer'),
]);

export const validateGetAllPollsForTripInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a positive integer'),
]);

export const validateCompletePollInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a positive integer'),
  param('pollId')
    .isInt({ min: 1 })
    .withMessage('Poll Id must be a positive integer'),
]);
