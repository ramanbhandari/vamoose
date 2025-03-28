import dotenv from 'dotenv';
dotenv.config();
import app from '@/app.js';
import prisma from '@/config/prismaClient.js';
import connectMongoDB from '@/db/mongo.js';

const port = process.env.PORT || 8000;
const isLoadTest = process.env.LOADTEST === 'true';

connectMongoDB();

// imports only load if not in loadtest
if (!isLoadTest) {
  await import('@/cron/scheduler.js');

  const { initializeSocketServer } = await import('@/socketServer.js');
  const server = initializeSocketServer(app);
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`WebSocket server is running`);
  });
} else {
  app.listen(port, () => {
    console.log(`[Loadtest] Server running at http://localhost:${port}`);
  });
}

// Graceful shutdown for Prisma
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
