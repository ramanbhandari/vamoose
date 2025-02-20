import express from "express";
import {
    createInvite,
    deleteInvite,
    validateInvite,
    acceptInvite,
    rejectInvite,
} from "../controllers/inviteController.ts";

import { authMiddleware } from '../middleware/authMiddleware.ts';
import { validateCreateInviteInput, validateTokenInput } from "../middleware/validators.ts";
import validationErrorHandler from "../middleware/validationErrorHandler.ts";

const router = express.Router();

//TODO: Add authentication middleware

router.post("/create", validateCreateInviteInput, validationErrorHandler, createInvite);
router.get("/validate/:token", validateTokenInput, validationErrorHandler, validateInvite); 
router.post("/accept/:token", validateTokenInput, validationErrorHandler, acceptInvite); 
router.post("/reject/:token", validateTokenInput, validationErrorHandler, rejectInvite); 
router.delete('/delete/:token', validateTokenInput, validationErrorHandler, deleteInvite);

export default router;
