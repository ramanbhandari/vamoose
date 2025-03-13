import { Request, Response } from 'express';
import { addNoteToItineraryEventHandler } from '@/controllers/itineraryEventNote.controller.js';
import prisma from '@/config/prismaClient.js';

jest.mock('@/config/prismaClient.js', () => ({
  __esModule: true,
  default: {
    eventNote: {
      create: jest.fn(),
    },
    tripMember: {
      findUnique: jest.fn(),
    },
    itineraryEvent: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Add Note to Itinerary Event Handler', () => {
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
    body: { content: 'Test note content' },
    ...overrides,
  });

  it('should add a note to an itinerary event successfully', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      userId: 'test-user-id',
      role: 'member',
    });
    (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      createdById: 'test-user-id',
    });
    (prisma.eventNote.create as jest.Mock).mockResolvedValue({
      id: 1,
      eventId: 1,
      createdBy: 'test-user-id',
      content: 'Test note content',
      createdAt: '2025-03-12T03:35:45.140Z',
      updatedAt: '2025-03-12T03:35:45.140Z',
    });

    await addNoteToItineraryEventHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Note added successfully',
      note: {
        id: 1,
        eventId: 1,
        createdBy: 'test-user-id',
        content: 'Test note content',
        createdAt: '2025-03-12T03:35:45.140Z',
        updatedAt: '2025-03-12T03:35:45.140Z',
      },
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
      expectedMessage: 'You are not a member of this trip',
    },
    {
      scenario: 'Event not found',
      setupMocks: () => {
        (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
          userId: 'test-user-id',
          role: 'member',
        });
        (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue(null);
      },
      expectedStatus: 404,
      expectedMessage: 'Event not found',
    },
  ])(
    '[$scenario] → should return $expectedStatus',
    async ({ overrides, setupMocks, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(overrides);

      if (setupMocks) setupMocks();

      await addNoteToItineraryEventHandler(
        mockReq as Request,
        mockRes as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );
});
