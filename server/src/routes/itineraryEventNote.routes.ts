import express from 'express';
import validationErrorHandler from '@/middleware/validationErrorHandler.js';
import {
  validateAddEventNoteInput,
  validateUpdateEventNoteInput,
} from '@/middleware/itineraryEventNote.validators.js';
import {
  addNoteToItineraryEventHandler,
  updateItineraryEventNoteHandler,
} from '@/controllers/itineraryEventNote.controller.js';

const router = express.Router({ mergeParams: true });

router.post(
  '/',
  validateAddEventNoteInput,
  validationErrorHandler,
  addNoteToItineraryEventHandler,
);

router.patch(
  '/:noteId',
  validateUpdateEventNoteInput,
  validationErrorHandler,
  updateItineraryEventNoteHandler,
);

export default router;
