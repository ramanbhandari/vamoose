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
    .isIn(['admin', 'member'])
    .withMessage('Role must be either "admin" or "member"'),
]);
