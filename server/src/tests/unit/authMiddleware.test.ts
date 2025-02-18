import { authMiddleware } from '../../middleware/authMiddleware.ts';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should call next() if token is valid', () => {
    const mockToken = 'valid-token';
    mockReq = { headers: { authorization: `Bearer ${mockToken}` } };

    (jwt.verify as jest.Mock).mockReturnValue({
      sub: 'user-123',
      exp: Date.now() / 1000 + 60,
    });

    authMiddleware(mockReq as Request, mockRes as Response, next);

    expect((mockReq as any).userId).toBe('user-123');
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if Authorization header is missing', () => {
    mockReq = { headers: {} };

    authMiddleware(mockReq as Request, mockRes as Response, next);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Unauthorized: Missing or invalid Authorization header',
    });
  });

  it('should return 401 if token is expired', () => {
    const mockToken = 'expired-token';
    mockReq = { headers: { authorization: `Bearer ${mockToken}` } };

    (jwt.verify as jest.Mock).mockReturnValue({
      sub: 'user-123',
      exp: Date.now() / 1000 - 60,
    });

    authMiddleware(mockReq as Request, mockRes as Response, next);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Unauthorized: Token has expired',
    });
  });

  it.each([
    {
      tokenState: 'does not contain subject',
      expectedStatus: 401,
      expectedMessage: 'Unauthorized: Invalid token',
    },
    {
      tokenState: 'is invalid',
      expectedStatus: 401,
      expectedMessage: 'Unauthorized: Invalid token',
    },
  ])(
    'when token $tokenState, should return $expectedStatus',
    ({ expectedStatus, expectedMessage }) => {
      const mockToken = 'invalid-token';
      mockReq = { headers: { authorization: `Bearer ${mockToken}` } };

      (jwt.verify as jest.Mock)
        .mockReturnValueOnce({ exp: 2 })
        .mockImplementationOnce(() => {
          throw new Error('Invalid token');
        });

      authMiddleware(mockReq as Request, mockRes as Response, next);

      expect(mockRes.status).toHaveBeenCalledWith(expectedStatus);
      expect(mockRes.json).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );
});
