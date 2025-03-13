import { checkExact, body, param } from 'express-validator';

export const validateAddEventNoteInput = checkExact([
  param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),
  param('eventId').isInt({ min: 1 }).withMessage('Event ID must be a number'),

  body('content')
    .isString()
    .withMessage('Note content must be a string')
    .trim()
    .notEmpty()
    .withMessage('Note content must be a non-empty string'),
]);
