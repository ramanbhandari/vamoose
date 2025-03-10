import {
  createItineraryEventHandler,
  getAllItineraryEventsForTripHandler,
  getItineraryEventByIdHandler,
  deleteItineraryEventHandler,
  batchDeleteItineraryEventsHandler,
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
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
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

describe('Get All Itinerary Events Controller', () => {
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
    query: {
      category: 'ACTIVITY',
      startTime: '2025-03-15T00:00:00.000Z',
      endTime: '2025-03-16T00:00:00.000Z',
    },
    ...overrides,
  });

  it('should return all itinerary events with filters applied', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.itineraryEvent.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        title: 'Event 1',
        description: 'Description 1',
        location: 'Location 1',
        startTime: new Date('2025-03-15T10:00:00.000Z'),
        endTime: new Date('2025-03-15T12:00:00.000Z'),
        category: 'ACTIVITY',
        createdById: 'test-user-id',
        tripId: 1,
        assignedUsers: [],
        notes: [],
      },
    ]);

    await getAllItineraryEventsForTripHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      itineraryEvents: expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          tripId: 1,
          title: 'Event 1',
          description: 'Description 1',
          category: 'ACTIVITY',
          location: 'Location 1',
          startTime: expect.any(Date),
          endTime: expect.any(Date),
          notes: [],
          createdById: 'test-user-id',
          assignedUsers: [],
        }),
      ]),
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

      await getAllItineraryEventsForTripHandler(
        mockReq as Request,
        mockRes as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );
});

describe('Get Single Itinerary Event Controller', () => {
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
    ...overrides,
  });

  it('should return a single itinerary event', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      title: 'Event 1',
      description: 'Description 1',
      location: 'Location 1',
      startTime: new Date('2025-03-15T10:00:00.000Z'),
      endTime: new Date('2025-03-15T12:00:00.000Z'),
      category: 'ACTIVITY',
      createdById: 'test-user-id',
      tripId: 1,
      assignedUsers: [],
      notes: [],
    });

    await getItineraryEventByIdHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      itineraryEvent: expect.objectContaining({
        id: 1,
        tripId: 1,
        title: 'Event 1',
        category: 'ACTIVITY',
        description: 'Description 1',
        location: 'Location 1',
        startTime: expect.any(Date),
        endTime: expect.any(Date),
        createdById: 'test-user-id',
        assignedUsers: [],
        notes: [],
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
    {
      scenario: 'Event not found',
      setupMocks: () => {
        (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
        (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue(null);
      },
      expectedStatus: 404,
      expectedMessage: 'Itinerary event not found',
    },
  ])(
    '[$scenario] → should return $expectedStatus',
    async ({ overrides, setupMocks, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(overrides);

      if (setupMocks) setupMocks();

      await getItineraryEventByIdHandler(
        mockReq as Request,
        mockRes as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );
});

describe('Delete Itinerary Event Controller', () => {
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
    ...overrides,
  });

  it('should delete an itinerary event successfully', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      tripId: 1,
      createdById: 'test-user-id',
    });
    (prisma.itineraryEvent.delete as jest.Mock).mockResolvedValue({ id: 1 });

    await deleteItineraryEventHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Itinerary event deleted successfully',
    });
  });

  it('should fail to delete if user does not have permission', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      tripId: 1,
    });
    (prisma.itineraryEvent.delete as jest.Mock).mockResolvedValue({ id: 1 });

    await deleteItineraryEventHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error:
        'Only an admin, the trip creator, or the event creator can delete this event',
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
    {
      scenario: 'Event not found',
      setupMocks: () => {
        (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
        (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue(null);
      },
      expectedStatus: 404,
      expectedMessage: 'Itinerary event not found',
    },
  ])(
    '[$scenario] → should return $expectedStatus',
    async ({ overrides, setupMocks, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(overrides);

      if (setupMocks) setupMocks();

      await deleteItineraryEventHandler(
        mockReq as Request,
        mockRes as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );
});

describe('Batch Delete Itinerary Events Controller', () => {
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
    body: { eventIds: [1, 2, 3] },
    ...overrides,
  });

  it('should delete valid itinerary events in batch successfully', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.itineraryEvent.findMany as jest.Mock).mockResolvedValue([
      { id: 1, tripId: 1, createdById: 'test-user-id' },
      { id: 2, tripId: 1, createdById: 'test-user-id' },
      { id: 3, tripId: 1, createdById: 'not-the-creator' },
    ]);
    (prisma.itineraryEvent.deleteMany as jest.Mock).mockResolvedValue({
      count: 2,
    });

    await batchDeleteItineraryEventsHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Itinerary events deleted successfully',
      deletedCount: 2,
      eventsDeletedIds: [1, 2],
    });
  });

  it('should fail to delete itinerary events in batch if user is not permitted', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.itineraryEvent.findMany as jest.Mock).mockResolvedValue([
      { id: 1, tripId: 1, createdById: 'not-the-creator' },
      { id: 2, tripId: 1, createdById: 'not-the-creator' },
    ]);
    (prisma.itineraryEvent.deleteMany as jest.Mock).mockResolvedValue({
      count: 2,
    });

    await batchDeleteItineraryEventsHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You are not authorized to delete any of these events',
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
      scenario: 'No valid events found to delete',
      setupMocks: () => {
        (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
        (prisma.itineraryEvent.findMany as jest.Mock).mockResolvedValue([]);
      },
      expectedStatus: 404,
      expectedMessage:
        'No valid itinerary events found for deletion in this trip',
    },
  ])(
    '[$scenario] → should return $expectedStatus',
    async ({ overrides, setupMocks, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(overrides);

      if (setupMocks) setupMocks();

      await batchDeleteItineraryEventsHandler(
        mockReq as Request,
        mockRes as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );
});
