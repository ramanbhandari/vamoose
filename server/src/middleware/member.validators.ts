import { param, body, checkExact } from 'express-validator';

export const validateUpdateTripMemberInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a positive number'),
  param('userId')
    .isString()
    .notEmpty()
    .withMessage("Member's userId is required"),
  body('role')
    .toLowerCase()
    .isIn(['admin', 'member'])
    .withMessage('Role must be either "admin" or "member"'),
]);

export const validateFetchSingleTripMember = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a positive number'),
  param('userId')
    .isString()
    .notEmpty()
    .withMessage("Member's User ID must be a valid string"),
]);

export const validateFetchTripMembers = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a positive number'),
]);

export const validateLeaveTripInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a valid positive number'),
]);

export const validateRemoveTripMemberInput = checkExact([
  param('tripId')
    .isInt({ min: 1 })
    .withMessage('Trip ID must be a positive number'),
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('Member user ID is required'),
]);

export const validateBatchRemoveTripMembersInput = checkExact([
  body('memberUserIds')
    .isArray({ min: 1 })
    .withMessage('memberUserIds must be a non-empty array')
    .custom((value) =>
      value.every((id: any) => typeof id === 'string' && id.trim() !== ''),
    )
    .withMessage('Each memberUserId must be a non-empty string'),
]);
