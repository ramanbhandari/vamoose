import express, { NextFunction, Request, Response } from 'express';
import appRouter from '@/routes/appRouter.js';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', appRouter);

// Handle non-existing routes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((_req: Request, res: Response, _next: NextFunction) => {
  res.status(404).send('Route not found');
});

export default app;
