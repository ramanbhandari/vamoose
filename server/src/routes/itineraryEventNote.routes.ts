import express from 'express';
import validationErrorHandler from '@/middleware/validationErrorHandler.js';
import {
  validateAddEventNoteInput,
  validateBatchDeleteEventNotesInput,
  validateDeleteEventNoteInput,
  validateUpdateEventNoteInput,
} from '@/middleware/itineraryEventNote.validators.js';
import {
  addNoteToItineraryEventHandler,
  batchDeleteItineraryEventNotesHandler,
  deleteItineraryEventNoteHandler,
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

router.delete(
  '/:noteId',
  validateDeleteEventNoteInput,
  validationErrorHandler,
  deleteItineraryEventNoteHandler,
);

router.delete(
  '/',
  validateBatchDeleteEventNotesInput,
  validationErrorHandler,
  batchDeleteItineraryEventNotesHandler,
);

export default router;
