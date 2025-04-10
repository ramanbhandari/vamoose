import validationErrorHandler from '@/middleware/validationErrorHandler.js';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

jest.mock('express-validator', () => {
  const actualModule = jest.requireActual('express-validator');
  return {
    ...actualModule,
    validationResult: jest.fn(),
  };
});

describe('Validation Error Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockReq = {};
    mockRes = {
      status: statusMock,
      json: jsonMock,
    } as Partial<Response>;
    mockNext = jest.fn();
  });

  it('should call next() if no validation errors', () => {
    mockReq = { body: {} };
    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: () => true,
    });

    validationErrorHandler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
    expect(jsonMock).not.toHaveBeenCalled();
  });

  it('should return 400 and validation errors if validation fails', () => {
    mockReq = { body: {} };

    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: () => false, // Simulate validation errors
      array: () => [
        { msg: 'Invalid input', param: 'email', location: 'body' },
        { msg: 'Password is required', param: 'password', location: 'body' },
      ],
    });

    validationErrorHandler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      errors: [
        { msg: 'Invalid input', param: 'email', location: 'body' },
        { msg: 'Password is required', param: 'password', location: 'body' },
      ],
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
