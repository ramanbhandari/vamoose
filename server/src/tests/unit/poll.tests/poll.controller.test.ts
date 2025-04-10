import {
  createPollHandler,
  deletePollHandler,
  batchDeletePollsHandler,
  getAllPollsForTripHandler,
  completePollHandler,
} from '@/controllers/poll.controller.js';
import { PollStatus } from '@/interfaces/enums.js';
import prisma from '@/configs/prismaClient.js';
import { Request, Response } from 'express';

jest.mock('@/configs/prismaClient.js', () => ({
  __esModule: true,
  default: {
    tripMember: {
      findUnique: jest.fn(),
    },
    poll: {
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    pollOption: {
      createMany: jest.fn(),
    },
  },
}));

// Mock out the stuff needed for notifications
jest.mock('@/models/trip.model.js', () => ({
  fetchSingleTrip: jest.fn().mockResolvedValue({ name: 'tripName' }),
}));
jest.mock('@/utils/notificationHandlers.js', () => ({
  notifyTripMembersExceptInitiator: jest.fn().mockResolvedValue(undefined),
  notifySpecificTripMembers: jest.fn().mockResolvedValue(undefined),
  notifyTripMembers: jest.fn().mockResolvedValue(undefined),
  notifyIndividual: jest.fn().mockResolvedValue(undefined),
  notifyIndividuals: jest.fn().mockResolvedValue(undefined),
  notifyTripAdmins: jest.fn().mockResolvedValue(undefined),
  notifyTripMembersExcept: jest.fn().mockResolvedValue(undefined),
}));

describe('Poll Controller - Create Poll', () => {
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
    params: { tripId: '1' },
    body: {
      question: 'Where should we go?',
      expiresAt: '2025-05-01T12:00:00Z',
      options: ['Option 1', 'Option 2'],
    },
    ...overrides,
  });

  it('should return 401 if user is not authenticated', async () => {
    mockReq = setupRequest({ userId: undefined });

    await createPollHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized Request' });
  });

  it('should return 400 if tripId is invalid', async () => {
    mockReq = setupRequest({ params: { tripId: 'invalid' } });

    await createPollHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid trip ID' });
  });

  it('should return 403 if user is not a member of the trip', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(null);

    await createPollHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You are not a member of this trip: 1',
    });
  });

  it('should return 201 and create a poll if user is authorized', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      role: 'creator',
      user: { fullname: 'creator' },
    });

    (prisma.poll.create as jest.Mock).mockResolvedValue({
      id: 1,
      question: 'Where should we go?',
      status: 'ACTIVE',
    });

    (prisma.pollOption.createMany as jest.Mock).mockResolvedValue({
      count: 2,
    });

    await createPollHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Poll created successfully',
      poll: { id: 1, question: 'Where should we go?', status: 'ACTIVE' },
    });
  });
});

describe('Poll Deletion', () => {
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
    params: { tripId: '1', pollId: '10' },
    ...overrides,
  });

  it('should return 401 if user is not authenticated', async () => {
    mockReq = setupRequest({ userId: undefined });

    await deletePollHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized Request' });
  });

  it('should return 400 for invalid tripId or pollId', async () => {
    mockReq = setupRequest({ params: { tripId: 'invalid', pollId: '10' } });

    await deletePollHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Trip ID and Poll ID must be valid numbers',
    });
  });

  it('should return 404 if poll is not found', async () => {
    mockReq = setupRequest();
    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.poll.findUnique as jest.Mock).mockResolvedValue(null);

    await deletePollHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Poll not found in this trip',
    });
  });

  it('should delete the poll if user has permissions', async () => {
    mockReq = setupRequest();
    const deletedPoll = {
      id: 10,
      tripId: 1,
      question: 'What activity should we do on the trip?',
      status: 'ACTIVE',
      expiresAt: '2026-01-01T05:59:59.000Z',
      createdById: 'test-user-id',
      createdAt: '2025-03-05T05:46:52.476Z',
      completedAt: null,
      winnerId: null,
    };
    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.poll.findUnique as jest.Mock).mockResolvedValue({
      id: 10,
      tripId: 1,
      createdById: 'test-user-id',
    });
    (prisma.poll.delete as jest.Mock).mockResolvedValue(deletedPoll);

    await deletePollHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Poll deleted successfully',
      deletedPoll,
    });
  });
});

describe('Batch Delete Polls Handler', () => {
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
    params: { tripId: '1' },
    body: { pollIds: [1, 2, 3] },
    ...overrides,
  });

  it('should return 200 and delete polls successfully', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      role: 'creator',
    });

    (prisma.poll.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

    await batchDeletePollsHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Polls deleted successfully',
      deletedCount: 3,
    });
  });

  it('should return 404 if no polls were deleted', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      role: 'member',
    });

    (prisma.poll.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

    await batchDeletePollsHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'No valid polls found to delete, or you are not authorized',
    });
  });
});

describe('Get All Polls For Trip Controller', () => {
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

  it('should return 200 with poll data including a TIE', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    const mockPollList = [
      {
        id: 1,
        question: 'Where to go?',
        status: PollStatus.TIE,
        expiresAt: new Date(),
        createdAt: new Date(),
        completedAt: null,
        createdBy: {
          id: 'creator-id',
          email: 'creator@test.com',
          fullName: 'Creator Name',
        },
        winner: null,
        options: [
          {
            id: 1,
            option: 'Beach',
            votes: [{ user: { id: 'user-1', email: 'user1@test.com' } }],
          },
          {
            id: 2,
            option: 'Mountains',
            votes: [{ user: { id: 'user-2', email: 'user2@test.com' } }],
          },
        ],
      },
    ];
    const mockResponse = [
      {
        id: 1,
        question: 'Where to go?',
        status: PollStatus.TIE,
        expiresAt: expect.any(Date),
        createdAt: expect.any(Date),
        completedAt: null,
        createdBy: {
          id: 'creator-id',
          email: 'creator@test.com',
          fullName: 'Creator Name',
        },
        winner: {
          options: [
            { id: 1, option: 'Beach', voteCount: 1 },
            { id: 2, option: 'Mountains', voteCount: 1 },
          ],
        },
        totalVotes: 2,
        options: [
          {
            id: 1,
            option: 'Beach',
            percentage: 50,
            voteCount: 1,
            voters: [{ id: 'user-1', email: 'user1@test.com' }],
          },
          {
            id: 2,
            option: 'Mountains',
            percentage: 50,
            voteCount: 1,
            voters: [{ id: 'user-2', email: 'user2@test.com' }],
          },
        ],
      },
    ];

    (prisma.poll.findMany as jest.Mock).mockResolvedValue(mockPollList);

    await getAllPollsForTripHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      polls: mockResponse,
    });
  });

  it('should return 200 with poll data including a WINNER', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    const mockPollList = [
      {
        id: 1,
        question: 'Where to go?',
        status: PollStatus.COMPLETED,
        expiresAt: new Date(),
        createdAt: new Date(),
        completedAt: new Date(),
        createdBy: {
          id: 'creator-id',
          email: 'creator@test.com',
          fullName: 'Creator Name',
        },
        winner: {
          id: 10,
          option: 'Beach',
        },
        options: [
          {
            id: 10,
            option: 'Beach',
            votes: [{ user: { id: 'user-1', email: 'user1@test.com' } }],
          },
          {
            id: 11,
            option: 'Mountains',
            votes: [],
          },
        ],
      },
    ];

    const mockResponse = [
      {
        id: 1,
        question: 'Where to go?',
        status: PollStatus.COMPLETED,
        expiresAt: expect.any(Date),
        createdAt: expect.any(Date),
        completedAt: expect.any(Date),
        createdBy: {
          id: 'creator-id',
          email: 'creator@test.com',
          fullName: 'Creator Name',
        },
        winner: {
          id: 10,
          option: 'Beach',
          voteCount: 1,
        },
        totalVotes: 1,
        options: [
          {
            id: 10,
            option: 'Beach',
            percentage: 100,
            voteCount: 1,
            voters: [{ id: 'user-1', email: 'user1@test.com' }],
          },
          {
            id: 11,
            option: 'Mountains',
            percentage: 0,
            voteCount: 0,
            voters: [],
          },
        ],
      },
    ];

    (prisma.poll.findMany as jest.Mock).mockResolvedValue(mockPollList);

    await getAllPollsForTripHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      polls: mockResponse,
    });
  });

  it.each([
    {
      scenario: 'User is not authenticated',
      overrides: { userId: undefined },
      expectedStatus: 401,
      expectedMessage: 'Unauthorized Request',
    },
    {
      scenario: 'Invalid trip ID',
      overrides: { params: { tripId: 'invalid' } },
      expectedStatus: 400,
      expectedMessage: 'Invalid trip ID',
    },
    {
      scenario: 'User is not a member of the trip',
      setupMocks: () => {
        (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(null);
      },
      expectedStatus: 403,
      expectedMessage: 'You are not a member of this trip: 1',
    },
    {
      scenario: 'Error fetching polls',
      setupMocks: () => {
        (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
        (prisma.poll.findMany as jest.Mock).mockRejectedValue(
          new Error('DB error'),
        );
      },
      expectedStatus: 500,
      expectedMessage: 'An unexpected database error occurred.',
    },
  ])(
    '[$scenario] → should return $expectedStatus',
    async ({ overrides, setupMocks, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(overrides);

      if (setupMocks) setupMocks();

      await getAllPollsForTripHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );
});

describe('Complete Poll Handler', () => {
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
    params: { tripId: '1', pollId: '1' },
    ...overrides,
  });

  it('should mark a poll as completed with a winner', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      role: 'creator',
    });

    (prisma.poll.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      tripId: 1,
      createdById: 'creator-id',
      options: [
        { id: 10, option: 'Option A', votes: [{}, {}, {}] },
        { id: 11, option: 'Option B', votes: [{}] },
      ],
    });

    (prisma.poll.update as jest.Mock).mockResolvedValue({
      id: 1,
      status: PollStatus.COMPLETED,
      completedAt: new Date(),
      winnerId: 10,
    });

    await completePollHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Poll marked as completed successfully',
      poll: {
        id: 1,
        status: PollStatus.COMPLETED,
        completedAt: expect.any(Date),
        winnerId: 10,
      },
      status: PollStatus.COMPLETED,
      winnerId: 10,
      tiedOptions: [],
    });
  });

  it('should mark a poll as completed with a tie status', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      role: 'creator',
    });

    (prisma.poll.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      tripId: 1,
      createdById: 'creator-id',
      options: [
        { id: 10, option: 'Option A', votes: [{}, {}] },
        { id: 11, option: 'Option B', votes: [{}, {}] },
      ],
    });

    (prisma.poll.update as jest.Mock).mockResolvedValue({
      id: 1,
      status: PollStatus.TIE,
      completedAt: new Date(),
      winnerId: null,
    });

    await completePollHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Poll marked as completed successfully',
      poll: {
        id: 1,
        status: PollStatus.TIE,
        completedAt: expect.any(Date),
        winnerId: null,
      },
      status: PollStatus.TIE,
      winnerId: null,
      tiedOptions: [
        { id: 10, option: 'Option A', voteCount: 2 },
        { id: 11, option: 'Option B', voteCount: 2 },
      ],
    });
  });

  it.each([
    {
      scenario: 'User is not authenticated',
      overrides: { userId: undefined },
      expectedStatus: 401,
      expectedMessage: 'Unauthorized Request',
    },
    {
      scenario: 'Invalid trip ID',
      overrides: { params: { tripId: 'invalid', pollId: '1' } },
      expectedStatus: 400,
      expectedMessage: 'Invalid trip ID',
    },
    {
      scenario: 'Invalid poll ID',
      overrides: { params: { tripId: '1', pollId: 'invalid' } },
      expectedStatus: 400,
      expectedMessage: 'Invalid poll ID',
    },
    {
      scenario: 'User is not a member of the trip',
      setupMocks: () => {
        (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(null);
      },
      expectedStatus: 403,
      expectedMessage: 'You are not a member of this trip: 1',
    },
    {
      scenario: 'Poll not found in this trip',
      setupMocks: () => {
        (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
        (prisma.poll.findUnique as jest.Mock).mockResolvedValue(null);
      },
      expectedStatus: 404,
      expectedMessage: 'Poll not found in this trip',
    },
    {
      scenario: 'User is not authorized to complete the poll',
      setupMocks: () => {
        (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
          role: 'member',
        });
        (prisma.poll.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          tripId: 1,
          createdById: 'other-user-id',
          options: [],
        });
      },
      expectedStatus: 403,
      expectedMessage:
        'Only the poll creator, an admin, or the trip creator can complete this poll',
    },
  ])(
    '[$scenario] → should return $expectedStatus',
    async ({ overrides, setupMocks, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(overrides);

      if (setupMocks) setupMocks();

      await completePollHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );
});
