import {
  createInvite,
  validateInvite,
  acceptInvite,
  rejectInvite,
  deleteInvite,
  checkInvite,
} from '@/controllers/invitee.controller.js';
import prisma from '@/config/prismaClient.js';
import { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

jest.mock('@/config/prismaClient.js', () => ({
  __esModule: true,
  default: {
    trip: { findUnique: jest.fn() },
    tripInvitee: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    tripMember: { findUnique: jest.fn(), create: jest.fn() },
  },
}));

describe('Create Invite Handler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = { status: statusMock, json: jsonMock } as Partial<Response>;
  });

  const setupRequest = (
    userIdOverride = {},
    bodyOverrides = {},
    paramOverride = {},
  ) => ({
    userId: '1',
    ...userIdOverride,
    body: {
      email: 'test@example.com',
      ...bodyOverrides,
    },
    params: {
      tripId: '1',
      ...paramOverride,
    },
  });

  it.each([
    {
      userIdOverride: { userId: undefined },
      bodyOverrides: {},
      expectedStatus: 401,
      expectedMessage: 'Unauthorized Request',
    },
    {
      userIdOverride: {},
      bodyOverrides: { email: '' },
      expectedStatus: 400,
      expectedMessage: 'Missing required fields',
    },
    {
      userIdOverride: {},
      bodyOverrides: {},
      paramOverride: { tripId: 'invalid' },
      expectedStatus: 400,
      expectedMessage: 'Invalid trip ID',
    },
  ])(
    'should return $expectedStatus when request body is $bodyOverrides',
    async ({
      userIdOverride,
      bodyOverrides,
      paramOverride,
      expectedStatus,
      expectedMessage,
    }) => {
      mockReq = setupRequest(userIdOverride, bodyOverrides, paramOverride);
      await createInvite(mockReq as Request, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );

  it('should return 404 if trip does not exist', async () => {
    mockReq = setupRequest();
    (prisma.trip.findUnique as jest.Mock).mockResolvedValue(null);

    await createInvite(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Trip not found' });
  });

  it('should return 403 if user is not an admin', async () => {
    mockReq = setupRequest();
    (prisma.trip.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      createdBy: '1',
      members: [{ userId: '2', role: 'member' }],
    });

    await createInvite(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Only admin can send invites.',
    });
  });

  it('should return 400 if user is already a member', async () => {
    mockReq = setupRequest();
    (prisma.trip.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      members: [{ userId: '1', role: 'creator' }],
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '2' });
    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      userId: '2',
      tripId: 1,
    });

    await createInvite(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'User is already a member of this trip.',
    });
  });

  it('should return 400 if invite already exists', async () => {
    mockReq = setupRequest();
    (prisma.trip.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      members: [{ userId: '1', role: 'creator' }],
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue({
      inviteToken: 'existing-token',
      status: 'pending',
    });

    await createInvite(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Invite already exists.',
      inviteUrl: `${process.env.FRONTEND_URL}/invite/existing-token`,
    });
  });

  it('should create an invite successfully', async () => {
    mockReq = setupRequest();
    const invite = {
      inviteToken: 'valid-token',
      email: 'test@example.com',
      tripId: 1,
      status: 'pending',
    };
    (prisma.tripInvitee.create as jest.Mock).mockResolvedValue(invite);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.trip.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      members: [{ userId: '1', role: 'creator' }],
    });

    await createInvite(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      inviteUrl: `${process.env.FRONTEND_URL}/invite/${invite.inviteToken}`,
    });
  });
});

describe('Validate Invite Handler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = { status: statusMock, json: jsonMock } as Partial<Response>;
  });

  function setupRequest(overrides = {}) {
    return {
      userId: '1',
      params: { token: 'token' },
      ...overrides,
    };
  }

  it.each([
    {
      overrides: { userId: undefined },
      expectedStatus: 401,
      expectedMessage: 'Unauthorized Request',
    },
    {
      overrides: { token: undefined },
      expectedStatus: 400,
      expectedMessage: 'Invite not found',
    },
  ])(
    'should return $expectedStatus when token is $token',
    async ({ overrides, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(overrides);
      (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue(null);

      await validateInvite(mockReq as Request, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );

  it('should return 403 if user email does not match with invite', async () => {
    mockReq = setupRequest();
    const inviteData = {
      inviteToken: 'token',
      email: 'test@example.com',
      tripId: 1,
      invitedUserId: '2',
    };
    (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue(inviteData);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example1.com',
    });

    await validateInvite(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: `This invite is for ${inviteData.email}. Please log in with that email.`,
    });
  });

  it('should validate invite successfully', async () => {
    mockReq = setupRequest();
    const inviteData = {
      inviteToken: 'token',
      email: 'test@example.com',
      tripId: 1,
      invitedUserId: '2',
    };
    (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue(inviteData);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
    });
    (prisma.trip.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      members: [],
    });

    await validateInvite(mockReq as Request, mockRes as Response);

    expect(jsonMock).toHaveBeenCalledWith({ trip: { id: 1, members: [] } });
    expect(statusMock).toHaveBeenCalledWith(200);
  });
});

describe('Accept Invite Handler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = { status: statusMock, json: jsonMock } as Partial<Response>;
  });

  function setupRequest(overrides = {}) {
    return {
      userId: '1',
      params: { token: 'token' },
      ...overrides,
    };
  }

  it.each([
    {
      overrides: { userId: undefined },
      expectedStatus: 401,
      expectedMessage: 'Unauthorized Request',
    },
    {
      overrides: { token: undefined },
      expectedStatus: 400,
      expectedMessage: 'Invite not found',
    },
  ])(
    'should return $expectedStatus when token is $token',
    async ({ overrides, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(overrides);
      (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue(null);

      await acceptInvite(mockReq as Request, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );

  it('should return 403 if user email does not match with invite', async () => {
    mockReq = setupRequest();
    const invite = {
      inviteToken: 'token',
      email: 'test@example.com',
      tripId: 1,
      status: 'pending',
      invitedUserId: '1',
    };
    (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue(invite);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example1.com',
    });

    await acceptInvite(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: `This invite is for ${invite.email}. Please log in with that email.`,
    });
  });

  it('should return 400 if invite is already accepted', async () => {
    mockReq = setupRequest();
    const invite = {
      inviteToken: 'token',
      email: 'test@example.com',
      tripId: 1,
      status: 'accepted',
      invitedUserId: '1',
    };
    (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue(invite);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
    });

    await acceptInvite(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invite already accepted' });
  });

  it('should accept invite successfully', async () => {
    mockReq = setupRequest();
    const invite = {
      inviteToken: 'token',
      email: 'test@example.com',
      tripId: 1,
      status: 'pending',
      invitedUserId: '1',
    };
    (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue(invite);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
    });
    prisma.$transaction = jest.fn().mockResolvedValue([
      (prisma.tripMember.create as jest.Mock).mockResolvedValue({
        tripId: 1,
        userId: '1',
        role: 'member',
      }),
      (prisma.tripInvitee.update as jest.Mock).mockResolvedValue({
        ...invite,
        status: 'accepted',
      }),
    ]);

    await acceptInvite(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Invite accepted' });
  });
});

describe('Reject Invite Handler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = { status: statusMock, json: jsonMock } as Partial<Response>;
  });

  function setupRequest(overrides = {}) {
    return {
      userId: '1',
      params: { token: 'token' },
      ...overrides,
    };
  }

  it.each([
    {
      overrides: { userId: undefined },
      expectedStatus: 401,
      expectedMessage: 'Unauthorized Request',
    },
    {
      overrides: { token: undefined },
      expectedStatus: 400,
      expectedMessage: 'Invite not found',
    },
  ])(
    'should return $expectedStatus when token is $token',
    async ({ overrides, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(overrides);
      (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue(null);

      await rejectInvite(mockReq as Request, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );

  it('should return 403 if user email does not match with invite', async () => {
    mockReq = setupRequest();
    const invite = {
      inviteToken: 'token',
      email: 'test@example.com',
      tripId: 1,
      status: 'pending',
      invitedUserId: '1',
    };
    (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue(invite);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example1.com',
    });

    await rejectInvite(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: `This invite is for ${invite.email}. Please log in with that email.`,
    });
  });

  it('should return 400 if invite is not pending', async () => {
    mockReq = setupRequest();
    const invite = {
      inviteToken: 'token',
      email: 'test@example.com',
      tripId: 1,
      status: 'accepted',
      invitedUserId: '1',
    };
    (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue(invite);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
    });

    await rejectInvite(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invite not pending' });
  });

  it('should reject invite successfully', async () => {
    mockReq = setupRequest();
    const invite = {
      inviteToken: 'token',
      email: 'test@example.com',
      tripId: 1,
      status: 'pending',
      invitedUserId: '1',
    };
    (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue(invite);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
    });
    (prisma.tripInvitee.update as jest.Mock).mockResolvedValue({});

    await rejectInvite(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Invite rejected.' });
  });
});

describe('Delete Invite Handler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = { status: statusMock, json: jsonMock } as Partial<Response>;
  });

  function setupRequest(overrides = {}) {
    return {
      userId: '1',
      params: { token: 'token' },
      ...overrides,
    };
  }

  it.each([
    {
      overrides: { userId: undefined },
      expectedStatus: 401,
      expectedMessage: 'Unauthorized Request',
    },
    {
      overrides: { token: undefined },
      expectedStatus: 400,
      expectedMessage: 'Invite not found',
    },
  ])(
    'should return $expectedStatus when token is $token',
    async ({ overrides, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(overrides);
      (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue(null);

      await deleteInvite(mockReq as Request, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );

  it('should return 403 if user is not a admin', async () => {
    mockReq = setupRequest();
    const invite = {
      inviteToken: 'token',
      email: 'test@example.com',
      tripId: 1,
      status: 'pending',
      invitedUserId: '1',
    };
    (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue(invite);
    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      tripId: 1,
      userId: '1',
      role: 'member',
    });
    (prisma.tripInvitee.delete as jest.Mock).mockResolvedValue({});

    await deleteInvite(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Only admin can delete invites.',
    });
  });

  it('should delete invite successfully', async () => {
    mockReq = setupRequest();
    const invite = {
      inviteToken: 'token',
      email: 'test@example.com',
      tripId: 1,
      status: 'pending',
      invitedUserId: '1',
    };
    (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue(invite);
    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      tripId: 1,
      userId: '1',
      role: 'creator',
    });
    (prisma.tripInvitee.delete as jest.Mock).mockResolvedValue({});

    await deleteInvite(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Invite deleted successfully',
    });
  });
});

describe('Check Invite Handler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = { status: statusMock, json: jsonMock } as Partial<Response>;
  });

  function setupRequest(overrides = {}) {
    return {
      params: { token: 'token', ...overrides },
    };
  }

  // it.each([
  //   {
  //     overrides: { userId: undefined },
  //     expectedStatus: 401,
  //     expectedMessage: 'Unauthorized Request',
  //   },
  //   {
  //     overrides: { token: undefined },
  //     expectedStatus: 400,
  //     expectedMessage: 'Invite not found',
  //   },
  // ])(
  //   'should return $expectedStatus when token is $token',
  //   async ({ overrides, expectedStatus, expectedMessage }) => {
  //     mockReq = setupRequest(overrides);
  //     (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue(null);

  //     await deleteInvite(mockReq as Request, mockRes as Response);
  //     expect(statusMock).toHaveBeenCalledWith(expectedStatus);
  //     expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
  //   },
  // );

  it('should return 400 if invalid token', async () => {
    mockReq = setupRequest();
    (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue(null);

    await checkInvite(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invite not found' });
  });

  it('should return 400 if invite is not pending', async () => {
    mockReq = setupRequest();
    (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue({
      status: 'rejected',
    });

    await checkInvite(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invite not found' });
  });

  it('should return 200 with a valid token and invite is pending', async () => {
    mockReq = setupRequest();
    const inviteDetails = {
      inviter: 'Name',
      invited: 'test@test.com',
      destination: 'destination',
      from: '2025-03-08T00:00:00.000Z',
      to: '2025-03-15T00:00:00.000Z',
    };

    (prisma.tripInvitee.findUnique as jest.Mock).mockResolvedValue({
      status: 'pending',
      email: 'test@test.com',
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      fullName: 'Name',
    });
    (prisma.trip.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      destination: 'destination',
      startDate: '2025-03-08T00:00:00.000Z',
      endDate: '2025-03-15T00:00:00.000Z',
    });

    await checkInvite(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(inviteDetails);
  });
});
