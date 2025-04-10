/**
 * @file prismaClient.ts
 * @description Initializes and exports the Prisma Client instance for database access.
 * Configures environment variables based on the current environment (test/loadtest/production).
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({
  path:
    process.env.NODE_ENV === 'test'
      ? '.env.test'
      : process.env.LOADTEST === 'true'
        ? '.env.loadtest'
        : '.env',
});
const prisma = new PrismaClient();

export default prisma;
