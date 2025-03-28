import { body, checkExact, param, query } from 'express-validator';
import { DateTime } from 'luxon';

// Helper function to get today's date
const getTodayDate = () => DateTime.now().startOf('day').toUTC().startOf('day');

// Validation for Creating a Trip
export const validateCreateTripInput = checkExact([
  body('name').isString().notEmpty().withMessage('Trip name is required'),
  body('description')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Description must be a string'),
  body('destination')
    .isString()
    .notEmpty()
    .withMessage('Destination is required'),
  body('startDate')
    .isISO8601()
    .withMessage('Invalid start date format')
    .custom((value) => {
      const startDate = DateTime.fromISO(value).toUTC().startOf('day');
      if (startDate < getTodayDate()) {
        throw new Error('Start date must be today or in the future');
      }
      return true;
    }),
  body('endDate')
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      const startDate = DateTime.fromISO(req.body.startDate)
        .toUTC()
        .startOf('day');
      const endDate = DateTime.fromISO(value).toUTC().startOf('day');
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('budget')
    .optional({ values: 'null' })
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('imageUrl')
    .optional({ values: 'null' })
    .isURL()
    .withMessage('Invalid image URL format'),
]);

// Validation for Updating a Trip
export const validateUpdateTripInput = checkExact([
  param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),
  body('name')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Name must be a string'),
  body('description')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Description must be a string'),
  body('destination')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Destination must be a string'),
  body('startDate')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Invalid start date format')
    .custom((value) => {
      const startDate = DateTime.fromISO(value).toUTC().startOf('day');
      if (startDate < getTodayDate()) {
        throw new Error('Start date must be today or in the future');
      }
      return true;
    }),
  body('endDate')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (!req.body.startDate) return true; // If startDate is not updated, skip validation
      const startDate = DateTime.fromISO(req.body.startDate)
        .toUTC()
        .startOf('day');
      const endDate = DateTime.fromISO(value).toUTC().startOf('day');
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('budget')
    .optional({ values: 'null' })
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('imageUrl')
    .optional({ values: 'null' })
    .isURL()
    .withMessage('Invalid image URL format'),
]);

// Validate fetching a single trip
export const validateFetchSingleTrip = checkExact([
  param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),
]);

// Validate fetching multiple trips with filters
export const validateFetchTripsWithFilters = checkExact([
  query('destination')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Destination must be a string'),

  query('status')
    .optional({ values: 'null' })
    .toLowerCase()
    .isIn(['past', 'current', 'future'])
    .withMessage('Invalid status. Allowed values: past, current, future'),

  query('startDate')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Invalid start date format'),

  query('endDate')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (!req.query?.startDate) return true; // Skip if startDate is not provided
      const startDate = DateTime.fromISO(req.query.startDate as string)
        .toUTC()
        .startOf('day');
      const endDate = DateTime.fromISO(value).toUTC().startOf('day');
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  query('limit')
    .optional({ values: 'null' })
    .isInt({ min: 1 })
    .withMessage('Limit must be a positive number'),

  query('offset')
    .optional({ values: 'null' })
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative number'),

  // Ensure either `status` is provided OR `startDate` / `endDate`, but not both
  query().custom((_, { req }) => {
    const { status, startDate, endDate } = req.query as {
      status?: string;
      startDate?: string;
      endDate?: string;
    };

    if (status && (startDate || endDate)) {
      throw new Error(
        'Cannot filter by both status and date fields (startDate, endDate). Choose one.',
      );
    }
    return true;
  }),
]);

// Validation for Deleting a Trip
export const validateDeleteTripInput = checkExact([
  param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),
]);

export const validateDeleteMultipleTripsInput = checkExact([
  body('tripIds')
    .isArray({ min: 1 })
    .withMessage('tripIds must be a non-empty array'),

  body('tripIds.*')
    .isInt({ min: 1 })
    .withMessage('Each trip ID must be a positive integer'),
]);
