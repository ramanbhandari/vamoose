import cron from 'node-cron';
import prisma from '@/config/prismaClient.js';
import { createNotification } from '@/services/notificationService.js';

cron.schedule('*/5 * * * *', async () => {
  console.log('[CRON] Checking for due scheduled notifications...');
  const now = new Date();

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
      expiresAt: { lt: now },
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

    let winnerOptionId: number | null = null;
    if (tiedOptionIds.length === 0) {
      // if no votes, no winner
      winnerOptionId = null;
    } else if (tiedOptionIds.length === 1) {
      winnerOptionId = tiedOptionIds[0];
    } else {
      // in case of tie lets just take the smallest option id
      winnerOptionId = Math.min(...tiedOptionIds);
    }

    // update the poll, mark it COMPLETED, record the winner, set completedAt
    await prisma.poll.update({
      where: { id: poll.id },
      data: {
        status: 'COMPLETED',
        winnerId: winnerOptionId,
        completedAt: now,
      },
    });

    // Notify all trip members that the poll is completeed
    const tripMembers = await prisma.tripMember.findMany({
      where: { tripId: poll.tripId },
      select: { userId: true },
    });

    const otherUserIds = tripMembers.map((m) => m.userId);

    await createNotification({
      userIds: otherUserIds,
      tripId: poll.tripId,
      type: 'POLL_COMPLETED',
      relatedId: poll.id,
      title: 'Poll Completed',
      message: `Poll "${poll.question}" has ended.`,
      channel: 'IN_APP',
    });

    console.log(
      `[CRON] Poll ${poll.id} expired and completed. Winner Option ID: ${winnerOptionId}`,
    );
  }
});
