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

export const validateUpdateEventNoteInput = checkExact([
  param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),
  param('eventId').isInt({ min: 1 }).withMessage('Event ID must be a number'),
  param('noteId').isInt({ min: 1 }).withMessage('Note ID must be a number'),

  body('content')
    .isString()
    .withMessage('Note content must be a string')
    .trim()
    .notEmpty()
    .withMessage('Note content must be a non-empty string'),
]);

export const validateDeleteEventNoteInput = checkExact([
  param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),
  param('eventId').isInt({ min: 1 }).withMessage('Event ID must be a number'),
  param('noteId').isInt({ min: 1 }).withMessage('Note ID must be a number'),
]);

export const validateBatchDeleteEventNotesInput = checkExact([
  param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),
  param('eventId').isInt({ min: 1 }).withMessage('Event ID must be a number'),
  body('noteIds')
    .isArray({ min: 1 })
    .withMessage('Note IDs must be a non-empty array of numbers'),

  body('noteIds.*')
    .isInt({ min: 1 })
    .withMessage('Each note ID must be a valid number'),
]);
