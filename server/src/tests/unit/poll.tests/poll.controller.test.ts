import { createPollHandler } from '@/controllers/poll.controller.js';
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
