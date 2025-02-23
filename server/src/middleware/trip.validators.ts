import { body, checkExact, param, query } from 'express-validator';

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
  body('imageUrl').optional().isURL().withMessage('Invalid image URL format'),
]);

// Validation for Updating a Trip
export const validateUpdateTripInput = checkExact([
  param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),
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
  body('imageUrl').optional().isURL().withMessage('Invalid image URL format'),
]);

// Validate fetching a single trip
export const validateFetchSingleTrip = checkExact([
  param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),
]);

// Validate fetching multiple trips with filters
export const validateFetchTripsWithFilters = checkExact([
  query('destination')
    .optional()
    .isString()
    .withMessage('Destination must be a string'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limit must be a positive number'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative number'),
]);

// Validation for Deleting a Trip
export const validateDeleteTripInput = checkExact([
  param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),
]);

export const validateDeleteMultipleTripsInput = checkExact([
  body('tripIds')
    .isArray({ min: 1 })
    .withMessage('tripIds must be a non-empty array')
    .custom((tripIds) =>
      tripIds.every((id: number) => Number.isInteger(id) && id > 0),
    )
    .withMessage('Each trip ID must be a positive integer'),
]);
