import {
  updateTripMemberHandler,
  getTripMemberHandler,
  getTripMembersHandler,
  leaveTripHandler,
  removeTripMemberHandler,
  batchRemoveTripMembersHandler,
} from '../../../controllers/member.controller.ts';
import prisma from '../../../config/prismaClient.ts';
import { Request, Response } from 'express';

jest.mock('../../../config/prismaClient', () => ({
  __esModule: true,
  default: {
    tripMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
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

describe('Trip Member API - Fetch Members', () => {
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
    userId: 'test-user-id',
    params: { tripId: '1' },
    ...overrides,
  });

  it('should return a single trip member successfully if requester is a member', async () => {
    mockReq = setupRequest({ params: { tripId: '1', userId: '1' } });

    // Mock trip membership check
    (prisma.tripMember.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        userId: 'test-user-id',
        tripId: 1,
        role: 'member',
      }) // Requester is a member
      .mockResolvedValueOnce({ userId: '1', tripId: 1, role: 'admin' }); // Requested user exists

    await getTripMemberHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      member: { userId: '1', tripId: 1, role: 'admin' },
    });
  });

  it('should return 403 if requester is not a member of the trip', async () => {
    mockReq = setupRequest({ params: { tripId: '1', userId: '1' } });

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValueOnce(null); // Requester is NOT a member

    await getTripMemberHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You are not a member of this trip',
    });
  });

  it('should return all members of a trip successfully if requester is a member', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      userId: 'test-user-id',
      tripId: 1,
      role: 'member',
    });

    const fakeMembers = [
      { userId: '1', role: 'admin' },
      { userId: '2', role: 'member' },
    ];

    (prisma.tripMember.findMany as jest.Mock).mockResolvedValue(fakeMembers);

    await getTripMembersHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ members: fakeMembers });
  });

  it('should return 403 if requester is not a member of the trip', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(null); // Requester is NOT a member

    await getTripMembersHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You are not a member of this trip',
    });
  });

  it('should return 404 if a trip member is not found', async () => {
    mockReq = setupRequest({ params: { tripId: '1', userId: '999' } });

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValueOnce({
      userId: 'test-user-id',
      tripId: 1,
      role: 'member',
    }); // Requester is a member
    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValueOnce(null); // Requested member not found

    await getTripMemberHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Trip member not found' });
  });
});

describe('Trip Member API - Leave Trip', () => {
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
    userId: 'user-id',
    params: { tripId: '1' },
    ...overrides,
  });

  it('should allow a member to leave the trip', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      userId: 'user-id',
      tripId: 1,
      role: 'member',
    });

    (prisma.tripMember.delete as jest.Mock).mockResolvedValue({});

    await leaveTripHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'You have left the trip successfully',
    });
  });

  it('should prevent the creator from leaving', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      userId: 'creator-id',
      tripId: 1,
      role: 'creator',
    });

    await leaveTripHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Creators cannot leave a trip. Delete the trip instead.',
    });
  });

  it('should return 404 if user is not in the trip', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(null);

    await leaveTripHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You are not a member of this trip',
    });
  });

  it('should return 400 for invalid trip ID', async () => {
    mockReq = setupRequest({ params: { tripId: 'invalid' } });

    await leaveTripHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid trip ID' });
  });

  it('should return 500 on a database error', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database error'),
    );

    await leaveTripHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'An unexpected database error occurred.',
    });
  });
});

describe('Trip Member API - Remove Member', () => {
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
    userId: 'admin-id', // Default requester is an admin
    params: { tripId: '1', userId: 'member-id' },
    ...overrides,
  });

  it('should return 401 if user is not authenticated', async () => {
    mockReq = setupRequest({ userId: undefined });

    await removeTripMemberHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized Request' });
  });

  it('should return 400 if trip ID is invalid', async () => {
    mockReq = setupRequest({
      params: { tripId: 'invalid', userId: 'member-id' },
    });

    await removeTripMemberHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid trip ID' });
  });

  it('should return 400 if member user ID is missing', async () => {
    mockReq = setupRequest({ params: { tripId: '1', userId: undefined } });

    await removeTripMemberHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Member user ID is required',
    });
  });

  it('should return 403 if requester is not a member of the trip', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(null);

    await removeTripMemberHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You are not a member of this trip',
    });
  });

  it('should return 404 if target member does not exist', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock)
      .mockResolvedValueOnce({ userId: 'admin-id', tripId: 1, role: 'admin' }) // Requester
      .mockResolvedValueOnce(null); // Target member not found

    await removeTripMemberHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Member not found in this trip',
    });
  });

  it('should return 403 if requester is not an admin or creator', async () => {
    mockReq = setupRequest({ userId: 'member-id' });

    (prisma.tripMember.findUnique as jest.Mock)
      .mockResolvedValueOnce({ userId: 'member-id', tripId: 1, role: 'member' }) // Requester is a member
      .mockResolvedValueOnce({
        userId: 'target-id',
        tripId: 1,
        role: 'member',
      }); // Target is a member

    await removeTripMemberHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Only the creator or an admin can remove members',
    });
  });

  it('should return 403 if an admin tries to remove another admin', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock)
      .mockResolvedValueOnce({ userId: 'admin-id', tripId: 1, role: 'admin' }) // Requester
      .mockResolvedValueOnce({
        userId: 'another-admin',
        tripId: 1,
        role: 'admin',
      }); // Target is an admin

    await removeTripMemberHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Admins can only remove regular members',
    });
  });

  it('should return 403 if trying to remove the creator', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock)
      .mockResolvedValueOnce({ userId: 'admin-id', tripId: 1, role: 'admin' }) // Requester is an admin
      .mockResolvedValueOnce({
        userId: 'creator-id',
        tripId: 1,
        role: 'creator',
      }); // Target is the creator

    await removeTripMemberHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'The creator cannot be removed from the trip',
    });
  });

  it('should return 403 if trying to remove the last member', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock)
      .mockResolvedValueOnce({ userId: 'admin-id', tripId: 1, role: 'admin' }) // Requester
      .mockResolvedValueOnce({
        userId: 'target-id',
        tripId: 1,
        role: 'member',
      }); // Target is a member
    (prisma.tripMember.count as jest.Mock).mockResolvedValue(1);

    await removeTripMemberHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You cannot remove the last member of the trip',
    });
  });

  it('should successfully remove a member if all conditions are met', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock)
      .mockResolvedValueOnce({ userId: 'admin-id', tripId: 1, role: 'admin' }) // Requester
      .mockResolvedValueOnce({
        userId: 'target-id',
        tripId: 1,
        role: 'member',
      }); // Target is a member
    (prisma.tripMember.count as jest.Mock).mockResolvedValue(2);

    (prisma.tripMember.delete as jest.Mock).mockResolvedValue({
      userId: 'target-id',
      tripId: 1,
    });

    await removeTripMemberHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Member removed successfully',
    });
  });

  it('should return 500 if a database error occurs', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database error'),
    );

    await removeTripMemberHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'An unexpected database error occurred.',
    });
  });
});

describe('Trip Member API - Batch Remove Members', () => {
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
    userId: 'admin-id',
    params: { tripId: '1' },
    body: { memberUserIds: ['member1', 'member2'] },
    ...overrides,
  });

  it('should return 401 if user is not authenticated', async () => {
    mockReq = setupRequest({ userId: undefined });

    await batchRemoveTripMembersHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized Request' });
  });

  it('should return 400 if trip ID is invalid', async () => {
    mockReq = setupRequest({ params: { tripId: 'invalid' } });

    await batchRemoveTripMembersHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid trip ID' });
  });

  it('should return 400 if memberUserIds is not an array', async () => {
    mockReq = setupRequest({ body: { memberUserIds: 'invalid' } });

    await batchRemoveTripMembersHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'memberUserIds must be a non-empty array',
    });
  });

  it('should return 403 if requester is not a trip member', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(null);

    await batchRemoveTripMembersHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You are not a member of this trip',
    });
  });

  it('should return 404 if one or more members do not exist in the trip', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValueOnce({
      role: 'admin',
    });
    (prisma.tripMember.findMany as jest.Mock).mockResolvedValue([]);

    await batchRemoveTripMembersHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'No valid members found to remove from the trip',
      }),
    );
  });

  it('should return 403 if admin tries to remove another admin or creator', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValueOnce({
      role: 'admin',
    });
    (prisma.tripMember.findMany as jest.Mock).mockResolvedValue([
      { userId: 'admin2', role: 'admin' },
      { userId: 'member2', role: 'member' },
    ]);

    await batchRemoveTripMembersHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Admins can only remove regular members',
    });
  });

  it('should return 403 if the creator is being removed', async () => {
    mockReq = setupRequest({ body: { memberUserIds: ['creator-id'] } });

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValueOnce({
      role: 'creator',
    });
    (prisma.tripMember.findMany as jest.Mock).mockResolvedValue([
      { userId: 'creator-id', role: 'creator' },
    ]);

    await batchRemoveTripMembersHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'The creator cannot be removed from the trip',
    });
  });

  it('should successfully remove multiple members', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValueOnce({
      role: 'creator',
    });
    (prisma.tripMember.findMany as jest.Mock).mockResolvedValue([
      { userId: 'member1', role: 'member' },
      { userId: 'member2', role: 'member' },
    ]);
    (prisma.tripMember.count as jest.Mock).mockResolvedValue(3);
    (prisma.tripMember.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });

    await batchRemoveTripMembersHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Batch removal completed',
        removedMembers: ['member1', 'member2'],
        ignoredMembers: [],
      }),
    );
  });
});
