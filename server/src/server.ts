import express, { Request, Response } from 'express';
import planRoutes from './routes/plans.js';

const port: number | string = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', planRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
