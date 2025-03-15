import prisma from '@/config/prismaClient.js';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

beforeAll(async () => {
  console.log('🔄 Starting test setup...');

  try {
    // Ensure migrations are applied before tests start
    execSync('npx prisma migrate dev --name test-init', { stdio: 'inherit' });
  } catch (error) {
    console.error('⚠️ Error applying migrations:', error);
    process.exit(1);
  }
});

beforeEach(async () => {
  console.log('♻️ Resetting database before test...');

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
});

afterAll(async () => {
  console.log('🛑 Closing Prisma connection...');
  await prisma.$disconnect();
});
