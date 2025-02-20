import express from 'express';
import tripRouter from './tripRoutes.ts';
import inviteRouter from './inviteRoutes.ts'

const router = express.Router();

router.use('/trips', tripRouter);
router.use('/invite', inviteRouter);

export default router;
