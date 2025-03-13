import { createNotification } from '@/services/notificationService.js';
import prisma from '@/config/prismaClient.js';

jest.mock('@/config/prismaClient.js', () => ({
  notification: { createMany: jest.fn() },
  scheduledNotification: { createMany: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createNotification', () => {
  const baseOptions = {
    userIds: ['user1'],
    tripId: 1,
    type: 'TEST',
    title: 'Test Title',
    message: 'Test Message',
  };

  it('creates scheduled notifications when sendAt is in the future', async () => {
    const sendAt = new Date(Date.now() + 60000); // 1 minute in future

    await createNotification({
      ...baseOptions,
      sendAt,
    });

    expect(prisma.scheduledNotification.createMany).toHaveBeenCalledWith({
      data: baseOptions.userIds.map((uid) => ({
        userId: uid,
        tripId: baseOptions.tripId,
        type: baseOptions.type,
        title: baseOptions.title,
        message: baseOptions.message,
        sendAt,
        isSent: false,
        relatedId: undefined,
        data: undefined,
        channel: 'IN_APP',
      })),
    });
  });

  it('creates immediate notifications when sendAt is in the past', async () => {
    await createNotification({
      ...baseOptions,
      sendAt: new Date(Date.now() - 1000),
    });

    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: baseOptions.userIds.map((uid) => ({
        userId: uid,
        tripId: baseOptions.tripId,
        type: baseOptions.type,
        relatedId: undefined,
        title: baseOptions.title,
        message: baseOptions.message,
        data: undefined,
        channel: 'IN_APP',
      })),
    });
  });

  it('does nothing when userIds is empty', async () => {
    await createNotification({ ...baseOptions, userIds: [] });
    expect(prisma.notification.createMany).not.toHaveBeenCalled();
    expect(prisma.scheduledNotification.createMany).not.toHaveBeenCalled();
  });
});
