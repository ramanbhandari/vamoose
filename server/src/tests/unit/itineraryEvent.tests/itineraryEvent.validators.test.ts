import {
  validateCreateItineraryEventInput,
  validateGetAllItineraryEventsInput,
  validateGetSingleItineraryEventInput,
} from '@/middleware/itineraryEvent.validators.js';
import { validationResult } from 'express-validator';
import { Request } from 'express';

describe('ItineraryEvent Validators Middleware', () => {
  let mockReq: Partial<Request>;

  const runValidation = async (req: Partial<Request>, validation: any) => {
    await validation.run(req);
    return validationResult(req);
  };

  // Validate Creating an Itinerary Event
  describe('validateCreateItineraryEventInput', () => {
    it('should pass validation for a valid request', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          title: 'Event Title',
          description: 'Event Description',
          location: 'Event Location',
          startTime: '2025-04-10T10:00:00Z',
          endTime: '2025-04-10T12:00:00Z',
          category: 'MEETING',
          assignedUserIds: ['user1', 'user2'],
          notes: [{ content: 'Note 1' }, { content: 'Note 2' }],
        },
      };

      const result = await runValidation(
        mockReq,
        validateCreateItineraryEventInput,
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if tripId is not a number', async () => {
      mockReq = {
        params: { tripId: 'abc' },
        body: { title: 'Event Title' },
      };

      const result = await runValidation(
        mockReq,
        validateCreateItineraryEventInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a number' }),
        ]),
      );
    });

    it('should fail if title is missing or not a string', async () => {
      mockReq = { params: { tripId: '1' }, body: {} };

      const result = await runValidation(
        mockReq,
        validateCreateItineraryEventInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Title is required and must be a string',
          }),
        ]),
      );
    });

    it('should fail if startTime or endTime are invalid dates', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          title: 'Event Title',
          startTime: 'invalid-date',
          endTime: 'invalid-date',
        },
      };

      const result = await runValidation(
        mockReq,
        validateCreateItineraryEventInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Start time must be a valid ISO8601 date',
          }),
          expect.objectContaining({
            msg: 'End time must be a valid ISO8601 date',
          }),
        ]),
      );
    });

    it('should fail if assignedUserIds is not an array of strings', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          title: 'Event Title',
          assignedUserIds: 'not-an-array',
        },
      };

      const result = await runValidation(
        mockReq,
        validateCreateItineraryEventInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Assigned user IDs must be an array of strings',
          }),
        ]),
      );
    });

    it('should fail if category is invalid', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          title: 'Event Title',
          category: 'INVALID_CATEGORY',
        },
      };

      const result = await runValidation(
        mockReq,
        validateCreateItineraryEventInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Category must be one of: GENERAL, TRAVEL, ACTIVITY, MEAL, MEETING, FREE_TIME, OTHER',
          }),
        ]),
      );
    });

    it('should fail if notes are not valid objects', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          title: 'Event Title',
          notes: 'not-an-array',
        },
      };

      const result = await runValidation(
        mockReq,
        validateCreateItineraryEventInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Notes must be an array of objects',
          }),
        ]),
      );
    });

    it('should fail if a note content is missing or not a string', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          title: 'Event Title',
          notes: [{ content: '' }, { invalidKey: 'Note without content' }],
        },
      };

      const result = await runValidation(
        mockReq,
        validateCreateItineraryEventInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Each Note content must be a non-empty string',
          }),
        ]),
      );
    });
  });

  // Validate Getting All Itinerary Events
  describe('validateGetAllItineraryEventsInput', () => {
    it('should pass validation with valid optional filters', async () => {
      mockReq = {
        params: { tripId: '1' },
        query: {
          category: 'MEETING',
          startTime: '2025-04-10T10:00:00Z',
          endTime: '2025-04-10T12:00:00Z',
        },
      };

      const result = await runValidation(
        mockReq,
        validateGetAllItineraryEventsInput,
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if category is invalid', async () => {
      mockReq = {
        params: { tripId: '1' },
        query: { category: 'INVALID_CATEGORY' },
      };

      const result = await runValidation(
        mockReq,
        validateGetAllItineraryEventsInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Invalid event category' }),
        ]),
      );
    });

    it('should fail validation if startTime or endTime are invalid dates', async () => {
      mockReq = {
        params: { tripId: '1' },
        query: { startTime: 'invalid-date', endTime: 'invalid-date' },
      };

      const result = await runValidation(
        mockReq,
        validateGetAllItineraryEventsInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Start time filter must be a valid ISO8601 date',
          }),
          expect.objectContaining({
            msg: 'End time filter must be a valid ISO8601 date',
          }),
        ]),
      );
    });
  });

  // Validate Getting a Single Itinerary Event
  describe('validateGetSingleItineraryEventInput', () => {
    it('should pass validation with a valid event ID', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '5' },
      };

      const result = await runValidation(
        mockReq,
        validateGetSingleItineraryEventInput,
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if event ID is not a valid number', async () => {
      mockReq = {
        params: { tripId: '1', eventId: 'invalid' },
      };

      const result = await runValidation(
        mockReq,
        validateGetSingleItineraryEventInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Event ID must be a number' }),
        ]),
      );
    });
  });
});
