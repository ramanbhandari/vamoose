import express from 'express';
import tripRouter from "./tripRoutes.ts";

const router = express.Router();

router.use('/trips', tripRouter);

export default router;
