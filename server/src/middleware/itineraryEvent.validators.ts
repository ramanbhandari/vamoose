import { checkExact, body } from 'express-validator';
export const validateCreateItineraryEventInput = checkExact([
  body('title')
    .isString()
    .notEmpty()
    .withMessage('Title is required and must be a string'),

  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Start time must be a valid ISO8601 date'),

  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid ISO8601 date'),

  body('category')
    .isString()
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
    .optional()
    .isArray()
    .withMessage('Assigned user IDs must be an array of strings'),

  body('notes')
    .optional()
    .isArray()
    .withMessage('Notes must be an array of objects'),

  body('notes.*.content')
    .optional()
    .isString()
    .withMessage('Note content must be a string'),

  body('notes.*.createdBy')
    .optional()
    .isString()
    .withMessage('Note createdBy must be a string'),
]);
