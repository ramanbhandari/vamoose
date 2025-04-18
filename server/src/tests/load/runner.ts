import path from 'path';
import fs from 'fs';
import { spawn, execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve('server/.env.loadtest') });

import prisma from '../../config/prismaClient.ts';
import { generateSummaryReport } from 'k6-html-reporter';
import { NotificationType } from '../../interfaces/enums.ts';

console.log('✅ Using DATABASE_URL:', process.env.DATABASE_URL);

// Run migrations on the load test DB
console.log('📦 Running Prisma migrate dev...');
execSync('npx prisma migrate dev --name test-init', {
  stdio: 'inherit',
});

// Define test modules
const modules = [
  'trip',
  'invite',
  'expense',
  'expenseShare',
  'member',
  'itinerary',
  'poll',
  'notification',
  'markedLocation',
  'message',
];

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportDir = path.resolve(`src/tests/load/reports/${timestamp}`);
const bundleDir = path.resolve('src/tests/load/bundled');

// Ensure report directory exists
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

/**
 * Runs a k6 script in a separate process.
 */
function runK6Script(module: string): Promise<string> {
  const scriptPath = path.join(bundleDir, `${module}.bundle.js`);
  const reportPath = path.join(reportDir, `${module}.json`);
  const cmd = 'k6';
  const args = [
    'run',
    '--quiet',
    '--address',
    '', // Disables the K6 API server
    '--env',
    `REPORT_PATH=${reportPath}`,
    scriptPath,
  ];

  return new Promise((resolve, reject) => {
    console.log(`🚀 Running load test: ${module}`);

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

/**
 * Converts JSON reports to HTML.
 */
function convertToHtml(jsonPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const baseName = path.basename(jsonPath, '.json');
      const htmlPath = path.join(reportDir, `${baseName}.report.html`);

      const options = { jsonFile: jsonPath, output: htmlPath };
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
  console.log('🏁 Starting all load tests in parallel...\n');

  try {
    // Seed test data **before** running tests
    await seedTestData(parseInt(process.env.VUS ?? '10'));

    // Run all test scripts **simultaneously**
    const jsonReports = await Promise.all(modules.map(runK6Script));

    console.log('\n📊 Generating HTML reports...');
    await Promise.all(jsonReports.map(convertToHtml));

    // Cleanup **after** all tests have run
    await cleanupTestDatabase();

    console.log('\n🎉 All tests and reports completed successfully!');
  } catch (err) {
    console.error(err);
    console.error('\n❗ Some tests failed or reports could not be generated.');
    process.exit(1);
  }
})();

/**
 * Seeds necessary test data.
 */
async function seedTestData(numVuIds: number) {
  console.log('📦 Seeding test data...');

  // Base test user
  await prisma.user.upsert({
    where: { id: 'test-user-id' },
    update: {},
    create: { id: 'test-user-id', email: 'creator@example.com' },
  });

  // **Seeding Invite and Notification Test Data Separately**
  console.log(
    `📦 Seeding invite and notification test data for ${numVuIds} VUs...`,
  );

  for (let vuId = 1; vuId <= numVuIds; vuId++) {
    const inviteUserId = `invite-user-${vuId}`;
    const notifyUserId = `notify-user-${vuId}`;

    // 📨 **Users for Invite Test**
    await prisma.user.upsert({
      where: { id: inviteUserId },
      update: {},
      create: {
        id: inviteUserId,
        email: `${inviteUserId}@test.com`,
      },
    });

    // 📨 **Users for Notification Test**
    await prisma.user.upsert({
      where: { id: notifyUserId },
      update: {},
      create: {
        id: notifyUserId,
        email: `${notifyUserId}@test.com`,
      },
    });

    console.log(`✅ Created invite test user: ${inviteUserId}`);
    console.log(`✅ Created notification test user: ${notifyUserId}`);

    // 🔔 **Seed Notifications Only for Notification Test Users**
    await prisma.notification.createMany({
      data: Array.from({ length: 2 }).map((_, i) => ({
        userId: notifyUserId,
        title: `VU ${vuId} - Notification ${i + 1}`,
        message: `Test notification ${i + 1} for VU ${vuId}`,
        type: NotificationType.EVENT_REMINDER,
        isRead: false,
      })),
    });

    console.log(`✅ Seeded notifications for ${notifyUserId}`);
  }

  console.log('✅ Test data seeding complete.\n');
}

/**
 * Cleans up the test database.
 */
async function cleanupTestDatabase() {
  console.log('🧹 Cleaning up database...');

  try {
    await prisma.user.deleteMany({});
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
