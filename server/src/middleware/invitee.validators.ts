import { body, checkExact, param, query } from 'express-validator';

// Validation for Creating an Invite
export const validateCreateInviteInput = checkExact([
    body('email').isEmail().withMessage('Email must be a valid email address'),
    param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),
]);
  
// Validation for all Invite Tokens
export const validateInviteParams = checkExact([
    param('token').isString().withMessage('Token must be a string'),
    param('tripId').isInt({ min: 1 }).withMessage('Trip ID must be a number'),
]);