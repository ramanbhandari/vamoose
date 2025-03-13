import { validationResult } from 'express-validator';
import { Request } from 'express';
import { validateAddEventNoteInput } from '@/middleware/itineraryEventNote.validators.js';

describe('Add Event Note Validator', () => {
  let mockReq: Partial<Request>;

  const runValidation = async (req: Partial<Request>, validation: any) => {
    await validation.run(req);
    return validationResult(req);
  };

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
