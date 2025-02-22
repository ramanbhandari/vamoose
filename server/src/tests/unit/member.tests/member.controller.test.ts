import { updateTripMemberHandler } from '../../../controllers/member.controller.ts';
import prisma from '../../../config/prismaClient.ts';
import { Request, Response } from 'express';

jest.mock('../../../config/prismaClient', () => ({
  __esModule: true,
  default: {
    tripMember: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Trip Member API - Update Role', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRes = {
      status: statusMock,
      json: jsonMock,
    } as Partial<Response>;
  });

  const setupRequest = (overrides = {}) => ({
    userId: 'creator-id',
    params: { tripId: '1', userId: 'member-id' },
    body: { role: 'admin' },
    ...overrides,
  });

  it('should return 401 if user is not authenticated', async () => {
    mockReq = setupRequest({ userId: undefined });

    await updateTripMemberHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized Request' });
  });

  it('should return 400 if tripId is invalid', async () => {
    mockReq = setupRequest({
      params: { tripId: 'invalid', userId: 'member-id' },
    });

    await updateTripMemberHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid trip ID' });
  });

  it.each([
    { role: undefined, expectedMessage: 'Invalid role update request' },
    { role: 'superadmin', expectedMessage: 'Invalid role update request' },
  ])(
    'should return 400 if role is missing or invalid',
    async ({ role, expectedMessage }) => {
      mockReq = setupRequest({ body: { role } });

      await updateTripMemberHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );

  // ✅ NEW TEST CASE: Should return 403 if requester is not a member of the trip
  it('should return 403 if requester is not a member of the trip', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(null);

    await updateTripMemberHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You are not a member of this trip',
    });
  });

  it('should update a member role successfully as a creator', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        userId: 'creator-id',
        tripId: 1,
        role: 'creator',
      })
      .mockResolvedValueOnce({
        userId: 'member-id',
        tripId: 1,
        role: 'member',
      });

    (prisma.tripMember.update as jest.Mock).mockResolvedValue({
      userId: 'member-id',
      tripId: 1,
      role: 'admin',
    });

    await updateTripMemberHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Member role updated successfully',
      member: { userId: 'member-id', tripId: 1, role: 'admin' },
    });
  });

  it('should return 500 on a database error', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database failure'),
    );

    await updateTripMemberHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'An unexpected database error occurred.',
    });
  });
});
