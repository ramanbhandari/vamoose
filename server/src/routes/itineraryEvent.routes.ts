import express from 'express';
import validationErrorHandler from '@/middleware/validationErrorHandler.js';
import {
  validateCreateItineraryEventInput,
  validateUpdateItineraryEventInput,
  validateGetAllItineraryEventsInput,
  validateGetSingleItineraryEventInput,
  validateDeleteItineraryEventInput,
  validateBatchDeleteItineraryEventsInput,
} from '@/middleware/itineraryEvent.validators.js';
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
} from '@/controllers/itineraryEventAssignment.controller';
import { validateItineraryEventAssignmentInput } from '@/middleware/itineraryEventAssignment.validators';

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

export default router;
