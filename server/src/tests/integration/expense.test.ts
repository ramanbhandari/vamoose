import request from 'supertest';
import app from '@/app.js';
import prisma from '@/config/prismaClient.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

describe('Expense & Expense Share API Integration Tests', () => {
  let creatorId: string,
    creatorAuthToken: string,
    memberId: string,
    memberAuthToken: string,
    tripId: number;

  beforeAll(async () => {
    // Mock User IDs
    creatorId = 'creator-user-id';
    memberId = 'member-user-id';

    // Generate mock auth tokens
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) {
      throw new Error('SUPABASE_JWT_SECRET is not set');
    }
    creatorAuthToken = `Bearer ${jwt.sign({ sub: creatorId }, secret)}`;
    memberAuthToken = `Bearer ${jwt.sign({ sub: memberId }, secret)}`;

    // Insert test users into DB
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
    tripId = trip.id;
  });

  afterAll(async () => {
    await prisma.trip.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  //   beforeEach(async () => {
  //     // Create a new trip before each test
  //     const trip = await prisma.trip.create({
  //       data: {
  //         name: 'Test Trip',
  //         destination: 'Paris',
  //         startDate: new Date(),
  //         endDate: new Date(),
  //         createdBy: creatorId,
  //         members: {
  //           create: [
  //             { userId: creatorId, role: 'creator' },
  //             { userId: memberId, role: 'member' },
  //           ],
  //         },
  //       },
  //     });
  //     tripId = trip.id;
  //   });

  afterEach(async () => {
    await prisma.expense.deleteMany({});
  });

  // ==========================
  // EXPENSE CREATION TEST
  // ==========================
  it('should create an expense and split it among all trip members', async () => {
    const response = await request(app)
      .post(`/api/trips/${tripId}/expenses`)
      .set('Authorization', creatorAuthToken)
      .send({
        amount: 100,
        category: 'food',
        description: 'Dinner',
      });

    expect(response.status).toBe(201);
    expect(response.body.expense).toHaveProperty('id');
    const expenseId = response.body.expense.id;

    // Verify that the expense was split correctly among members
    const sharesResponse = await prisma.expenseShare.findMany({
      where: { expenseId: expenseId },
    });

    expect(sharesResponse.length).toBe(2); // Split between creator and member
    expect(sharesResponse[0].share).toBe(50);
  });

  // ==========================
  // FETCH EXPENSE TEST
  // ==========================
  it('should fetch a single expense successfully', async () => {
    const expense = await prisma.expense.create({
      data: {
        amount: 50,
        category: 'transportation',
        tripId,
        paidById: creatorId,
        shares: {
          create: [
            { userId: creatorId, share: 25 },
            { userId: memberId, share: 25 },
          ],
        },
      },
    });

    const response = await request(app)
      .get(`/api/trips/${tripId}/expenses/${expense.id}`)
      .set('Authorization', creatorAuthToken);

    expect(response.status).toBe(200);
    expect(response.body.expense.id).toBe(expense.id);
  });

  // ==========================
  // DEBT SUMMARY TEST
  // ==========================
  it('should return the correct debt summary for the trip', async () => {
    await prisma.expense.create({
      data: {
        amount: 50,
        category: 'transportation',
        tripId,
        paidById: creatorId,
        shares: {
          create: [
            { userId: creatorId, share: 25 },
            { userId: memberId, share: 25 },
          ],
        },
      },
    });

    const response = await request(app)
      .get(`/api/trips/${tripId}/expenseShares/debt-summary`)
      .set('Authorization', creatorAuthToken);

    expect(response.status).toBe(200);
    expect(response.body.summary.length).toBe(1); // One debt entry since one expense exists
  });

  // ==========================
  // SETTLE EXPENSE SHARES TEST
  // ==========================
  it('should allow a user to settle their share of an expense', async () => {
    const expense = await prisma.expense.create({
      data: {
        amount: 80,
        category: 'activities',
        tripId,
        paidById: creatorId,
        shares: {
          create: [
            { userId: creatorId, share: 40 },
            { userId: memberId, share: 40 },
          ],
        },
      },
    });

    const settleResponse = await request(app)
      .patch(`/api/trips/${tripId}/expenseShares/settle`)
      .set('Authorization', memberAuthToken)
      .send({
        expenseSharesToSettle: [
          { expenseId: expense.id, debtorUserId: memberId },
        ],
      });

    expect(settleResponse.status).toBe(200);
    expect(settleResponse.body.settledCount).toBe(1);
  });

  // ==========================
  // DELETE EXPENSE TEST
  // ==========================
  it('should allow the creator to delete an expense', async () => {
    const expense = await prisma.expense.create({
      data: {
        amount: 40,
        category: 'miscellaneous',
        tripId,
        paidById: creatorId,
        shares: {
          create: [
            { userId: creatorId, share: 20 },
            { userId: memberId, share: 20 },
          ],
        },
      },
    });

    const response = await request(app)
      .delete(`/api/trips/${tripId}/expenses/${expense.id}`)
      .set('Authorization', creatorAuthToken);

    expect(response.status).toBe(200);
    expect(response.body.expense.id).toBe(expense.id);
    expect(response.body.message).toBe('Expense deleted successfully');

    // Verify deletion
    const deletedExpense = await prisma.expense.findUnique({
      where: { id: expense.id },
    });
    expect(deletedExpense).toBeNull();

    const deletedShares = await prisma.expenseShare.findMany({
      where: { expenseId: expense.id },
    });
    expect(deletedShares.length).toBe(0);
  });
});
