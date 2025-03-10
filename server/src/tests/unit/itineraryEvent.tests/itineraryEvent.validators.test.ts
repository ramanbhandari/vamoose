import {
  validateCreateItineraryEventInput,
  validateGetAllItineraryEventsInput,
  validateGetSingleItineraryEventInput,
  validateDeleteItineraryEventInput,
  validateBatchDeleteItineraryEventsInput,
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
          expect.objectContaining({ msg: 'Invalid event category' }),
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

  // Validate Deleting a Single Itinerary Event
  describe('validateDeleteItineraryEventInput', () => {
    it('should pass validation with valid trip and event IDs', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '5' },
      };

      const result = await runValidation(
        mockReq,
        validateDeleteItineraryEventInput,
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if tripId or eventId are not valid numbers', async () => {
      mockReq = {
        params: { tripId: 'abc', eventId: 'invalid' },
      };

      const result = await runValidation(
        mockReq,
        validateDeleteItineraryEventInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a number' }),
          expect.objectContaining({ msg: 'Event ID must be a number' }),
        ]),
      );
    });
  });

  // Validate Batch Deleting Itinerary Events
  describe('validateBatchDeleteItineraryEventsInput', () => {
    it('should pass validation with valid trip ID and event IDs array', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: { eventIds: [1, 2, 3] },
      };

      const result = await runValidation(
        mockReq,
        validateBatchDeleteItineraryEventsInput,
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if tripId is not a valid number', async () => {
      mockReq = {
        params: { tripId: 'abc' },
        body: { eventIds: [1, 2, 3] },
      };

      const result = await runValidation(
        mockReq,
        validateBatchDeleteItineraryEventsInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a number' }),
        ]),
      );
    });

    it('should fail validation if eventIds is not a valid array of numbers', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: { eventIds: ['invalid', 2, 'three'] },
      };

      const result = await runValidation(
        mockReq,
        validateBatchDeleteItineraryEventsInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Each Event ID must be a positive integer',
          }),
        ]),
      );
    });

    it('should fail validation if eventIds array is empty', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: { eventIds: [] },
      };

      const result = await runValidation(
        mockReq,
        validateBatchDeleteItineraryEventsInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Event IDs must be a non-empty array of integers',
          }),
        ]),
      );
    });
  });
});
