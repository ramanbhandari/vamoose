import { validationResult } from 'express-validator';
import { Request } from 'express';
import {
  validateAddEventNoteInput,
  validateUpdateEventNoteInput,
  validateDeleteEventNoteInput,
  validateBatchDeleteEventNotesInput,
} from '@/middleware/itineraryEventNote.validators.js';

describe('Itinerary Event Note Validators', () => {
  let mockReq: Partial<Request>;

  const runValidation = async (req: Partial<Request>, validation: any) => {
    await validation.run(req);
    return validationResult(req);
  };

  describe('validateAddEventNoteInput', () => {
    it('should pass validation for a valid request', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1' },
        body: { content: 'This is a valid note content.' },
      };

      const result = await runValidation(mockReq, validateAddEventNoteInput);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if tripId is not a number', async () => {
      mockReq = {
        params: { tripId: 'invalid', eventId: '1' },
        body: { content: 'This is a valid note content.' },
      };

      const result = await runValidation(mockReq, validateAddEventNoteInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a number' }),
        ]),
      );
    });

    it('should fail validation if eventId is not a number', async () => {
      mockReq = {
        params: { tripId: '1', eventId: 'invalid' },
        body: { content: 'This is a valid note content.' },
      };

      const result = await runValidation(mockReq, validateAddEventNoteInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Event ID must be a number' }),
        ]),
      );
    });

    it('should fail validation if content is missing', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1' },
        body: {},
      };

      const result = await runValidation(mockReq, validateAddEventNoteInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Note content must be a non-empty string',
          }),
        ]),
      );
    });

    it('should fail validation if content is an empty string', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1' },
        body: { content: '' },
      };

      const result = await runValidation(mockReq, validateAddEventNoteInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Note content must be a non-empty string',
          }),
        ]),
      );
    });

    it('should fail validation if content is not a string', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1' },
        body: { content: 12345 }, // Invalid: content is not a string
      };

      const result = await runValidation(mockReq, validateAddEventNoteInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Note content must be a string',
          }),
        ]),
      );
    });
  });

  describe('validateUpdateEventNoteInput', () => {
    it('should pass validation for a valid request', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1', noteId: '1' },
        body: { content: 'Updated note content.' },
      };

      const result = await runValidation(mockReq, validateUpdateEventNoteInput);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if tripId is not a number', async () => {
      mockReq = {
        params: { tripId: 'invalid', eventId: '1', noteId: '1' },
        body: { content: 'Updated note content.' },
      };

      const result = await runValidation(mockReq, validateUpdateEventNoteInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a number' }),
        ]),
      );
    });

    it('should fail validation if eventId is not a number', async () => {
      mockReq = {
        params: { tripId: '1', eventId: 'invalid', noteId: '1' },
        body: { content: 'Updated note content.' },
      };

      const result = await runValidation(mockReq, validateUpdateEventNoteInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Event ID must be a number' }),
        ]),
      );
    });

    it('should fail validation if noteId is not a number', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1', noteId: 'invalid' },
        body: { content: 'Updated note content.' },
      };

      const result = await runValidation(mockReq, validateUpdateEventNoteInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Note ID must be a number' }),
        ]),
      );
    });

    it('should fail validation if content is missing', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1', noteId: '1' },
        body: {},
      };

      const result = await runValidation(mockReq, validateUpdateEventNoteInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Note content must be a non-empty string',
          }),
        ]),
      );
    });

    it('should fail validation if content is an empty string', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1', noteId: '1' },
        body: { content: '' },
      };

      const result = await runValidation(mockReq, validateUpdateEventNoteInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Note content must be a non-empty string',
          }),
        ]),
      );
    });

    it('should fail validation if content is not a string', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1', noteId: '1' },
        body: { content: 12345 }, // Invalid: content is not a string
      };

      const result = await runValidation(mockReq, validateUpdateEventNoteInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Note content must be a string',
          }),
        ]),
      );
    });
  });

  describe('validateDeleteEventNoteInput', () => {
    it('should pass validation for a valid request', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1', noteId: '1' },
      };

      const result = await runValidation(mockReq, validateDeleteEventNoteInput);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if tripId is not a number', async () => {
      mockReq = {
        params: { tripId: 'invalid', eventId: '1', noteId: '1' },
      };

      const result = await runValidation(mockReq, validateDeleteEventNoteInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a number' }),
        ]),
      );
    });

    it('should fail validation if eventId is not a number', async () => {
      mockReq = {
        params: { tripId: '1', eventId: 'invalid', noteId: '1' },
      };

      const result = await runValidation(mockReq, validateDeleteEventNoteInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Event ID must be a number' }),
        ]),
      );
    });

    it('should fail validation if noteId is not a number', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1', noteId: 'invalid' },
      };

      const result = await runValidation(mockReq, validateDeleteEventNoteInput);

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Note ID must be a number' }),
        ]),
      );
    });
  });

  describe('validateBatchDeleteEventNotesInput', () => {
    it('should pass validation for a valid request', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1' },
        body: { noteIds: [1, 2, 3] },
      };

      const result = await runValidation(
        mockReq,
        validateBatchDeleteEventNotesInput,
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if tripId is not a number', async () => {
      mockReq = {
        params: { tripId: 'invalid', eventId: '1' },
        body: { noteIds: [1, 2, 3] },
      };

      const result = await runValidation(
        mockReq,
        validateBatchDeleteEventNotesInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a number' }),
        ]),
      );
    });

    it('should fail validation if eventId is not a number', async () => {
      mockReq = {
        params: { tripId: '1', eventId: 'invalid' },
        body: { noteIds: [1, 2, 3] },
      };

      const result = await runValidation(
        mockReq,
        validateBatchDeleteEventNotesInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Event ID must be a number' }),
        ]),
      );
    });

    it('should fail validation if noteIds is not an array', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1' },
        body: { noteIds: 'not-an-array' },
      };

      const result = await runValidation(
        mockReq,
        validateBatchDeleteEventNotesInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Note IDs must be a non-empty array of numbers',
          }),
        ]),
      );
    });

    it('should fail validation if noteIds array is empty', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1' },
        body: { noteIds: [] },
      };

      const result = await runValidation(
        mockReq,
        validateBatchDeleteEventNotesInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Note IDs must be a non-empty array of numbers',
          }),
        ]),
      );
    });

    it('should fail validation if noteIds contains non-number values', async () => {
      mockReq = {
        params: { tripId: '1', eventId: '1' },
        body: { noteIds: [1, 'invalid', 3] },
      };

      const result = await runValidation(
        mockReq,
        validateBatchDeleteEventNotesInput,
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Each note ID must be a valid number',
          }),
        ]),
      );
    });
  });
});
