import {
  validateCreateMarkedLocationInput,
  validateUpdateMarkedLocationNotesInput,
  validateGetAllMarkedLocationsInput,
  validateDeleteMarkedLocationInput,
} from '@/middleware/markedLocation.validators.js';
import { validationResult } from 'express-validator';
import { Request } from 'express';
import { LocationType } from '@prisma/client';

describe('MarkedLocation Validators Middleware', () => {
  let mockReq: Partial<Request>;

  const runValidation = async (req: Partial<Request>, validation: any) => {
    await validation.run(req);
    return validationResult(req);
  };

  /** ───────────────────────────────────────────────────────
   * CREATE MARKED LOCATION VALIDATION TESTS
   * ─────────────────────────────────────────────────────── */
  describe('Create Marked Location Validation', () => {
    it('should pass validation for a valid input', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          name: 'Great Restaurant',
          type: 'RESTAURANT',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
          address: '123 Main St, San Francisco, CA',
          notes: 'Great place for dinner',
          website: 'https://example.com',
          phoneNumber: '123-456-7890',
        },
      };

      const result = await runValidation(
        mockReq,
        validateCreateMarkedLocationInput,
      );
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if tripId is not a number', async () => {
      mockReq = {
        params: { tripId: 'abc' },
        body: {
          name: 'Great Restaurant',
          type: 'RESTAURANT',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
        },
      };

      const result = await runValidation(
        mockReq,
        validateCreateMarkedLocationInput,
      );
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a number' }),
        ]),
      );
    });

    it('should fail validation if name is missing', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          type: 'RESTAURANT',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
        },
      };

      const result = await runValidation(
        mockReq,
        validateCreateMarkedLocationInput,
      );
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Name is required' }),
        ]),
      );
    });

    it('should fail validation if type is missing', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          name: 'Great Restaurant',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
        },
      };

      const result = await runValidation(
        mockReq,
        validateCreateMarkedLocationInput,
      );
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Type is required' }),
        ]),
      );
    });

    it('should fail validation if type is invalid', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          name: 'Great Restaurant',
          type: 'INVALID_TYPE', // Invalid type
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
        },
      };

      const result = await runValidation(
        mockReq,
        validateCreateMarkedLocationInput,
      );
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringContaining('Invalid type. Allowed values:'),
          }),
        ]),
      );
    });

    it('should fail validation if coordinates are missing', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          name: 'Great Restaurant',
          type: 'RESTAURANT',
        },
      };

      const result = await runValidation(
        mockReq,
        validateCreateMarkedLocationInput,
      );
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Coordinates are required' }),
        ]),
      );
    });

    it('should fail validation if coordinates are invalid (out of range)', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          name: 'Great Restaurant',
          type: 'RESTAURANT',
          coordinates: { latitude: 100, longitude: -122.4194 }, // Latitude out of range
        },
      };

      const result = await runValidation(
        mockReq,
        validateCreateMarkedLocationInput,
      );
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Latitude and longitude values are out of range',
          }),
        ]),
      );
    });

    it('should fail validation if coordinates are missing latitude or longitude', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          name: 'Great Restaurant',
          type: 'RESTAURANT',
          coordinates: { longitude: -122.4194 }, // Missing latitude
        },
      };

      const result = await runValidation(
        mockReq,
        validateCreateMarkedLocationInput,
      );
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Coordinates must include valid latitude and longitude numbers',
          }),
        ]),
      );
    });

    it('should fail validation if website is invalid', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          name: 'Great Restaurant',
          type: 'RESTAURANT',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
          website: 'not-a-valid-url',
        },
      };

      const result = await runValidation(
        mockReq,
        validateCreateMarkedLocationInput,
      );
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Website must be a valid URL' }),
        ]),
      );
    });

    it('should pass validation if optional fields are omitted', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {
          name: 'Great Restaurant',
          type: 'RESTAURANT',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
        },
      };

      const result = await runValidation(
        mockReq,
        validateCreateMarkedLocationInput,
      );
      expect(result.isEmpty()).toBe(true);
    });
  });

  /** ───────────────────────────────────────────────────────
   * UPDATE MARKED LOCATION NOTES VALIDATION TESTS
   * ─────────────────────────────────────────────────────── */
  describe('Update Marked Location Notes Validation', () => {
    it('should pass validation for valid input', async () => {
      mockReq = {
        params: {
          tripId: '1',
          locationId: '550e8400-e29b-41d4-a716-446655440000',
        },
        body: {
          notes: 'Updated notes for the location',
        },
      };

      const result = await runValidation(
        mockReq,
        validateUpdateMarkedLocationNotesInput,
      );
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail validation if tripId is not a number', async () => {
      mockReq = {
        params: {
          tripId: 'abc',
          locationId: '550e8400-e29b-41d4-a716-446655440000',
        },
        body: {
          notes: 'Updated notes for the location',
        },
      };

      const result = await runValidation(
        mockReq,
        validateUpdateMarkedLocationNotesInput,
      );
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Trip ID must be a number' }),
        ]),
      );
    });

    it('should fail validation if locationId is not a UUID', async () => {
      mockReq = {
        params: { tripId: '1', locationId: 'not-a-uuid' },
        body: {
          notes: 'Updated notes for the location',
        },
      };

      const result = await runValidation(
        mockReq,
        validateUpdateMarkedLocationNotesInput,
      );
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Location ID must be a valid UUID' }),
        ]),
      );
    });

    it('should fail validation if notes are missing', async () => {
      mockReq = {
        params: {
          tripId: '1',
          locationId: '550e8400-e29b-41d4-a716-446655440000',
        },
        body: {},
      };

      const result = await runValidation(
        mockReq,
        validateUpdateMarkedLocationNotesInput,
      );
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Notes are required and must be a non-empty string',
          }),
        ]),
      );
    });

    it('should fail validation if notes are empty', async () => {
      mockReq = {
        params: {
          tripId: '1',
          locationId: '550e8400-e29b-41d4-a716-446655440000',
        },
        body: {
          notes: '',
        },
      };

      const result = await runValidation(
        mockReq,
        validateUpdateMarkedLocationNotesInput,
      );
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Notes are required and must be a non-empty string',
          }),
        ]),
      );
    });

    it('should fail validation if notes are not a string', async () => {
      mockReq = {
        params: {
          tripId: '1',
          locationId: '550e8400-e29b-41d4-a716-446655440000',
        },
        body: {
          notes: 123, // Not a string
        },
      };

      const result = await runValidation(
        mockReq,
        validateUpdateMarkedLocationNotesInput,
      );
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Invalid value',
          }),
        ]),
      );
    });
  });
});
