import { checkExact, body, param, query } from 'express-validator';
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
    .toUpperCase()
    .isIn([
      'GENERAL',
      'TRAVEL',
      'ACTIVITY',
      'MEAL',
      'MEETING',
      'FREE_TIME',
      'OTHER',
    ])
    .withMessage('Invalid event category'),

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

export const validateGetAllItineraryEventsInput = checkExact([
  param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),

  query('category')
    .optional({ values: 'null' })
    .isString()
    .toUpperCase()
    .isIn([
      'GENERAL',
      'TRAVEL',
      'ACTIVITY',
      'MEAL',
      'MEETING',
      'FREE_TIME',
      'OTHER',
    ])
    .withMessage('Invalid event category'),

  query('startTime')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Start time filter must be a valid ISO8601 date'),

  query('endTime')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('End time filter must be a valid ISO8601 date'),
]);

export const validateGetSingleItineraryEventInput = checkExact([
  param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),
  param('eventId').isInt({ min: 1 }).withMessage('Event ID must be a number'),
]);
