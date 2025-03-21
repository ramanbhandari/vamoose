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
  const secret = process.env.SUPABASE_JWT_SECRET || '';
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
  // GET ALL MESSAGES TEST
  // ==========================
  it('should get all messages with correct ordering and structure', async () => {
    // Create multiple messages with different timestamps
    const message1 = await Message.create({
      messageId: uuidv4(),
      userId,
      tripId,
      text: 'First message',
      createdAt: new Date(Date.now() - 3000), // 3 seconds ago
    });

    const message2 = await Message.create({
      messageId: uuidv4(),
      userId,
      tripId,
      text: 'Second message',
      createdAt: new Date(Date.now() - 2000), // 2 seconds ago
    });

    const message3 = await Message.create({
      messageId: uuidv4(),
      userId,
      tripId,
      text: 'Third message',
      reactions: { '👍': [userId] },
      createdAt: new Date(Date.now() - 1000), // 1 second ago
    });

    const response = await request(app)
      .get(`/api/trips/${tripId}/messages`)
      .set('Authorization', authToken);

    expect(response.status).toBe(200);
    expect(response.body.messages.length).toBe(3);

    // Check chronological ordering (oldest first)
    expect(response.body.messages[0].text).toBe('First message');
    expect(response.body.messages[1].text).toBe('Second message');
    expect(response.body.messages[2].text).toBe('Third message');

    // Verify message structure and content
    const lastMessage = response.body.messages[2];
    expect(lastMessage).toHaveProperty('messageId');
    expect(lastMessage).toHaveProperty('tripId', String(tripId));
    expect(lastMessage).toHaveProperty('userId', userId);
    expect(lastMessage).toHaveProperty('text', 'Third message');
    expect(lastMessage).toHaveProperty('reactions');
    expect(lastMessage.reactions).toHaveProperty('👍');
    expect(lastMessage.reactions['👍']).toContain(userId);
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

  // ==========================
  // UPDATE COMPLETE REACTIONS TEST
  // ==========================
  it('should update all reactions on a message', async () => {
    const message = await Message.create({
      messageId: uuidv4(),
      userId,
      tripId,
      text: 'React to me completely!',
      reactions: { '😀': [userId] },
    });

    const newReactions = { '👍': [userId], '❤️': [userId] };

    const response = await request(app)
      .patch(`/api/trips/${tripId}/messages/${message.messageId}`)
      .set('Authorization', authToken)
      .send({ reactions: newReactions });

    expect(response.status).toBe(200);
    expect(response.body.updatedMessage.reactions).toEqual(newReactions);
    expect(response.body.updatedMessage.reactions).not.toHaveProperty('😀');
  });

  // ==========================
  // REMOVE REACTION TEST
  // ==========================
  it('should remove a reaction from a message', async () => {
    const message = await Message.create({
      messageId: uuidv4(),
      userId,
      tripId,
      text: 'Remove reaction from me!',
      reactions: { '👍': [userId], '❤️': [userId] },
    });

    const response = await request(app)
      .patch(
        `/api/trips/${tripId}/messages/${message.messageId}/removeReaction`,
      )
      .set('Authorization', authToken)
      .send({ emoji: '👍' });

    expect(response.status).toBe(200);
    expect(response.body.updatedMessage.reactions).not.toHaveProperty('👍');
    expect(response.body.updatedMessage.reactions).toHaveProperty('❤️');
  });

  // ==========================
  // UNAUTHORIZED ACCESS TEST
  // ==========================
  it('should reject unauthorized message access', async () => {
    const response = await request(app)
      .get(`/api/trips/${tripId}/messages`)
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });

  // ==========================
  // NON-MEMBER ACCESS TEST
  // ==========================
  it('should reject message creation from non-trip members', async () => {
    // Create a different user not in the trip
    const nonMemberUserId = 'non-member-user';

    // Ensure secret is a string and not undefined for TypeScript
    if (!secret) throw new Error('JWT Secret is required');
    const nonMemberToken = `Bearer ${jwt.sign({ sub: nonMemberUserId }, secret)}`;

    await prisma.user.create({
      data: { id: nonMemberUserId, email: 'nonmember@example.com' },
    });

    const response = await request(app)
      .post(`/api/trips/${tripId}/messages/sendMessage`)
      .set('Authorization', nonMemberToken)
      .send({ text: 'This should fail' });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('not a member of this trip');

    // Clean up the non-member user
    await prisma.user.delete({ where: { id: nonMemberUserId } });
  });
});
