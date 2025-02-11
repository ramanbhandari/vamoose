import express from 'express';
import dotenv from 'dotenv';
import planRoutes from './routes/plans.js';
import connectMongoDB from './db/mongo.js';

dotenv.config();

connectMongoDB();

const port: number | string = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', planRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
