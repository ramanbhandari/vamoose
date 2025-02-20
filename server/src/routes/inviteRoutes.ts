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

router.post("/create", validateCreateInviteInput, validationErrorHandler, authMiddleware, createInvite);
router.get("/validate/:token", validateTokenInput, validationErrorHandler, authMiddleware, validateInvite); 
router.post("/accept/:token", validateTokenInput, validationErrorHandler, authMiddleware, acceptInvite); 
router.post("/reject/:token", validateTokenInput, validationErrorHandler, authMiddleware, rejectInvite); 
router.delete('/delete/:token', validateTokenInput, validationErrorHandler, authMiddleware, deleteInvite);

export default router;
