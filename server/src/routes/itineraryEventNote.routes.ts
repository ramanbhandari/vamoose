import express from 'express';
import validationErrorHandler from '@/middleware/validationErrorHandler.js';
import { validateAddEventNoteInput } from '@/middleware/itineraryEventNote.validators.js';
import { addNoteToItineraryEventHandler } from '@/controllers/itineraryEventNote.controller.js';

const router = express.Router({ mergeParams: true });

router.post(
  '/',
  validateAddEventNoteInput,
  validationErrorHandler,
  addNoteToItineraryEventHandler,
);

export default router;
