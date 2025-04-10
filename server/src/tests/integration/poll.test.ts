import request from 'supertest';
import app from '@/app.js';
import prisma from '@/configs/prismaClient.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

describe('Poll + PollVote API Integration Tests', () => {
  let userId: string, authToken: string, tripId: number;
  const secret = process.env.SUPABASE_JWT_SECRET;

  beforeAll(async () => {
    if (!secret) {
      throw new Error(
        'SUPABASE_JWT_SECRET is not set in environment variables',
      );
    }

    userId = 'test-user-id';
    authToken = `Bearer ${jwt.sign({ sub: userId }, secret)}`;

    // Create a test user
    await prisma.user.create({
      data: { id: userId, email: 'creator@example.com' },
    });

    // Create a test trip
    const trip = await prisma.trip.create({
      data: {
        name: 'Test Trip',
        destination: 'Paris',
        startDate: new Date(),
        endDate: new Date(),
        createdBy: userId,
        members: { create: [{ userId, role: 'creator' }] },
      },
    });
    tripId = trip.id;
  });

  afterAll(async () => {
    await prisma.vote.deleteMany();
    await prisma.pollOption.deleteMany();
    await prisma.poll.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    await prisma.vote.deleteMany();
    await prisma.pollOption.deleteMany();
    await prisma.poll.deleteMany();
  });

  it('should create a poll successfully', async () => {
    const response = await request(app)
      .post(`/api/trips/${tripId}/polls`)
      .set('Authorization', authToken)
      .send({
        question: 'Where should we go?',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        options: ['Paris', 'Rome'],
      });

    expect(response.status).toBe(201);
    expect(response.body.poll).toHaveProperty('id');

    // Verify poll was actually created in DB
    const poll = await prisma.poll.findUnique({
      where: { id: response.body.poll.id },
    });
    expect(poll).not.toBeNull();
  });

  it('should fetch all polls for a trip', async () => {
    const createdPoll = await prisma.poll.create({
      data: {
        tripId,
        question: 'What activity should we do?',
        expiresAt: new Date(Date.now() + 86400000),
        createdById: userId,
        options: { create: [{ option: 'Hiking' }, { option: 'Swimming' }] },
      },
    });

    const response = await request(app)
      .get(`/api/trips/${tripId}/polls`)
      .set('Authorization', authToken);

    expect(response.status).toBe(200);
    expect(response.body.polls.some((p: any) => p.id === createdPoll.id)).toBe(
      true,
    );
  });

  it('should cast a vote on a poll', async () => {
    const poll = await prisma.poll.create({
      data: {
        tripId,
        question: 'Favorite cuisine?',
        expiresAt: new Date(Date.now() + 86400000),
        createdById: userId,
        options: { create: [{ option: 'Italian' }, { option: 'Japanese' }] },
      },
      include: { options: true },
    });

    const pollOptionId = poll.options[0].id;

    const response = await request(app)
      .post(`/api/trips/${tripId}/polls/${poll.id}/vote`)
      .set('Authorization', authToken)
      .send({ pollOptionId });

    expect(response.status).toBe(201);
    expect(response.body.vote).toHaveProperty('id');

    // Verify vote was actually stored in DB
    const vote = await prisma.vote.findUnique({
      where: { pollId_userId: { pollId: poll.id, userId } },
    });
    expect(vote).not.toBeNull();
  });

  it('should delete a vote from a poll', async () => {
    const poll = await prisma.poll.create({
      data: {
        tripId,
        question: 'Best drink?',
        expiresAt: new Date(Date.now() + 86400000),
        createdById: userId,
        options: { create: [{ option: 'Tea' }, { option: 'Coffee' }] },
      },
      include: { options: true },
    });

    const pollOptionId = poll.options[0].id;
    await prisma.vote.create({
      data: { pollId: poll.id, pollOptionId, userId },
    });

    const response = await request(app)
      .delete(`/api/trips/${tripId}/polls/${poll.id}/vote`)
      .set('Authorization', authToken);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Vote deleted successfully');

    // Verify vote was removed from DB
    const vote = await prisma.vote.findUnique({
      where: { pollId_userId: { pollId: poll.id, userId } },
    });
    expect(vote).toBeNull();
  });

  it('should complete a poll and determine a winner', async () => {
    const poll = await prisma.poll.create({
      data: {
        tripId,
        question: 'Best travel destination?',
        expiresAt: new Date(Date.now() + 86400000),
        createdById: userId,
        options: { create: [{ option: 'Bali' }, { option: 'Tokyo' }] },
      },
      include: { options: true },
    });

    await prisma.vote.create({
      data: { pollId: poll.id, pollOptionId: poll.options[0].id, userId },
    });

    const response = await request(app)
      .patch(`/api/trips/${tripId}/polls/${poll.id}/complete`)
      .set('Authorization', authToken);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('COMPLETED');

    // Verify poll status was updated in DB
    const updatedPoll = await prisma.poll.findUnique({
      where: { id: poll.id },
    });
    expect(updatedPoll?.status).toBe('COMPLETED');
  });

  it('should delete a poll successfully', async () => {
    const poll = await prisma.poll.create({
      data: {
        tripId,
        question: 'Preferred mode of transport?',
        expiresAt: new Date(Date.now() + 86400000),
        createdById: userId,
        options: { create: [{ option: 'Car' }, { option: 'Plane' }] },
      },
    });

    const response = await request(app)
      .delete(`/api/trips/${tripId}/polls/${poll.id}`)
      .set('Authorization', authToken);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Poll deleted successfully');

    // Verify poll was removed from DB
    const deletedPoll = await prisma.poll.findUnique({
      where: { id: poll.id },
    });
    expect(deletedPoll).toBeNull();
  });
});
