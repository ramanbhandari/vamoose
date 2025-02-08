import express, { Request, Response } from 'express';
import tripRoutes from './routes/tripRoutes.ts';

const port: number | string = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/trips', tripRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
