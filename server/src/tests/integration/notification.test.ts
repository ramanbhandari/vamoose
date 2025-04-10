import request from 'supertest';
import app from '@/app.js';
import prisma from '@/configs/prismaClient.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

describe('Notifications API Integration Tests', () => {
  let userId: string, authToken: string;
  const secret = process.env.SUPABASE_JWT_SECRET;

  beforeAll(async () => {
    if (!secret) {
      throw new Error(
        'SUPABASE_JWT_SECRET is not set in environment variables',
      );
    }

    userId = 'test-user-id';
    authToken = `Bearer ${jwt.sign({ sub: userId }, secret)}`;

    await prisma.user.create({
      data: { id: userId, email: 'user@example.com' },
    });
  });

  afterEach(async () => {
    await prisma.notification.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
  });

  it('should fetch notifications for a user', async () => {
    await prisma.notification.createMany({
      data: [
        {
          userId,
          tripId: 1,
          type: 'POLL_CREATED',
          title: 'Test 1',
          message: 'Message 1',
        },
        {
          userId,
          tripId: 1,
          type: 'POLL_COMPLETED',
          title: 'Test 2',
          message: 'Message 2',
        },
      ],
    });

    const response = await request(app)
      .get(`/api/notifications`)
      .set('Authorization', authToken);

    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(2);
  });

  it('should mark a notification as read', async () => {
    const notification = await prisma.notification.create({
      data: {
        userId,
        tripId: 1,
        type: 'EXPENSE_CREATED',
        title: 'Test',
        message: 'Message',
        isRead: false,
      },
    });

    const response = await request(app)
      .patch(`/api/notifications/${notification.id}/mark-as-read`)
      .set('Authorization', authToken);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Notification marked as read');

    const updatedNotification = await prisma.notification.findUnique({
      where: { id: notification.id },
    });
    expect(updatedNotification?.isRead).toBe(true);
  });

  it('should delete a notification', async () => {
    const notification = await prisma.notification.create({
      data: {
        userId,
        tripId: 1,
        type: 'EXPENSE_SHARE_SETTLED',
        title: 'To Delete',
        message: 'Message',
      },
    });

    const response = await request(app)
      .delete(`/api/notifications/${notification.id}/clear`)
      .set('Authorization', authToken);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Notification deleted successfully');

    const deletedNotification = await prisma.notification.findUnique({
      where: { id: notification.id },
    });
    expect(deletedNotification).toBeNull();
  });
});
