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

afterAll(async () => {
  console.log('🛑 Closing Prisma connection...');
  await prisma.$disconnect();
});
