import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import appRouter from './routes/appRouter.js';
import prisma from './config/prismaClient.js';
import cors from 'cors';
import '@/cron/scheduler.js';
import connectMongoDB from './db/mongo.js';

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

//Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Handle Prisma Client shutdown gracefully
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
