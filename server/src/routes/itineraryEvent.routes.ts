import express from 'express';
import validationErrorHandler from '@/middlewares/validationErrorHandler.js';
import {
  validateCreateItineraryEventInput,
  validateUpdateItineraryEventInput,
  validateGetAllItineraryEventsInput,
  validateGetSingleItineraryEventInput,
  validateDeleteItineraryEventInput,
  validateBatchDeleteItineraryEventsInput,
} from '@/middlewares/itineraryEvent.validators.js';
import {
  createItineraryEventHandler,
  updateItineraryEventHandler,
  getItineraryEventByIdHandler,
  getAllItineraryEventsForTripHandler,
  deleteItineraryEventHandler,
  batchDeleteItineraryEventsHandler,
} from '@/controllers/itineraryEvent.controller.js';
import {
  assignUsersToItineraryEventHandler,
  unassignUserFromItineraryEventHandler,
} from '@/controllers/itineraryEventAssignment.controller.js';
import { validateItineraryEventAssignmentInput } from '@/middlewares/itineraryEventAssignment.validators.js';
import eventNoteRouter from '@/routes/itineraryEventNote.routes.js';

const router = express.Router({ mergeParams: true });

router
  .post(
    '/',
    validateCreateItineraryEventInput,
    validationErrorHandler,
    createItineraryEventHandler,
  )
  .get(
    '/:eventId',
    validateGetSingleItineraryEventInput,
    validationErrorHandler,
    getItineraryEventByIdHandler,
  )
  .get(
    '/',
    validateGetAllItineraryEventsInput,
    validationErrorHandler,
    getAllItineraryEventsForTripHandler,
  )
  .delete(
    '/:eventId',
    validateDeleteItineraryEventInput,
    validationErrorHandler,
    deleteItineraryEventHandler,
  )
  .delete(
    '/',
    validateBatchDeleteItineraryEventsInput,
    validationErrorHandler,
    batchDeleteItineraryEventsHandler,
  );

router.patch(
  '/:eventId',
  validateUpdateItineraryEventInput,
  validationErrorHandler,
  updateItineraryEventHandler,
);

router.post(
  '/:eventId/assign',
  validateItineraryEventAssignmentInput,
  validationErrorHandler,
  assignUsersToItineraryEventHandler,
);
router.delete(
  '/:eventId/unassign',
  validateItineraryEventAssignmentInput,
  validationErrorHandler,
  unassignUserFromItineraryEventHandler,
);

router.use('/:eventId/notes', eventNoteRouter);

export default router;
