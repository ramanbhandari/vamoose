/**
 * @file validationErrorHandler.ts
 * @description Express middleware for handling validation errors.
 * Processes express-validator results and returns standardized error responses.
 */

import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export default function validationErrorHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
}
