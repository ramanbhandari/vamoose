/**
 * @file notificationService.ts
 * @description Service for managing notifications in the application.
 * Handles creation of immediate and scheduled notifications, and cleanup of scheduled notifications.
 * Supports both in-app and email notification channels.
 */

import prisma from '@/config/prismaClient.js';
import { NotificationType } from '@/interfaces/enums.js';
import { InputJsonValue } from '@prisma/client/runtime/library';
import { DateTime } from 'luxon';

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
  try {
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

    // if sendAt is in future, we add it to the ScheduledNotification table instead
    if (sendAt && sendAt > DateTime.now().toUTC().toJSDate()) {
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

    // Insert immediate notifications
    if (userIds.length > 0) {
      try {
        await prisma.notification.createMany({
          data: userIds.map((uid) => ({
            userId: uid,
            tripId,
            type,
            relatedId,
            title,
            message,
            data,
            channel,
          })),
        });
      } catch (immediateError) {
        console.error(
          '[Notification] Error creating immediate notifications:',
          immediateError,
        );
      }
    }
  } catch (error) {
    console.error(
      '[Notification] Unexpected error in createNotification:',
      error,
    );
  }
}

/**
 * Removes scheduled notifications for a specific related entity (e.g., trip, event).
 *
 * @param relatedId - The ID of the related entity (e.g., itinerary event, trip).
 * @param types - Optional list of notification types to remove. If not provided, removes all scheduled notifications for the entity.
 */
export async function removeScheduledNotifications(
  relatedId: number,
  types?: NotificationType[],
): Promise<void> {
  try {
    const whereCondition: any = { relatedId };

    // If specific types are provided, filter by them; otherwise, delete all notifications for the entity
    if (types && types.length > 0) {
      whereCondition.type = { in: types };
    }

    const deletedCount = await prisma.scheduledNotification.deleteMany({
      where: whereCondition,
    });

    console.log(
      `[Notification] Removed ${deletedCount.count} scheduled notifications for relatedId: ${relatedId}, types: ${types ? types.join(', ') : 'ALL'}`,
    );
  } catch (error) {
    console.error(
      `[Notification] Error removing scheduled notifications for relatedId ${relatedId}:`,
      error,
    );
  }
}
