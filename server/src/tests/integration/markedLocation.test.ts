import request from 'supertest';
import app from '@/app.js';
import prisma from '@/configs/prismaClient.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { LocationType } from '@/interfaces/enums.js';

dotenv.config({ path: '.env.test' });

describe('Marked Location API Integration Tests', () => {
  let tripCreator: string,
    tripCreatorAuthToken: string,
    tripId: number,
    tripMember: string,
    tripMemberAuthToken: string,
    nonMemberUserId: string,
    nonMemberAuthToken: string,
    locationId: string;

  beforeAll(async () => {
    // Mock user IDs
    tripCreator = 'location-creator-user-id';
    tripMember = 'location-member-user-id';
    nonMemberUserId = 'location-non-member-user-id';

    // Generate mock auth tokens
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) {
      throw new Error(
        'SUPABASE_JWT_SECRET is not set in environment variables',
      );
    }

    tripCreatorAuthToken = `Bearer ${jwt.sign({ sub: tripCreator }, secret)}`;
    tripMemberAuthToken = `Bearer ${jwt.sign({ sub: tripMember }, secret)}`;
    nonMemberAuthToken = `Bearer ${jwt.sign({ sub: nonMemberUserId }, secret)}`;

    // Insert test users into the database
    await prisma.user.createMany({
      data: [
        {
          id: tripCreator,
          email: 'locationCreator@example.com',
          fullName: 'Location Creator',
        },
        {
          id: tripMember,
          email: 'locationMember@example.com',
          fullName: 'Location Member',
        },
        {
          id: nonMemberUserId,
          email: 'locationNonMember@example.com',
          fullName: 'Location Non Member',
        },
      ],
      skipDuplicates: true,
    });
  });

  beforeEach(async () => {
    // Create a test trip with members
    const trip = await prisma.trip.create({
      data: {
        name: 'Location Test Trip',
        destination: 'Paris',
        startDate: new Date(),
        endDate: new Date(),
        createdBy: tripCreator,
        members: {
          create: [
            { userId: tripCreator, role: 'creator' },
            { userId: tripMember, role: 'member' },
          ],
        },
      },
    });
    tripId = trip.id;

    // Create a test marked location
    const location = await prisma.markedLocation.create({
      data: {
        tripId,
        name: 'Eiffel Tower',
        type: LocationType.OTHER,
        coordinates: { latitude: 48.8584, longitude: 2.2945 },
        address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
        createdById: tripCreator,
        notes: 'Iconic landmark',
        website: 'https://www.toureiffel.paris/en',
        phoneNumber: '+33 1 44 11 23 45',
      },
    });
    locationId = location.id;
  });

  afterEach(async () => {
    // Cleanup resources created during tests
    await prisma.markedLocation.deleteMany({});
    await prisma.trip.deleteMany({});
  });

  afterAll(async () => {
    // Cleanup users
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [tripCreator, tripMember, nonMemberUserId],
        },
      },
    });
  });

  // ==========================
  // CREATE MARKED LOCATION TESTS
  // ==========================
  it('should create a new marked location successfully', async () => {
    const response = await request(app)
      .post(`/api/trips/${tripId}/marked-locations`)
      .set('Authorization', tripCreatorAuthToken)
      .send({
        name: 'Louvre Museum',
        type: 'OTHER',
        coordinates: { latitude: 48.8606, longitude: 2.3376 },
        address: 'Rue de Rivoli, 75001 Paris, France',
        notes: "World's largest art museum",
        website: 'https://www.louvre.fr/en',
        phoneNumber: '+33 1 40 20 53 17',
      });

    // Log the response body for debugging
    console.log(
      'Create response:',
      response.status,
      JSON.stringify(response.body, null, 2),
    );

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('markedLocation');
    expect(response.body.markedLocation.name).toBe('Louvre Museum');
    expect(response.body.message).toBe('Marked location created successfully');

    const createdLocation = await prisma.markedLocation.findUnique({
      where: { id: response.body.markedLocation.id },
    });
    expect(createdLocation).not.toBeNull();
    expect(createdLocation?.name).toBe('Louvre Museum');
    expect(createdLocation?.type).toBe('OTHER');
  });

  it('should return 400 if required fields are missing', async () => {
    const response = await request(app)
      .post(`/api/trips/${tripId}/marked-locations`)
      .set('Authorization', tripCreatorAuthToken)
      .send({
        // Missing required fields
        notes: 'Incomplete location data',
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('should return 400 if coordinates are invalid', async () => {
    const response = await request(app)
      .post(`/api/trips/${tripId}/marked-locations`)
      .set('Authorization', tripCreatorAuthToken)
      .send({
        name: 'Invalid Coordinates',
        type: 'OTHER',
        coordinates: { latitude: 200, longitude: 300 }, // Invalid coordinates
        address: 'Invalid Address',
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('should return 403 if user is not a member of the trip', async () => {
    const response = await request(app)
      .post(`/api/trips/${tripId}/marked-locations`)
      .set('Authorization', nonMemberAuthToken)
      .send({
        name: 'Unauthorized Location',
        type: 'OTHER',
        coordinates: { latitude: 48.85, longitude: 2.35 },
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('You are not a member of this trip');
  });

  // ==========================
  // GET ALL MARKED LOCATIONS TESTS
  // ==========================
  it('should fetch all marked locations for a trip', async () => {
    const response = await request(app)
      .get(`/api/trips/${tripId}/marked-locations`)
      .set('Authorization', tripCreatorAuthToken);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('markedLocations');
    expect(Array.isArray(response.body.markedLocations)).toBe(true);
    expect(response.body.markedLocations.length).toBeGreaterThan(0);
    expect(response.body.markedLocations[0]).toHaveProperty('name');
    expect(response.body.markedLocations[0]).toHaveProperty('coordinates');
    expect(response.body.message).toBe(
      'Marked locations retrieved successfully',
    );
  });

  it('should return 403 if unauthorized user tries to fetch locations', async () => {
    const response = await request(app)
      .get(`/api/trips/${tripId}/marked-locations`)
      .set('Authorization', nonMemberAuthToken);

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('You are not a member of this trip');
  });

  // ==========================
  // UPDATE MARKED LOCATION NOTES TESTS
  // ==========================
  it("should update a marked location's notes successfully", async () => {
    const response = await request(app)
      .put(`/api/trips/${tripId}/marked-locations/${locationId}/notes`)
      .set('Authorization', tripCreatorAuthToken)
      .send({
        notes: 'Updated location notes',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('updatedLocation');
    expect(response.body.updatedLocation.notes).toBe('Updated location notes');
    expect(response.body.message).toBe(
      'Marked location notes updated successfully',
    );

    const updatedLocation = await prisma.markedLocation.findUnique({
      where: { id: locationId },
    });
    expect(updatedLocation?.notes).toBe('Updated location notes');
  });

  it('should return 404 if location does not exist', async () => {
    const response = await request(app)
      .put(`/api/trips/${tripId}/marked-locations/non-existent-id/notes`)
      .set('Authorization', tripCreatorAuthToken)
      .send({
        notes: 'Notes for non-existent location',
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('should return 403 if unauthorized user tries to update location notes', async () => {
    const response = await request(app)
      .put(`/api/trips/${tripId}/marked-locations/${locationId}/notes`)
      .set('Authorization', nonMemberAuthToken)
      .send({
        notes: 'Unauthorized update',
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('You are not a member of this trip');
  });

  // ==========================
  // DELETE MARKED LOCATION TESTS
  // ==========================
  it('should delete a marked location successfully by the creator', async () => {
    const response = await request(app)
      .delete(`/api/trips/${tripId}/marked-locations/${locationId}`)
      .set('Authorization', tripCreatorAuthToken);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Marked location deleted successfully');
    expect(response.body).toHaveProperty('deletedLocation');

    const deletedLocation = await prisma.markedLocation.findUnique({
      where: { id: locationId },
    });
    expect(deletedLocation).toBeNull();
  });

  it("should return 403 if regular member tries to delete another user's location", async () => {
    const response = await request(app)
      .delete(`/api/trips/${tripId}/marked-locations/${locationId}`)
      .set('Authorization', tripMemberAuthToken);

    expect(response.status).toBe(403);
    expect(response.body.error).toContain(
      'Only the marker creator, trip admins, and trip creators can delete marked locations',
    );
  });

  it('should return 404 if trying to delete non-existent location', async () => {
    const response = await request(app)
      .delete(`/api/trips/${tripId}/marked-locations/non-existent-id`)
      .set('Authorization', tripCreatorAuthToken);

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('should allow trip member to delete their own created location', async () => {
    // Create a location by the regular member
    const memberLocation = await prisma.markedLocation.create({
      data: {
        tripId,
        name: "Member's Location",
        type: LocationType.RESTAURANT,
        coordinates: { latitude: 48.8, longitude: 2.3 },
        createdById: tripMember,
      },
    });

    const response = await request(app)
      .delete(`/api/trips/${tripId}/marked-locations/${memberLocation.id}`)
      .set('Authorization', tripMemberAuthToken);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Marked location deleted successfully');

    const deletedLocation = await prisma.markedLocation.findUnique({
      where: { id: memberLocation.id },
    });
    expect(deletedLocation).toBeNull();
  });
});
