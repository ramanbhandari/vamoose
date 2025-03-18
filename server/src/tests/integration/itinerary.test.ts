import request from 'supertest';
import app from '@/app.js';
import prisma from '@/config/prismaClient.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { DateTime } from 'luxon';

dotenv.config({ path: '.env.test' });

describe('Itinerary Event API Integration Tests', () => {
  let userId: string, authToken: string, tripId: number;
  const secret = process.env.SUPABASE_JWT_SECRET;
  const tripStartDate = '2025-05-01';
  const tripEndDate = '2025-05-30';

  beforeAll(async () => {
    if (!secret) throw new Error('SUPABASE_JWT_SECRET is not set');

    userId = 'test-user-id';
    authToken = `Bearer ${jwt.sign({ sub: userId }, secret)}`;

    await prisma.user.create({
      data: { id: userId, email: 'test@example.com' },
    });

    const trip = await prisma.trip.create({
      data: {
        name: 'Test Trip',
        destination: 'Paris',
        startDate: DateTime.fromISO(tripStartDate).toJSDate(),
        endDate: DateTime.fromISO(tripEndDate).toJSDate(),
        createdBy: userId,
        members: { create: [{ userId, role: 'creator' }] },
      },
    });
    tripId = trip.id;
  });

  afterAll(async () => {
    await prisma.trip.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    await prisma.eventNote.deleteMany();
    await prisma.itineraryEventAssignment.deleteMany();
    await prisma.itineraryEvent.deleteMany();
  });

  it('should create an itinerary event successfully', async () => {
    const response = await request(app)
      .post(`/api/trips/${tripId}/itinerary-events`)
      .set('Authorization', authToken)
      .send({
        title: 'Visit Eiffel Tower',
        startTime: DateTime.fromISO(tripStartDate).plus({ days: 1 }),
        endTime: DateTime.fromISO(tripEndDate).minus({ days: 1 }),
        category: 'ACTIVITY',
      });

    expect(response.status).toBe(201);
    expect(response.body.itineraryEvent).toHaveProperty('id');

    const eventExists = await prisma.itineraryEvent.findUnique({
      where: { id: response.body.itineraryEvent.id },
    });
    expect(eventExists).not.toBeNull();
  });

  it('should fetch all itinerary events for a trip', async () => {
    const event = await prisma.itineraryEvent.create({
      data: {
        tripId,
        title: 'Louvre Tour',
        startTime: new Date(),
        endTime: new Date(),
        category: 'ACTIVITY',
        createdById: userId,
      },
    });

    const response = await request(app)
      .get(`/api/trips/${tripId}/itinerary-events`)
      .set('Authorization', authToken);

    expect(response.status).toBe(200);
    expect(response.body.itineraryEvents.length).toBe(1);
    expect(response.body.itineraryEvents[0].id).toBe(event.id);
  });

  it('should delete an itinerary event', async () => {
    const event = await prisma.itineraryEvent.create({
      data: {
        tripId,
        title: 'Seine River Cruise',
        startTime: new Date(),
        endTime: new Date(),
        category: 'ACTIVITY',
        createdById: userId,
      },
    });

    const response = await request(app)
      .delete(`/api/trips/${tripId}/itinerary-events/${event.id}`)
      .set('Authorization', authToken);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Itinerary event deleted successfully');

    const deletedEvent = await prisma.itineraryEvent.findUnique({
      where: { id: event.id },
    });
    expect(deletedEvent).toBeNull();
  });

  it('should allow assigning users to an event', async () => {
    const event = await prisma.itineraryEvent.create({
      data: {
        tripId,
        title: 'Food Tasting',
        startTime: new Date(),
        endTime: new Date(),
        category: 'MEAL',
        createdById: userId,
      },
    });

    const response = await request(app)
      .post(`/api/trips/${tripId}/itinerary-events/${event.id}/assign`)
      .set('Authorization', authToken)
      .send({ userIds: [userId] });

    expect(response.status).toBe(200);
    expect(response.body.assignedUsers.length).toBe(1);
  });

  it('should allow adding a note to an event', async () => {
    const event = await prisma.itineraryEvent.create({
      data: {
        tripId,
        title: 'Notre Dame Visit',
        startTime: new Date(),
        endTime: new Date(),
        category: 'ACTIVITY',
        createdById: userId,
      },
    });

    const response = await request(app)
      .post(`/api/trips/${tripId}/itinerary-events/${event.id}/notes`)
      .set('Authorization', authToken)
      .send({ content: 'Remember to take pictures!' });

    expect(response.status).toBe(201);
    expect(response.body.note.content).toBe('Remember to take pictures!');
  });
});
