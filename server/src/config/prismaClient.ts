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
