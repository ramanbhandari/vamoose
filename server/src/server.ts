import app from '@/app.js';
import { initializeSocketServer } from '@/socketServer.js';
import prisma from '@/config/prismaClient.js';
import connectMongoDB from '@/db/mongo.js';
import '@/cron/scheduler.js';

const port: number | string = process.env.PORT || 8000;

connectMongoDB();

// Initialize socket server and get HTTP server instance from Express app
const server = initializeSocketServer(app);

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`WebSocket server is running`);
});

// Handle Prisma Client shutdown gracefully
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
