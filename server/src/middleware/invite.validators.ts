import { body, checkExact, param, query } from 'express-validator';

// Validation for Creating an Invite
export const validateCreateInviteInput = checkExact([
    body('tripId').isInt().withMessage('Trip ID must be a number'),
    body('email').isEmail().withMessage('Email must be a valid email address'),
]);
  
// Validation for all Invite Tokens
export const validateTokenInput = checkExact([
    param('token').isString().withMessage('Token must be a string'),
]);