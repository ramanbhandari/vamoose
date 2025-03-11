import { checkExact, body, param } from 'express-validator';
import { EventCategory } from '@/interfaces/enums.js';

export const validateCreateItineraryEventInput = checkExact([
  param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),

  body('title')
    .isString()
    .notEmpty()
    .withMessage('Title is required and must be a string'),

  body('description')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Description must be a string'),

  body('location')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Location must be a string'),

  body('startTime')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Start time must be a valid ISO8601 date'),

  body('endTime')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('End time must be a valid ISO8601 date'),

  body('category')
    .isString()
    .withMessage('Category must be a string')
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty')
    .toUpperCase()
    .isIn(Object.values(EventCategory))
    .withMessage(
      `Category must be one of: ${Object.values(EventCategory).join(', ')}`,
    ),

  body('assignedUserIds')
    .optional({ values: 'null' })
    .isArray()
    .withMessage('Assigned user IDs must be an array of strings'),

  body('assignedUserIds.*')
    .isString()
    .withMessage('Each assigned user ID must be a string')
    .trim()
    .notEmpty()
    .withMessage('Each assigned user ID must be a non-empty string'),

  body('notes')
    .optional({ values: 'null' })
    .isArray()
    .withMessage('Notes must be an array of objects'),

  body('notes.*.content')
    .isString()
    .withMessage('Each Note content must be a string')
    .trim()
    .notEmpty()
    .withMessage('Each Note content must be a non-empty string'),
]);
