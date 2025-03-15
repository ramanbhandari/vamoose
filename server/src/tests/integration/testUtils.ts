import prisma from '@/config/prismaClient.js';

/**
 * Cleans up test data related to trips and members.
 * This should be called in `afterEach` or `afterAll` as needed.
 */
export const cleanupTestData = async () => {
  console.log('🧹 Running global test data cleanup...');

  await prisma.$transaction([
    prisma.itineraryEventAssignment.deleteMany({}),
    prisma.eventNote.deleteMany({}),
    prisma.itineraryEvent.deleteMany({}),
    prisma.tripMember.deleteMany({}),
    prisma.tripInvitee.deleteMany({}),
    prisma.pollOption.deleteMany({}),
    prisma.vote.deleteMany({}),
    prisma.poll.deleteMany({}),
    prisma.expenseShare.deleteMany({}),
    prisma.expense.deleteMany({}),
    prisma.packingItem.deleteMany({}),
    prisma.message.deleteMany({}),
    prisma.stay.deleteMany({}),
    prisma.trip.deleteMany({}),
    prisma.user.deleteMany({}),
    prisma.notification.deleteMany({}),
    prisma.scheduledNotification.deleteMany({}),
  ]);
};
