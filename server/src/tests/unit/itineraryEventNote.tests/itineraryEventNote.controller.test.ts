import { Request, Response } from 'express';
import {
  addNoteToItineraryEventHandler,
  updateItineraryEventNoteHandler,
  deleteItineraryEventNoteHandler,
  batchDeleteItineraryEventNotesHandler,
} from '@/controllers/itineraryEventNote.controller.js';
import prisma from '@/config/prismaClient.js';

jest.mock('@/config/prismaClient.js', () => ({
  __esModule: true,
  default: {
    eventNote: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    tripMember: {
      findUnique: jest.fn(),
    },
    itineraryEvent: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Itinerary Event Note Handlers', () => {
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
    params: { tripId: '1', eventId: '1', noteId: '1' },
    body: { content: 'Updated note content' },
    ...overrides,
  });

  describe('Add Note to Itinerary Event Handler', () => {
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
          (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue(
            null,
          );
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

  describe('Update Itinerary Event Note Handler', () => {
    it('should update a note successfully', async () => {
      mockReq = setupRequest();

      (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
        userId: 'test-user-id',
        role: 'member',
      });
      (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        createdById: 'test-user-id',
      });
      (prisma.eventNote.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        createdBy: 'test-user-id',
        content: 'Original note content',
      });
      (prisma.eventNote.update as jest.Mock).mockResolvedValue({
        id: 1,
        eventId: 1,
        createdBy: 'test-user-id',
        content: 'Updated note content',
        createdAt: '2025-03-12T03:35:45.140Z',
        updatedAt: '2025-03-12T03:35:45.140Z',
      });

      await updateItineraryEventNoteHandler(
        mockReq as Request,
        mockRes as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Note updated successfully',
        updatedNote: {
          id: 1,
          eventId: 1,
          createdBy: 'test-user-id',
          content: 'Updated note content',
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
        overrides: { params: { tripId: 'invalid', eventId: '1', noteId: '1' } },
        expectedStatus: 400,
        expectedMessage: 'Invalid trip ID',
      },
      {
        scenario: 'Invalid event ID',
        overrides: { params: { tripId: '1', eventId: 'invalid', noteId: '1' } },
        expectedStatus: 400,
        expectedMessage: 'Invalid event ID',
      },
      {
        scenario: 'Invalid note ID',
        overrides: { params: { tripId: '1', eventId: '1', noteId: 'invalid' } },
        expectedStatus: 400,
        expectedMessage: 'Invalid note ID',
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
          (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue(
            null,
          );
        },
        expectedStatus: 404,
        expectedMessage: 'Event not found',
      },
      {
        scenario: 'Note not found',
        setupMocks: () => {
          (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
            userId: 'test-user-id',
            role: 'member',
          });
          (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
            id: 1,
            createdById: 'test-user-id',
          });
          (prisma.eventNote.findUnique as jest.Mock).mockResolvedValue(null);
        },
        expectedStatus: 404,
        expectedMessage: 'Event note not found',
      },
      {
        scenario: 'User is not the note creator',
        setupMocks: () => {
          (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
            userId: 'test-user-id',
            role: 'member',
          });
          (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
            id: 1,
            createdById: 'test-user-id',
          });
          (prisma.eventNote.findUnique as jest.Mock).mockResolvedValue({
            id: 1,
            createdBy: 'another-user-id',
          });
        },
        expectedStatus: 403,
        expectedMessage: 'Only the note creator can update the note',
      },
    ])(
      '[$scenario] → should return $expectedStatus',
      async ({ overrides, setupMocks, expectedStatus, expectedMessage }) => {
        mockReq = setupRequest(overrides);

        if (setupMocks) setupMocks();

        await updateItineraryEventNoteHandler(
          mockReq as Request,
          mockRes as Response,
        );

        expect(statusMock).toHaveBeenCalledWith(expectedStatus);
        expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
      },
    );
  });

  describe('Delete Itinerary Event Note Handler', () => {
    it('should delete a note successfully', async () => {
      mockReq = setupRequest();

      (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
        userId: 'test-user-id',
        role: 'member',
      });
      (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        createdById: 'test-user-id',
      });
      (prisma.eventNote.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        createdBy: 'test-user-id',
        content: 'Original note content',
      });
      (prisma.eventNote.delete as jest.Mock).mockResolvedValue({
        id: 1,
      });

      await deleteItineraryEventNoteHandler(
        mockReq as Request,
        mockRes as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Event note deleted successfully',
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
        overrides: { params: { tripId: 'invalid', eventId: '1', noteId: '1' } },
        expectedStatus: 400,
        expectedMessage: 'Invalid trip ID',
      },
      {
        scenario: 'Invalid event ID',
        overrides: { params: { tripId: '1', eventId: 'invalid', noteId: '1' } },
        expectedStatus: 400,
        expectedMessage: 'Invalid event ID',
      },
      {
        scenario: 'Invalid note ID',
        overrides: { params: { tripId: '1', eventId: '1', noteId: 'invalid' } },
        expectedStatus: 400,
        expectedMessage: 'Invalid note ID',
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
          (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue(
            null,
          );
        },
        expectedStatus: 404,
        expectedMessage: 'Event not found',
      },
      {
        scenario: 'Note not found',
        setupMocks: () => {
          (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
            userId: 'test-user-id',
            role: 'member',
          });
          (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
            id: 1,
            createdById: 'test-user-id',
          });
          (prisma.eventNote.findUnique as jest.Mock).mockResolvedValue(null);
        },
        expectedStatus: 404,
        expectedMessage: 'Event note not found',
      },
      {
        scenario: 'User is not the note creator',
        setupMocks: () => {
          (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
            userId: 'test-user-id',
            role: 'member',
          });
          (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
            id: 1,
            createdById: 'test-user-id',
          });
          (prisma.eventNote.findUnique as jest.Mock).mockResolvedValue({
            id: 1,
            createdBy: 'another-user-id',
          });
        },
        expectedStatus: 403,
        expectedMessage: 'Only the note creator can delete the note',
      },
    ])(
      '[$scenario] → should return $expectedStatus',
      async ({ overrides, setupMocks, expectedStatus, expectedMessage }) => {
        mockReq = setupRequest(overrides);

        if (setupMocks) setupMocks();

        await deleteItineraryEventNoteHandler(
          mockReq as Request,
          mockRes as Response,
        );

        expect(statusMock).toHaveBeenCalledWith(expectedStatus);
        expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
      },
    );
  });

  describe('Batch Delete Itinerary Event Notes Handler', () => {
    it('should delete multiple notes successfully', async () => {
      mockReq = setupRequest();

      (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
        userId: 'test-user-id',
        role: 'member',
      });
      (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        createdById: 'test-user-id',
      });
      (prisma.eventNote.findMany as jest.Mock).mockResolvedValue([
        { id: 1, createdBy: 'test-user-id' },
        { id: 2, createdBy: 'test-user-id' },
      ]);
      (prisma.eventNote.deleteMany as jest.Mock).mockResolvedValue({
        count: 2,
      });

      await batchDeleteItineraryEventNotesHandler(
        mockReq as Request,
        mockRes as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Event notes deleted successfully',
        deletedNoteIds: [1, 2],
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
          (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue(
            null,
          );
        },
        expectedStatus: 404,
        expectedMessage: 'Event not found',
      },
      {
        scenario: 'No notes found for deletion',
        setupMocks: () => {
          (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
            userId: 'test-user-id',
            role: 'member',
          });
          (prisma.itineraryEvent.findUnique as jest.Mock).mockResolvedValue({
            id: 1,
            createdById: 'test-user-id',
          });
          (prisma.eventNote.findMany as jest.Mock).mockResolvedValue([]);
        },
        expectedStatus: 403,
        expectedMessage: 'You do not have permission to delete these notes',
      },
    ])(
      '[$scenario] → should return $expectedStatus',
      async ({ overrides, setupMocks, expectedStatus, expectedMessage }) => {
        mockReq = setupRequest(overrides);

        if (setupMocks) setupMocks();

        await batchDeleteItineraryEventNotesHandler(
          mockReq as Request,
          mockRes as Response,
        );

        expect(statusMock).toHaveBeenCalledWith(expectedStatus);
        expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
      },
    );
  });
});
