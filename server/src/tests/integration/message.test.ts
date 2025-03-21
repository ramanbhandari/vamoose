import request from 'supertest';
import app from '@/app.js';
import mongoose from 'mongoose';
import connectMongoDB from '@/db/mongo.js';
import Message from '@/models/message.model.js';
import prisma from '@/config/prismaClient.js';
import { DateTime } from 'luxon';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

describe('Chat Message API Integration Tests', () => {
  let userId: string, authToken: string, tripId: number;
  const secret = process.env.SUPABASE_JWT_SECRET;
  const tripStartDate = '2025-05-01';
  const tripEndDate = '2025-05-30';

  beforeAll(async () => {
    //connect to the test database
    connectMongoDB();

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

  afterEach(async () => {
    await Message.deleteMany({ tripId });
  });

  afterAll(async () => {
    await prisma.trip.deleteMany();
    await prisma.user.deleteMany();
    await mongoose.connection.close();
  });

  // ==========================
  // CREATE MESSAGE TEST
  // ==========================
  it('should create a new message in the trip chat', async () => {
    const response = await request(app)
      .post(`/api/trips/${tripId}/messages/sendMessage`)
      .set('Authorization', authToken)
      .send({ text: 'Hello, team!' });

    expect(response.status).toBe(201);
    expect(response.body.savedMessage).toHaveProperty('messageId');
    expect(response.body.savedMessage.text).toBe('Hello, team!');

    const message = await Message.findOne({
      messageId: response.body.savedMessage.messageId,
    });
    expect(message).not.toBeNull();
  });

  // ==========================
  // FETCH MESSAGE TEST
  // ==========================
  it('should fetch messages for a trip', async () => {
    await Message.create({
      messageId: uuidv4(),
      userId,
      tripId,
      text: 'Test message',
    });

    const response = await request(app)
      .get(`/api/trips/${tripId}/messages`)
      .set('Authorization', authToken);

    expect(response.status).toBe(200);
    expect(response.body.messages.length).toBeGreaterThan(0);
  });

  // ==========================
  // ADD REACTION TEST
  // ==========================
  it('should add a reaction to a message', async () => {
    const message = await Message.create({
      messageId: uuidv4(),
      userId,
      tripId,
      text: 'React to me!',
    });

    const response = await request(app)
      .patch(`/api/trips/${tripId}/messages/${message.messageId}`)
      .set('Authorization', authToken)
      .send({ emoji: '👍' });

    expect(response.status).toBe(200);
    expect(response.body.updatedMessage.reactions).toHaveProperty('👍');
    expect(response.body.updatedMessage.reactions['👍']).toContain(userId);
  });
});
