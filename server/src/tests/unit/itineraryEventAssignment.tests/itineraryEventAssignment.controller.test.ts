import {
  assignUsersToItineraryEventHandler,
  unassignUserFromItineraryEventHandler,
} from '@/controllers/itineraryEventAssignment.controller.js';
import prisma from '@/configs/prismaClient.js';
import { Request, Response } from 'express';

jest.mock('@/configs/prismaClient.js', () => ({
  __esModule: true,
  default: {
    tripMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    itineraryEvent: {
      findUnique: jest.fn(),
    },
    itineraryEventAssignment: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
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

describe('Assign Users to Itinerary Event Controller', () => {
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
      userIds: ['user-1', 'user-2'],
    },
    ...overrides,
  });

  it('should assign users to an itinerary event successfully', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      role: 'admin',
    });
    (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
      createdById: 'test-user-id',
    });
    (prisma.tripMember.findMany as jest.Mock).mockResolvedValue([
      { userId: 'user-1' },
      { userId: 'user-2' },
    ]);
    (prisma.itineraryEventAssignment.findMany as jest.Mock).mockResolvedValue(
      [],
    );
    (prisma.itineraryEventAssignment.createMany as jest.Mock).mockResolvedValue(
      {
        count: 2,
      },
    );

    await assignUsersToItineraryEventHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Users assigned successfully',
      assignedUsers: ['user-1', 'user-2'],
    });
  });

  it.each([
    {
      scenario: 'User is not authenticated',
      overrides: { userId: undefined },
      expectedStatus: 401,
      expectedMessage: 'Unauthorized request',
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
      scenario: 'Invalid user IDs',
      overrides: { body: { userIds: [] } },
      expectedStatus: 400,
      expectedMessage: 'Invalid user IDs',
    },
    {
      scenario: 'User is not a member of the trip',
      setupMocks: () => {
        (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(null);
      },
      expectedStatus: 403,
      expectedMessage: 'You are not a member of this trip',
    },
    {
      scenario: 'Event not found',
      setupMocks: () => {
        (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
        (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue(null);
      },
      expectedStatus: 404,
      expectedMessage: 'Event not found',
    },
    {
      scenario: 'User is not the event creator or trip admin',
      setupMocks: () => {
        (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
          role: 'member',
        });
        (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
          createdById: 'another-user-id',
        });
      },
      expectedStatus: 403,
      expectedMessage:
        'Only an admin, the trip creator, or the event creator can assign users.',
    },
    {
      scenario: 'None of the provided users are members of this trip',
      setupMocks: () => {
        (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
          role: 'admin',
        });
        (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
          createdById: 'test-user-id',
        });
        (prisma.tripMember.findMany as jest.Mock).mockResolvedValue([]);
      },
      expectedStatus: 400,
      expectedMessage: 'None of the provided users are members of this trip.',
    },
    {
      scenario: 'All provided users are already assigned to this event',
      setupMocks: () => {
        (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
          role: 'admin',
        });
        (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
          createdById: 'test-user-id',
        });
        (prisma.tripMember.findMany as jest.Mock).mockResolvedValue([
          { userId: 'user-1' },
          { userId: 'user-2' },
        ]);
        (
          prisma.itineraryEventAssignment.findMany as jest.Mock
        ).mockResolvedValue([{ userId: 'user-1' }, { userId: 'user-2' }]);
      },
      expectedStatus: 400,
      expectedMessage: 'All provided users are already assigned to this event.',
    },
  ])(
    '[$scenario] → should return $expectedStatus',
    async ({ overrides, setupMocks, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(overrides);

      if (setupMocks) setupMocks();

      await assignUsersToItineraryEventHandler(
        mockReq as Request,
        mockRes as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );
});

describe('Unassign User from Itinerary Event Controller', () => {
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
      userIds: ['user-1', 'user-2'],
    },
    ...overrides,
  });

  it('should unassign users from an itinerary event successfully', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      role: 'admin',
    });
    (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
      createdById: 'test-user-id',
    });
    (prisma.itineraryEventAssignment.findMany as jest.Mock).mockResolvedValue([
      { userId: 'user-1' },
      { userId: 'user-2' },
    ]);
    (prisma.itineraryEventAssignment.deleteMany as jest.Mock).mockResolvedValue(
      {
        count: 2,
      },
    );

    await unassignUserFromItineraryEventHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Users unassigned successfully',
      unassignedUsers: ['user-1', 'user-2'],
    });
  });

  it.each([
    {
      scenario: 'User is not authenticated',
      overrides: { userId: undefined },
      expectedStatus: 401,
      expectedMessage: 'Unauthorized request',
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
      scenario: 'Invalid user IDs',
      overrides: { body: { userIds: [] } },
      expectedStatus: 400,
      expectedMessage: 'Invalid user IDs',
    },
    {
      scenario: 'User is not a member of the trip',
      setupMocks: () => {
        (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(null);
      },
      expectedStatus: 403,
      expectedMessage: 'You are not a member of this trip',
    },
    {
      scenario: 'Event not found',
      setupMocks: () => {
        (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
        (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue(null);
      },
      expectedStatus: 404,
      expectedMessage: 'Event not found',
    },
    {
      scenario: 'User is not the event creator or trip admin',
      setupMocks: () => {
        (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
          role: 'member',
        });
        (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
          createdById: 'another-user-id',
        });
      },
      expectedStatus: 403,
      expectedMessage:
        'Only an admin, the trip creator, or the event creator can unassign users.',
    },
    {
      scenario: 'None of the provided users are assigned to this event',
      setupMocks: () => {
        (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
          role: 'admin',
        });
        (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
          createdById: 'test-user-id',
        });
        (
          prisma.itineraryEventAssignment.findMany as jest.Mock
        ).mockResolvedValue([]);
      },
      expectedStatus: 400,
      expectedMessage: 'None of the provided users are assigned to this event.',
    },
  ])(
    '[$scenario] → should return $expectedStatus',
    async ({ overrides, setupMocks, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(overrides);

      if (setupMocks) setupMocks();

      await unassignUserFromItineraryEventHandler(
        mockReq as Request,
        mockRes as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );
});
