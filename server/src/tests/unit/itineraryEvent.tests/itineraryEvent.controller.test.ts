import {
  createItineraryEventHandler,
  updateItineraryEventHandler,
} from '@/controllers/itineraryEvent.controller.js';
import prisma from '@/config/prismaClient.js';
import { Request, Response } from 'express';
import { DateTime } from 'luxon';
import { EventCategory } from '@/interfaces/enums.js';

jest.mock('@/config/prismaClient.js', () => ({
  __esModule: true,
  default: {
    tripMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    itineraryEvent: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('Create Itinerary Event Controller', () => {
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
    body: {
      title: 'Test Event',
      description: 'An event description',
      location: 'Event Location',
      startTime: '2025-03-15T14:00:00.000Z',
      endTime: '2025-03-15T16:00:00.000Z',
      category: 'ACTIVITY',
      assignedUserIds: ['user-1', 'user-2'],
      notes: [{ content: 'Remember to bring snacks' }],
    },
    ...overrides,
  });

  it('should create an itinerary event successfully', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.tripMember.findMany as jest.Mock).mockResolvedValue([
      { userId: 'user-1' },
      { userId: 'user-2' },
    ]);
    (prisma.itineraryEvent.create as jest.Mock).mockResolvedValue({
      id: 1,
      title: 'Test Event',
      description: 'An event description',
      location: 'Event Location',
      startTime: DateTime.fromISO('2025-03-15T14:00:00.000Z').toJSDate(),
      endTime: DateTime.fromISO('2025-03-15T16:00:00.000Z').toJSDate(),
      category: EventCategory.ACTIVITY,
      createdById: 'test-user-id',
      tripId: 1,
    });

    await createItineraryEventHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Itinerary event created successfully',
      itineraryEvent: expect.objectContaining({
        id: 1,
        title: 'Test Event',
        description: 'An event description',
        location: 'Event Location',
        category: 'ACTIVITY',
      }),
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
  ])(
    '[$scenario] → should return $expectedStatus',
    async ({ overrides, setupMocks, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(overrides);

      if (setupMocks) setupMocks();

      await createItineraryEventHandler(
        mockReq as Request,
        mockRes as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );

  it('should return 400 if assignedUserIds are not valid members of the trip', async () => {
    mockReq = setupRequest({
      body: {
        ...setupRequest().body,
        assignedUserIds: ['invalid-user-1', 'invalid-user-2'],
      },
    });

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.tripMember.findMany as jest.Mock).mockResolvedValue([]);

    await createItineraryEventHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error:
        'The following users are not members of this trip: invalid-user-1, invalid-user-2',
    });
  });
});

describe('Update Itinerary Event Controller', () => {
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
    params: { tripId: '1', eventId: '1' },
    body: {
      title: 'Test Event',
      description: 'An event description',
      location: 'Event Location',
      startTime: '2025-03-15T14:00:00.000Z',
      endTime: '2025-03-15T16:00:00.000Z',
      category: 'ACTIVITY',
    },
    ...overrides,
  });

  it('should create an itinerary event successfully', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
      createdById: 'test-user-id',
    });
    (prisma.itineraryEvent.update as jest.Mock).mockResolvedValue({
      id: 1,
      title: 'Test Update Event',
      description: 'An event description',
      location: 'Event Location',
      startTime: DateTime.fromISO('2025-03-15T14:00:00.000Z').toJSDate(),
      endTime: DateTime.fromISO('2025-03-15T16:00:00.000Z').toJSDate(),
      category: EventCategory.ACTIVITY,
      createdById: 'test-user-id',
      tripId: 1,
    });

    await updateItineraryEventHandler(mockReq as Request, mockRes as Response);

    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Itinerary event updated successfully',
      itineraryEvent: expect.objectContaining({
        id: 1,
        title: 'Test Update Event',
        description: 'An event description',
        location: 'Event Location',
        startTime: DateTime.fromISO('2025-03-15T14:00:00.000Z').toJSDate(),
        endTime: DateTime.fromISO('2025-03-15T16:00:00.000Z').toJSDate(),
        category: EventCategory.ACTIVITY,
        createdById: 'test-user-id',
        tripId: 1,
      }),
    });
    expect(statusMock).toHaveBeenCalledWith(201);

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
      overrides: { params: { tripId: 'invalid', eventId: '1' } },
      expectedStatus: 400,
      expectedMessage: 'Invalid trip ID',
    },
    {
      scenario: 'Invalid event ID',
      overrides: { params: { tripId: '1', eventId: 'invalid' } },
      expectedStatus: 400,
      expectedMessage: 'Invalid event ID',
    },
    {
      scenario: 'User is not a member of the trip',
      setupMocks: () => {
        (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(null);
      },
      expectedStatus: 403,
      expectedMessage: 'You are not a member of this trip: 1',
    },
  ])(
    '[$scenario] → should return $expectedStatus',
    async ({ overrides, setupMocks, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(overrides);

      if (setupMocks) setupMocks();

      await updateItineraryEventHandler(
        mockReq as Request,
        mockRes as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );

  it('should return 404 if not valid event of the trip', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue(null);

    await updateItineraryEventHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error:
        'Event not found',
    });
  });

  it('should return 403 if user is not the creator of an event or creator or admin of the trip', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
      createdById: '2',
    });

    await updateItineraryEventHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error:
        'Only the creator or an admin can update the event details.',
    });
  });


});
