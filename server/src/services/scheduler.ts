/**
 * @file scheduler.ts
 * @description Cron job scheduler for handling scheduled tasks.
 * Processes scheduled notifications and manages poll expiration/completion.
 * Runs every 5 minutes to check for due notifications and expired polls.
 */

import cron from 'node-cron';
import prisma from '@/configs/prismaClient.js';
import { NotificationType, PollStatus } from '@/daos/enums.js';
import { notifyTripMembers } from '@/utils/notificationHandlers.js';
import { DateTime } from 'luxon';

cron.schedule('*/5 * * * *', async () => {
  console.log('[CRON] Checking for due scheduled notifications...');
  const now = DateTime.now().toUTC().toJSDate();

  // find items that are due now
  const dueItems = await prisma.scheduledNotification.findMany({
    where: {
      isSent: false,
      sendAt: { lte: now },
    },
  });

  if (dueItems.length !== 0) {
    // first set it to true so if there is any duplication, the notification isn't scheduled more than once
    const dueIds = dueItems.map((d) => d.id);
    await prisma.scheduledNotification.updateMany({
      where: { id: { in: dueIds } },
      data: { isSent: true },
    });

    // inser in the Notifications table, our frontend should pick any changes from that table RealTime
    const notificationsToCreate = dueItems.map((item) => ({
      userId: item.userId,
      type: item.type,
      relatedId: item.relatedId,
      title: item.title,
      message: item.message,
      data: item.data || undefined,
    }));
    await prisma.notification.createMany({ data: notificationsToCreate });
  }
  console.log(`[CRON] Processed ${dueItems.length} scheduled notifications!!`);

  console.log('[CRON] Checking for expired polls...');

  const expiredPolls = await prisma.poll.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lte: now },
    },
    include: {
      options: {
        include: {
          votes: true,
        },
      },
      trip: true,
      createdBy: true,
    },
  });

  for (const poll of expiredPolls) {
    let maxVotes = -1;
    let tiedOptionIds: number[] = [];

    // Compute vote counts for each option.
    for (const option of poll.options) {
      const voteCount = option.votes.length;
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        tiedOptionIds = [option.id];
      } else if (voteCount === maxVotes) {
        tiedOptionIds.push(option.id);
      }
    }

    let status: PollStatus = PollStatus.COMPLETED;
    let winnerOptionId: number | null = null;
    let tiedOptions: { id: number; option: string; voteCount: number }[] = [];

    if (tiedOptionIds.length > 1) {
      status = PollStatus.TIE;
      tiedOptions = poll.options
        .filter((option) => tiedOptionIds.includes(option.id))
        .map((option) => ({
          id: option.id,
          option: option.option,
          voteCount: option.votes.length,
        }));
    } else if (tiedOptionIds.length === 1) {
      winnerOptionId = tiedOptionIds[0];
    }

    // mark it complete or tie
    await prisma.poll.update({
      where: { id: poll.id },
      data: {
        status: status,
        winnerId: winnerOptionId,
        completedAt: poll.expiresAt,
      },
    });

    // notification message based on status
    const notificationMessage =
      status === 'TIE'
        ? `Poll "${poll.question}" ended in a tie among the top options: ${tiedOptions
            .map((opt) => opt.option)
            .join(', ')}.`
        : winnerOptionId
          ? `Poll "${poll.question}" has been completed. The winning option is "${
              poll.options.find((opt) => opt.id === winnerOptionId)?.option
            }".`
          : `Poll "${poll.question}" has ended with no votes.`;

    // notify all trip members except the poll creator
    await notifyTripMembers(poll.tripId, {
      type: NotificationType.POLL_COMPLETE,
      relatedId: poll.id,
      title: 'Poll Completed',
      message: notificationMessage,
      channel: 'IN_APP',
    });

    console.log(
      `[CRON] Poll ${poll.id} expired and completed. Status: ${status}, Winner Option ID: ${winnerOptionId}`,
    );
  }
});
