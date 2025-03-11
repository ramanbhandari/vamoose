import { checkExact, body, param } from 'express-validator';

export const validateItineraryEventAssignmentInput = checkExact([
  param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),
  param('eventId').isInt({ min: 1 }).withMessage('Event ID must be a number'),

  body('userIds')
    .isArray({ min: 1 })
    .withMessage('User IDs must be a non-empty array of strings'),

  body('userIds.*')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Each user ID must be a non-empty string'),
]);
