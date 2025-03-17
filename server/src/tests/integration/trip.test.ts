import request from 'supertest';
import app from '@/app.js';
import prisma from '@/config/prismaClient.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

describe('Trip API Integration Tests', () => {
  let tripCreator: string,
    tripCreatorAuthToken: string,
    tripId: number,
    tripMember: string,
    tripMemberAuthToken: string,
    nonMemberUserId: string,
    nonMemberAuthToken: string;

  beforeAll(async () => {
    // Mock user IDs
    tripCreator = 'trip-creator-user-id';
    tripMember = 'trip-member-user-id';
    nonMemberUserId = 'non-member-user-id';

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
        { id: tripCreator, email: 'tripCreator@example.com' },
        { id: tripMember, email: 'tripMember@example.com' },
        { id: nonMemberUserId, email: 'nonMember@example.com' },
      ],
      skipDuplicates: true,
    });
  });

  beforeEach(async () => {
    const trip = await prisma.trip.create({
      data: {
        name: 'Test Trip',
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
  });

  afterEach(async () => {
    // Cleanup trips created during each test
    await prisma.trip.deleteMany({});
  });

  afterAll(async () => {
    // Cleanup users
    await prisma.user.deleteMany({});
  });

  // ==========================
  // CREATE TRIP TESTS
  // ==========================
  it('should create a new trip successfully', async () => {
    const response = await request(app)
      .post('/api/trips')
      .set('Authorization', tripCreatorAuthToken)
      .send({
        name: 'New Trip',
        destination: 'Rome',
        startDate: '2025-06-01T00:00:00.000Z',
        endDate: '2025-06-10T00:00:00.000Z',
      });

    expect(response.status).toBe(201);
    expect(response.body.trip).toHaveProperty('id');
    expect(response.body.trip.name).toBe('New Trip');

    const createdTrip = await prisma.trip.findUnique({
      where: { id: response.body.trip.id },
    });
    expect(createdTrip).not.toBeNull();
  });

  it('should return 400 if required fields are missing', async () => {
    const response = await request(app)
      .post('/api/trips')
      .set('Authorization', tripCreatorAuthToken)
      .send({
        name: '',
        destination: '',
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('should return 401 if user is not authenticated', async () => {
    const response = await request(app).post('/api/trips').send({
      name: 'Unauthorized Trip',
      destination: 'Unknown',
      startDate: '2025-06-01T00:00:00.000Z',
      endDate: '2025-06-10T00:00:00.000Z',
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe(
      'Unauthorized: Missing or invalid Authorization header',
    );
  });

  // ==========================
  // FETCH TRIP TESTS
  // ==========================
  it('should fetch a single trip successfully', async () => {
    const response = await request(app)
      .get(`/api/trips/${tripId}`)
      .set('Authorization', tripCreatorAuthToken);

    expect(response.status).toBe(200);
    expect(response.body.trip.id).toBe(tripId);
  });

  it('should return 403 if fetching a trip user is not a member of', async () => {
    const response = await request(app)
      .get(`/api/trips/${tripId}`)
      .set('Authorization', nonMemberAuthToken);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe(
      'You are not authorized to view this trip',
    );
  });

  it('should return 404 for a non-existent trip', async () => {
    const response = await request(app)
      .get('/api/trips/99999')
      .set('Authorization', tripCreatorAuthToken);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Trip not found');
  });

  // ==========================
  // UPDATE TRIP TESTS
  // ==========================
  it('should update a trip successfully by the creator', async () => {
    const response = await request(app)
      .patch(`/api/trips/${tripId}`)
      .set('Authorization', tripCreatorAuthToken)
      .send({ name: 'Updated Trip Name' });

    expect(response.status).toBe(200);
    expect(response.body.trip.name).toBe('Updated Trip Name');

    const updatedTrip = await prisma.trip.findUnique({ where: { id: tripId } });
    expect(updatedTrip?.name).toBe('Updated Trip Name');
  });

  it('should return 403 if a non-admin, non-creator tries to update the trip', async () => {
    const response = await request(app)
      .patch(`/api/trips/${tripId}`)
      .set('Authorization', tripMemberAuthToken)
      .send({ name: 'Unauthorized Update' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe(
      'Only the creator or an admin can update this trip',
    );
  });

  // ==========================
  // DELETE TRIP TESTS
  // ==========================
  it('should delete a trip successfully by the creator', async () => {
    const response = await request(app)
      .delete(`/api/trips/${tripId}`)
      .set('Authorization', tripCreatorAuthToken);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Trip deleted successfully');

    const deletedTrip = await prisma.trip.findUnique({ where: { id: tripId } });
    expect(deletedTrip).toBeNull();
  });

  it('should return 403 if a non-creator tries to delete a trip', async () => {
    const response = await request(app)
      .delete(`/api/trips/${tripId}`)
      .set('Authorization', tripMemberAuthToken);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Only the creator can delete this trip');
  });

  // ==========================
  // DELETE MULTIPLE TRIPS
  // ==========================
  it('should delete multiple trips successfully by the creator', async () => {
    const trip1 = await prisma.trip.create({
      data: {
        name: 'Trip 1',
        destination: 'Berlin',
        startDate: new Date(),
        endDate: new Date(),
        createdBy: tripCreator,
        members: { create: { userId: tripCreator, role: 'creator' } },
      },
    });

    const trip2 = await prisma.trip.create({
      data: {
        name: 'Trip 2',
        destination: 'London',
        startDate: new Date(),
        endDate: new Date(),
        createdBy: tripCreator,
        members: { create: { userId: tripCreator, role: 'creator' } },
      },
    });

    const response = await request(app)
      .delete('/api/trips')
      .set('Authorization', tripCreatorAuthToken)
      .send({ tripIds: [trip1.id, trip2.id] });

    expect(response.status).toBe(200);
    expect(response.body.deletedCount).toBe(2);

    const deletedTrips = await prisma.trip.findMany({
      where: { id: { in: [trip1.id, trip2.id] } },
    });
    expect(deletedTrips.length).toBe(0);
  });

  it('should return 404 if a user tries to delete trips they do not own', async () => {
    const response = await request(app)
      .delete('/api/trips')
      .set('Authorization', tripMemberAuthToken)
      .send({ tripIds: [tripId] });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe(
      'No trips deleted. Either they do not exist or you are not authorized to delete them.',
    );
  });
});
