import {
  createPollHandler,
  deletePollHandler,
  batchDeletePollsHandler,
} from '@/controllers/poll.controller.js';
import prisma from '@/config/prismaClient.js';
import { Request, Response } from 'express';

jest.mock('../../../config/prismaClient', () => ({
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
    },
    pollOption: {
      createMany: jest.fn(),
    },
  },
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
