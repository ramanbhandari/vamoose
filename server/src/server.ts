import express from 'express';
import dotenv from 'dotenv';
import tripRoutes from './routes/tripRoutes.ts';
import prisma from './config/prismaClient.ts';
import cors from 'cors';
import connectMongoDB from './db/mongo.js';

dotenv.config();

connectMongoDB();

const port: number | string = process.env.PORT || 3000;

const app = express();

//Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Routes
app.use('/api/trips', tripRoutes);

//Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Handle Prisma Client shutdown gracefully
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
