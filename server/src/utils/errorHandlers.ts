import { Prisma } from '@prisma/client';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  DatabaseError,
  BaseError,
  ValidationError,
} from './errors.js';
import { Response } from 'express';

export function handlePrismaError(error: unknown): Error {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new ConflictError('Unique constraint failed.');
      case 'P2003':
        return new BadRequestError('Foreign key constraint failed.');
      case 'P2004':
        return new BadRequestError('A constraint failed on the database.');
      case 'P2007':
        return new BadRequestError('Data validation error.');
      case 'P2025':
        return new NotFoundError('Record not found.');
      default:
        return new DatabaseError(`Prisma error: ${error.message}`);
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return new BaseError('Unknown database error occurred.', 500);
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return new BaseError('Database crashed unexpectedly.', 500);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new BaseError('Database initialization failed.', 500);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError('Invalid input data.');
  }

  if (error instanceof BaseError) {
    return error;
  }

  return new DatabaseError('An unexpected database error occurred.');
}

export function handleControllerError(
  error: unknown,
  res: Response,
  logString: string,
) {
  if (error instanceof BaseError) {
    res.status(error.statusCode).json({ error: error.message });
  } else {
    console.error(logString, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
