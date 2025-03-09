import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import appRouter from './routes/appRouter.js';
import prisma from './config/prismaClient.js';
import cors from 'cors';
import connectMongoDB from './db/mongo.js';
import { initializeSocketServer } from './socketServer.js';

dotenv.config();

connectMongoDB();

const port: number | string = process.env.PORT || 8000;

const app = express();

//Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Routes
app.use('/api', appRouter);

// Handle non-exisiting routes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((_req: Request, res: Response, _next: NextFunction) => {
  res.status(404).send('Route not found');
});

// Initialize socket server and get http server instance from express app
const server = initializeSocketServer(app);

//Start server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`WebSocket server is running`);
});

// Handle Prisma Client shutdown gracefully
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
