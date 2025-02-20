import express from "express";
import {
    // createTripHandler,
    createInvite,
    deleteInvite,
    validateInvite,
    acceptInvite,
    rejectInvite,
} from "../controllers/inviteController.ts";
import { authMiddleware } from '../middleware/authMiddleware.ts';

const router = express.Router();

// creating a trip for test
// router.post("/createTrip", createTripHandler);

//TODO: Add authentication middleware

router.post("/create", createInvite);
router.get("/validate/:token", validateInvite); 
router.post("/accept/:token", acceptInvite); 
router.post("/reject/:token", rejectInvite); 
router.delete('/delete/:token', deleteInvite);

export default router;
