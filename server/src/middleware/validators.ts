import { body, checkExact, param } from 'express-validator';

// Validation for Creating a Trip
export const validateCreateTripInput = checkExact([
  body('name').isString().notEmpty().withMessage('Trip name is required'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  body('destination')
    .isString()
    .notEmpty()
    .withMessage('Destination is required'),
  body('startDate')
    .isISO8601()
    .toDate()
    .withMessage('Invalid start date format'),
  body('endDate')
    .isISO8601()
    .toDate()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
]);

// Validation for Updating a Trip
export const validateUpdateTripInput = checkExact([
  param('tripId').isInt().withMessage('Trip ID must be a number'),
  body('name').optional().isString().withMessage('Name must be a string'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  body('destination')
    .optional()
    .isString()
    .withMessage('Destination must be a string'),
  body('startDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid start date format'),
  body('endDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
]);

// Validation for Deleting a Trip
export const validateDeleteTripInput = checkExact([
  param('tripId').isInt().withMessage('Trip ID must be a number'),
]);
