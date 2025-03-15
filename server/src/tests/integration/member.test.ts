import request from 'supertest';
import app from '@/app.js';
import prisma from '@/config/prismaClient.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

describe('Trip Membership & Invitation API Integration Tests', () => {
  let secret: string;

  beforeAll(() => {
    secret = process.env.SUPABASE_JWT_SECRET as string;
    if (!secret) throw new Error('SUPABASE_JWT_SECRET is not set.');
  });

  afterEach(async () => {
    await prisma.trip.deleteMany({});
    await prisma.user.deleteMany({});
  });

  // ==========================
  // INVITATION TESTS
  // ==========================

  it('should create an invitation successfully', async () => {
    const creatorId = 'creator-user-id';
    const creatorAuthToken = `Bearer ${jwt.sign({ sub: creatorId }, secret)}`;

    await prisma.user.create({
      data: { id: creatorId, email: 'creator@example.com' },
    });

    const trip = await prisma.trip.create({
      data: {
        name: 'Test Trip',
        destination: 'Paris',
        startDate: new Date(),
        endDate: new Date(),
        createdBy: creatorId,
        members: { create: { userId: creatorId, role: 'creator' } },
      },
    });

    const response = await request(app)
      .post(`/api/trips/${trip.id}/invites/create`)
      .set('Authorization', creatorAuthToken)
      .send({ email: 'invitee@example.com' });

    expect(response.status).toBe(201);
    expect(response.body.inviteUrl).toBeDefined();
  });

  it('should validate the invite', async () => {
    const creatorId = 'creator-user-id';
    const inviteeId = 'invitee-user-id';
    const creatorAuthToken = `Bearer ${jwt.sign({ sub: creatorId }, secret)}`;
    const inviteeAuthToken = `Bearer ${jwt.sign({ sub: inviteeId }, secret)}`;

    await prisma.user.createMany({
      data: [
        { id: creatorId, email: 'creator@example.com' },
        { id: inviteeId, email: 'invitee@example.com' },
      ],
      skipDuplicates: true,
    });

    const trip = await prisma.trip.create({
      data: {
        name: 'Test Trip',
        destination: 'Paris',
        startDate: new Date(),
        endDate: new Date(),
        createdBy: creatorId,
        members: { create: { userId: creatorId, role: 'creator' } },
      },
    });

    const inviteResponse = await request(app)
      .post(`/api/trips/${trip.id}/invites/create`)
      .set('Authorization', creatorAuthToken)
      .send({ email: 'invitee@example.com' });

    const inviteToken = inviteResponse.body.inviteUrl.split('/').pop();

    const validateResponse = await request(app)
      .get(`/api/trips/${trip.id}/invites/validate/${inviteToken}`)
      .set('Authorization', inviteeAuthToken);

    expect(validateResponse.status).toBe(200);
    expect(validateResponse.body.trip.destination).toBe('Paris');
  });

  it('should allow the invitee to accept the invite and join the trip', async () => {
    const creatorId = 'creator-user-id';
    const inviteeId = 'invitee-user-id';
    const creatorAuthToken = `Bearer ${jwt.sign({ sub: creatorId }, secret)}`;
    const inviteeAuthToken = `Bearer ${jwt.sign({ sub: inviteeId }, secret)}`;

    await prisma.user.createMany({
      data: [
        { id: creatorId, email: 'creator@example.com' },
        { id: inviteeId, email: 'invitee@example.com' },
      ],
      skipDuplicates: true,
    });

    const trip = await prisma.trip.create({
      data: {
        name: 'Test Trip',
        destination: 'Paris',
        startDate: new Date(),
        endDate: new Date(),
        createdBy: creatorId,
        members: { create: { userId: creatorId, role: 'creator' } },
      },
    });

    const inviteResponse = await request(app)
      .post(`/api/trips/${trip.id}/invites/create`)
      .set('Authorization', creatorAuthToken)
      .send({ email: 'invitee@example.com' });

    const inviteToken = inviteResponse.body.inviteUrl.split('/').pop();

    const acceptResponse = await request(app)
      .post(`/api/trips/${trip.id}/invites/accept/${inviteToken}`)
      .set('Authorization', inviteeAuthToken);

    expect(acceptResponse.status).toBe(200);
    expect(acceptResponse.body.message).toBe('Invite accepted');
  });

  it('should reject an invite', async () => {
    const creatorId = 'creator-user-id';
    const inviteeId = 'invitee-user-id';
    const creatorAuthToken = `Bearer ${jwt.sign({ sub: creatorId }, secret)}`;
    const inviteeAuthToken = `Bearer ${jwt.sign({ sub: inviteeId }, secret)}`;

    await prisma.user.createMany({
      data: [
        { id: creatorId, email: 'creator@example.com' },
        { id: inviteeId, email: 'invitee@example.com' },
      ],
      skipDuplicates: true,
    });

    const trip = await prisma.trip.create({
      data: {
        name: 'Test Trip',
        destination: 'Paris',
        startDate: new Date(),
        endDate: new Date(),
        createdBy: creatorId,
        members: { create: { userId: creatorId, role: 'creator' } },
      },
    });

    const inviteResponse = await request(app)
      .post(`/api/trips/${trip.id}/invites/create`)
      .set('Authorization', creatorAuthToken)
      .send({ email: 'invitee@example.com' });

    const inviteToken = inviteResponse.body.inviteUrl.split('/').pop();

    const rejectResponse = await request(app)
      .post(`/api/trips/${trip.id}/invites/reject/${inviteToken}`)
      .set('Authorization', inviteeAuthToken);

    expect(rejectResponse.status).toBe(200);
    expect(rejectResponse.body.message).toBe('Invite rejected.');
  });

  // ==========================
  // MEMBERSHIP TESTS
  // ==========================

  it('should allow an admin to update a member’s role', async () => {
    const creatorId = 'creator-user-id';
    const adminId = 'admin-user-id';
    const memberId = 'member-user-id';
    const adminAuthToken = `Bearer ${jwt.sign({ sub: adminId }, secret)}`;

    await prisma.user.createMany({
      data: [
        { id: creatorId, email: 'creator@example.com' },
        { id: adminId, email: 'admin@example.com' },
        { id: memberId, email: 'member@example.com' },
      ],
      skipDuplicates: true,
    });

    const trip = await prisma.trip.create({
      data: {
        name: 'Test Trip',
        destination: 'Paris',
        startDate: new Date(),
        endDate: new Date(),
        createdBy: creatorId,
        members: {
          create: [
            { userId: creatorId, role: 'creator' },
            { userId: adminId, role: 'admin' },
            { userId: memberId, role: 'member' },
          ],
        },
      },
    });

    const response = await request(app)
      .patch(`/api/trips/${trip.id}/members/${memberId}`)
      .set('Authorization', adminAuthToken)
      .send({ role: 'admin' });

    expect(response.status).toBe(200);
    expect(response.body.member.role).toBe('admin');
  });

  it('should allow a creator to remove a admin from the trip', async () => {
    const creatorId = 'creator-user-id';
    const adminId = 'admin-user-id';
    const creatorAuthToken = `Bearer ${jwt.sign({ sub: creatorId }, secret)}`;

    await prisma.user.createMany({
      data: [
        { id: creatorId, email: 'creator@example.com' },
        { id: adminId, email: 'admin@example.com' },
      ],
      skipDuplicates: true,
    });

    const trip = await prisma.trip.create({
      data: {
        name: 'Test Trip',
        destination: 'Paris',
        startDate: new Date(),
        endDate: new Date(),
        createdBy: creatorId,
        members: {
          create: [
            { userId: creatorId, role: 'creator' },
            { userId: adminId, role: 'admin' },
          ],
        },
      },
    });

    const response = await request(app)
      .delete(`/api/trips/${trip.id}/members/${adminId}`)
      .set('Authorization', creatorAuthToken);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Member removed successfully');
  });

  it('should allow a member to leave the trip voluntarily', async () => {
    const creatorId = 'creator-user-id';
    const memberId = 'member-user-id';
    const memberAuthToken = `Bearer ${jwt.sign({ sub: memberId }, secret)}`;

    await prisma.user.createMany({
      data: [
        { id: creatorId, email: 'creator@example.com' },
        { id: memberId, email: 'member@example.com' },
      ],
      skipDuplicates: true,
    });

    const trip = await prisma.trip.create({
      data: {
        name: 'Test Trip',
        destination: 'Paris',
        startDate: new Date(),
        endDate: new Date(),
        createdBy: creatorId,
        members: {
          create: [
            { userId: creatorId, role: 'creator' },
            { userId: memberId, role: 'member' },
          ],
        },
      },
    });

    const response = await request(app)
      .delete(`/api/trips/${trip.id}/members/leave`)
      .set('Authorization', memberAuthToken);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('You have left the trip successfully');

    // Verify member is no longer part of the trip
    const membersAfterLeave = await prisma.tripMember.findMany({
      where: { tripId: trip.id },
    });

    expect(membersAfterLeave.length).toBe(1);
    expect(membersAfterLeave[0].userId).toBe(creatorId); // Only creator should remain
  });

  it('should prevent the creator from leaving the trip', async () => {
    const creatorId = 'creator-user-id';
    const creatorAuthToken = `Bearer ${jwt.sign({ sub: creatorId }, secret)}`;

    await prisma.user.create({
      data: { id: creatorId, email: 'creator@example.com' },
    });

    const trip = await prisma.trip.create({
      data: {
        name: 'Test Trip',
        destination: 'Paris',
        startDate: new Date(),
        endDate: new Date(),
        createdBy: creatorId,
        members: { create: { userId: creatorId, role: 'creator' } },
      },
    });

    const response = await request(app)
      .delete(`/api/trips/${trip.id}/members/leave`)
      .set('Authorization', creatorAuthToken);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe(
      'Creators cannot leave a trip. Delete the trip instead.',
    );
  });
});
