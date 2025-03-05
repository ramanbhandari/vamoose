import { castVoteHandler } from '@/controllers/pollVote.controller.js';
import prisma from '@/config/prismaClient.js';
import { Request, Response } from 'express';
import { DateTime, Zone } from 'luxon';

jest.mock('@/config/prismaClient.js', () => ({
  __esModule: true,
  default: {
    tripMember: {
      findUnique: jest.fn(),
    },
    poll: {
      findUnique: jest.fn(),
    },
    pollOption: {
      findUnique: jest.fn(),
    },
    vote: {
      upsert: jest.fn(),
    },
  },
}));

describe('Cast Vote Controller', () => {
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
    userId: 'voter-id',
    params: { tripId: '1', pollId: '1' },
    body: { pollOptionId: 10 },
    ...overrides,
  });

  it('should cast a vote successfully', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.poll.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      tripId: 1,
      status: 'ACTIVE',
      expiresAt: DateTime.now().plus({ days: 1 }).toJSDate(),
    });
    (prisma.pollOption.findUnique as jest.Mock).mockResolvedValue({
      id: 10,
      pollId: 1,
    });
    (prisma.vote.upsert as jest.Mock).mockResolvedValue({
      id: 1,
      pollOptionId: 10,
      userId: 'voter-id',
      votedAt: DateTime.fromISO('2025-03-05T11:24:32.847Z').toJSDate(),
    });

    await castVoteHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Vote cast successfully',
      vote: {
        id: 1,
        pollOptionId: 10,
        userId: 'voter-id',
        votedAt: expect.any(Date),
      },
    });
    expect(prisma.vote.upsert).toHaveBeenCalledWith({
      where: {
        pollId_userId: { pollId: 1, userId: 'voter-id' },
      },
      create: {
        pollOptionId: 10,
        userId: 'voter-id',
        pollId: 1,
      },
      update: {
        pollOptionId: 10,
        votedAt: expect.any(Date),
      },
    });
  });

  it.each([
    {
      scenario: 'Unauthorized Request',
      overrides: { userId: undefined },
      prismaMocks: {
        findTripMember: undefined,
        findPoll: undefined,
        findPollOption: undefined,
      },
      expectedStatus: 401,
      expectedMessage: 'Unauthorized Request',
    },
    {
      scenario: 'Not a trip member',
      overrides: {},
      prismaMocks: {
        findTripMember: null,
        findPoll: undefined,
        findPollOption: undefined,
      },
      expectedStatus: 403,
      expectedMessage: 'You are not a member of this trip',
    },
    {
      scenario: 'Poll not found',
      prismaMocks: {
        findTripMember: true,
        findPoll: null,
        findPollOption: null,
      },
      expectedStatus: 404,
      expectedMessage: 'Poll not found in this trip',
    },
    {
      scenario: 'Poll is not active',
      prismaMocks: {
        findTripMember: true,
        findPoll: { id: 1, tripId: 1, status: 'COMPLETED' },
        findPollOption: null,
      },
      expectedStatus: 403,
      expectedMessage: 'You cannot vote on a completed poll',
    },
    {
      scenario: 'Poll has expired',
      prismaMocks: {
        findTripMember: true,
        findPoll: {
          id: 1,
          tripId: 1,
          status: 'ACTIVE',
          expiresAt: DateTime.now().minus({ days: 1 }).toJSDate(),
        },
        findPollOption: null,
      },
      expectedStatus: 403,
      expectedMessage: 'Poll has expired and cannot accept votes',
    },
    {
      scenario: 'Invalid poll option',
      prismaMocks: {
        findTripMember: true,
        findPoll: {
          id: 1,
          tripId: 1,
          status: 'ACTIVE',
          expiresAt: DateTime.now().plus({ days: 1 }).toJSDate(),
        },
        findPollOption: null,
      },
      expectedStatus: 400,
      expectedMessage:
        'Invalid poll option. Please select a valid option for this poll.',
    },
  ])(
    'should handle failure case: $scenario',
    async ({ overrides, prismaMocks, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(overrides);

      (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(
        prismaMocks?.findTripMember,
      );
      (prisma.poll.findUnique as jest.Mock).mockResolvedValue(
        prismaMocks?.findPoll ?? { id: 1, status: 'ACTIVE' },
      );
      (prisma.pollOption.findUnique as jest.Mock).mockResolvedValue(
        prismaMocks?.findPollOption,
      );

      await castVoteHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );

  it('should handle unexpected errors', async () => {
    mockReq = setupRequest();
    (prisma.tripMember.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database error'),
    );

    await castVoteHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'An unexpected database error occurred.',
    });
  });
});
