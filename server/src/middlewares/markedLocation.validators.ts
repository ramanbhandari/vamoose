import { body, checkExact, param } from 'express-validator';
import { LocationType } from '@prisma/client';

// Helper function to check if a value is a valid enum value
const isValidLocationType = (value: string) => {
  return Object.values(LocationType).includes(value as LocationType);
};

// Validation for coordinates
const validateCoordinates = (coordinates: any) => {
  if (!coordinates || typeof coordinates !== 'object') {
    throw new Error('Coordinates must be an object');
  }

  if (
    !('latitude' in coordinates) ||
    !('longitude' in coordinates) ||
    typeof coordinates.latitude !== 'number' ||
    typeof coordinates.longitude !== 'number'
  ) {
    throw new Error(
      'Coordinates must include valid latitude and longitude numbers',
    );
  }

  if (
    coordinates.latitude < -90 ||
    coordinates.latitude > 90 ||
    coordinates.longitude < -180 ||
    coordinates.longitude > 180
  ) {
    throw new Error('Latitude and longitude values are out of range');
  }

  return true;
};

// Validation for Creating a Marked Location
export const validateCreateMarkedLocationInput = checkExact([
  param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),

  body('name').isString().notEmpty().withMessage('Name is required'),

  body('type')
    .isString()
    .notEmpty()
    .withMessage('Type is required')
    .custom((value) => {
      if (!isValidLocationType(value)) {
        throw new Error(
          `Invalid type. Allowed values: ${Object.values(LocationType).join(
            ', ',
          )}`,
        );
      }
      return true;
    }),

  body('coordinates')
    .notEmpty()
    .withMessage('Coordinates are required')
    .custom(validateCoordinates),

  body('address')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Address must be a string'),

  body('notes')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Notes must be a string'),

  body('website')
    .optional({ values: 'null' })
    .isString()
    .isURL()
    .withMessage('Website must be a valid URL'),

  body('phoneNumber')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Phone number must be a string'),
]);

// Validation for Updating the Notes of a Marked Location
export const validateUpdateMarkedLocationNotesInput = checkExact([
  param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),

  param('locationId')
    .isString()
    .isUUID()
    .withMessage('Location ID must be a valid UUID'),

  body('notes')
    .isString()
    .notEmpty()
    .withMessage('Notes are required and must be a non-empty string'),
]);

// Validation for Getting All Marked Locations for a Trip
export const validateGetAllMarkedLocationsInput = checkExact([
  param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),
]);

// Validation for Deleting a Marked Location
export const validateDeleteMarkedLocationInput = checkExact([
  param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),

  param('locationId')
    .isString()
    .isUUID()
    .withMessage('Location ID must be a valid UUID'),
]);
