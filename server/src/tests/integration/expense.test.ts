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
    creatorId = 'creator-user-id';
    memberId = 'member-user-id';

    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) {
      throw new Error('SUPABASE_JWT_SECRET is not set');
    }

    creatorAuthToken = `Bearer ${jwt.sign({ sub: creatorId }, secret)}`;
    memberAuthToken = `Bearer ${jwt.sign({ sub: memberId }, secret)}`;

    // Create test users
    await prisma.user.createMany({
      data: [
        { id: creatorId, email: 'creator@example.com' },
        { id: memberId, email: 'member@example.com' },
      ],
      skipDuplicates: true,
    });

    // Create a test trip
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
    await prisma.expense.deleteMany({});
    await prisma.trip.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterEach(async () => {
    await prisma.expenseShare.deleteMany({});
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

    // Verify expense exists in DB
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });
    expect(expense).not.toBeNull();

    // Verify expense shares were created correctly
    const shares = await prisma.expenseShare.findMany({ where: { expenseId } });
    expect(shares.length).toBe(2); // Split between creator and member
    expect(shares.every((s) => s.share === 50)).toBe(true);
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
    expect(response.body.summary.length).toBeGreaterThan(0);
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

    // Verify expense share was marked as settled
    const updatedShare = await prisma.expenseShare.findFirst({
      where: { expenseId: expense.id, userId: memberId },
    });
    expect(updatedShare?.settled).toBe(true);
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

    // Verify expense was deleted from DB
    const deletedExpense = await prisma.expense.findUnique({
      where: { id: expense.id },
    });
    expect(deletedExpense).toBeNull();

    // Verify related expense shares were deleted
    const deletedShares = await prisma.expenseShare.findMany({
      where: { expenseId: expense.id },
    });
    expect(deletedShares.length).toBe(0);
  });

  // ==========================
  // DELETE MULTIPLE EXPENSES TEST
  // ==========================
  it('should delete multiple expenses in a trip', async () => {
    const expense1 = await prisma.expense.create({
      data: {
        amount: 30,
        category: 'food',
        tripId,
        paidById: creatorId,
        shares: {
          create: [
            { userId: creatorId, share: 15 },
            { userId: memberId, share: 15 },
          ],
        },
      },
    });

    const expense2 = await prisma.expense.create({
      data: {
        amount: 60,
        category: 'transportation',
        tripId,
        paidById: creatorId,
        shares: {
          create: [
            { userId: creatorId, share: 30 },
            { userId: memberId, share: 30 },
          ],
        },
      },
    });

    const response = await request(app)
      .delete(`/api/trips/${tripId}/expenses`)
      .set('Authorization', creatorAuthToken)
      .send({ expenseIds: [expense1.id, expense2.id] });

    expect(response.status).toBe(200);
    expect(response.body.deletedCount).toBe(2);

    // Verify both expenses were deleted
    const deletedExpenses = await prisma.expense.findMany({
      where: { id: { in: [expense1.id, expense2.id] } },
    });
    expect(deletedExpenses.length).toBe(0);
  });
});
