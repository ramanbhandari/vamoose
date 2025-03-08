import prisma from '@/config/prismaClient.js';
import { InputJsonValue } from '@prisma/client/runtime/library';

interface CreateNotificationOptions {
  userIds: string[];
  tripId: number;
  type: string;
  relatedId?: number;
  title: string;
  message: string;
  data?: InputJsonValue | undefined;
  channel?: 'IN_APP' | 'EMAIL';
  sendAt?: Date;
}

/**
 * Creates either immediate notifications or schedules them to send later
  - If `sendAt` is in the future, we insert into ScheduledNotification table
  - Else we insert directly into Notification table
 */
export async function createNotification(
  options: CreateNotificationOptions,
): Promise<void> {
  const {
    userIds,
    tripId,
    type,
    relatedId,
    title,
    message,
    data,
    channel = 'IN_APP',
    sendAt,
  } = options;

  // if sendAt is in future, we add it to the ScheduleNotification table instead
  // Our cron job will put it in Notifications table when it is time
  if (sendAt && sendAt.getTime() > Date.now()) {
    try {
      await prisma.scheduledNotification.createMany({
        data: userIds.map((uid) => ({
          userId: uid,
          tripId,
          type,
          relatedId,
          title,
          message,
          data,
          channel,
          sendAt,
          isSent: false,
        })),
      });
    } catch (scheduledError) {
      console.error(
        '[Notification] Error scheduling notifications:',
        scheduledError,
      );
    }
    return;
  }

  // insert in the Notifications table
  // createMany since we mostly would want to send notifications to all or everyone except creator of the action
  if (userIds.length > 0) {
    try {
      await prisma.notification.createMany({
        data: userIds.map((uid) => ({
          userId: uid,
          type,
          relatedId,
          title,
          message,
          data,
        })),
      });
    } catch (immediateError) {
      console.error(
        '[Notification] Error creating immediate notifications:',
        immediateError,
      );
    }
  }
}
