#!/usr/bin/env ts-node

import path from 'path';
import fs from 'fs';
import { spawn, execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve('server/.env.loadtest') });
import prisma from '../../config/prismaClient.ts';
import { generateSummaryReport } from 'k6-html-reporter';
import { NotificationType } from '../../interfaces/enums.ts';

console.log('✅ Using DATABASE_URL:', process.env.DATABASE_URL);

// Run migrations on load test DB
console.log('📦 Running Prisma migrate dev...');
execSync('npx prisma migrate dev --name test-init', {
  stdio: 'inherit',
});

// Create a test user
const userId = 'test-user-id';
await prisma.user.upsert({
  where: { id: userId },
  update: {},
  create: { id: userId, email: 'creator@example.com' },
});

const modules = [
  'trip',
  'invite',
  'expense',
  'expenseShare',
  'member',
  // 'message',
  'itinerary',
  'poll',
  'notification',
  'markedLocation',
];

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportDir = path.resolve(`src/tests/load/reports/${timestamp}`);
const bundleDir = path.resolve('src/tests/load/bundled');

if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

function runK6Script(module: string): Promise<string> {
  const scriptPath = path.join(bundleDir, `${module}.bundle.js`);
  const reportPath = path.join(reportDir, `${module}.json`);
  const cmd = 'k6';
  const args = [
    'run',
    '--quiet',
    `--env`,
    `REPORT_PATH=${reportPath}`,
    scriptPath,
  ];

  return new Promise((resolve, reject) => {
    console.log(`🚀 Running test: ${module}`);

    const child = spawn(cmd, args, { stdio: 'inherit' });

    child.on('exit', (code) => {
      if (code === 0) {
        console.log(`✅ Test complete: ${module}`);
        resolve(reportPath);
      } else {
        console.error(`❌ k6 exited with code ${code}`);
        reject(new Error(`k6 failed for ${module} (code: ${code})`));
      }
    });

    child.on('error', (err) => {
      console.error(`❌ Failed to start k6 for ${module}:`, err);
      reject(err);
    });
  });
}

function convertToHtml(jsonPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const baseName = path.basename(jsonPath, '.json');
      const htmlPath = path.join(reportDir, `${baseName}.report.html`);

      const options = {
        jsonFile: jsonPath,
        output: htmlPath,
      };

      generateSummaryReport(options);
      console.log(`📄 HTML report generated: ${htmlPath}`);
      resolve();
    } catch (err) {
      console.error(`❌ Failed to generate HTML for ${jsonPath}`, err);
      reject(err);
    }
  });
}

(async () => {
  console.log('🏁 Starting all load tests sequentially...\n');

  const jsonReports: string[] = [];

  try {
    for (const module of modules) {
      await setupTestData(module, parseInt(process.env.VUS ?? '10'));

      const reportPath = await runK6Script(module);
      jsonReports.push(reportPath);

      console.log(`🧹 Cleaning up database after ${module}...`);
      await cleanupTestDatabase();
    }
    console.log('\n📊 Generating HTML reports...');
    for (const jsonPath of jsonReports) {
      await convertToHtml(jsonPath);
    }

    console.log('\n🎉 All tests and reports completed successfully!');
  } catch (err) {
    console.error(err);
    console.error('\n❗ Some tests failed or reports could not be generated.');
    process.exit(1);
  }
})();

async function setupTestData(module: string, numVuIds: number) {
  switch (module) {
    case 'invite':
      console.log('📦 Seeding invite test data...');
      await prisma.user.upsert({
        where: { id: 'dummy-invitee-id' },
        update: {},
        create: {
          id: 'dummy-invitee-id',
          email: 'dummy-invitee@example.com',
        },
      });
      break;

    case 'notification':
      console.log(`📦 Seeding notification test data for ${numVuIds} VUs...`);

      for (let vuId = 1; vuId <= numVuIds; vuId++) {
        const userId = `test-user-${vuId}`;

        console.log(
          `📨 Seeding notifications for VU ${vuId} (User: ${userId})...`,
        );

        await prisma.user.upsert({
          where: { id: userId },
          update: {},
          create: {
            id: userId,
            email: `${userId}@test.com`,
          },
        });

        await prisma.notification.createMany({
          data: Array.from({ length: 2 }).map((_, i) => ({
            userId,
            title: `VU ${vuId} - Notification ${i + 1}`,
            message: `Test notification ${i + 1} for VU ${vuId}`,
            type: NotificationType.EVENT_REMINDER,
            isRead: false,
          })),
        });

        console.log(`✅ Seeded notifications for ${userId}`);
      }
      break;

    default:
      console.warn(`⚠️ No test data seeded for module: ${module}`);
      break;
  }
}

async function cleanupTestDatabase() {
  try {
    // Example: delete all trips created by the test user
    await prisma.trip.deleteMany({});
    await prisma.tripMember.deleteMany({});
    await prisma.tripInvitee.deleteMany({});
    await prisma.poll.deleteMany({});
    await prisma.pollOption.deleteMany({});
    await prisma.expense.deleteMany({});
    await prisma.expenseShare.deleteMany({});
    await prisma.itineraryEvent.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.markedLocation.deleteMany({});

    console.log('✅ DB cleanup complete.\n');
  } catch (err) {
    console.error('❌ Failed to clean up DB:', err);
    throw err;
  }
}
