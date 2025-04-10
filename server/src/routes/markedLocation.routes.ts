import express from 'express';
import {
  createMarkedLocationHandler,
  getAllMarkedLocationsHandler,
  updateMarkedLocationNotesHandler,
  deleteMarkedLocationHandler,
} from '@/controllers/markedLocation.controller.js';
import {
  validateCreateMarkedLocationInput,
  validateGetAllMarkedLocationsInput,
  validateUpdateMarkedLocationNotesInput,
  validateDeleteMarkedLocationInput,
} from '@/middlewares/markedLocation.validators.js';
import validationErrorHandler from '@/middlewares/validationErrorHandler.js';

const router = express.Router({ mergeParams: true });

router
  // Get all marked locations for a trip
  .get(
    '/',
    validateGetAllMarkedLocationsInput,
    validationErrorHandler,
    getAllMarkedLocationsHandler,
  )

  // Create a new marked location
  .post(
    '/',
    validateCreateMarkedLocationInput,
    validationErrorHandler,
    createMarkedLocationHandler,
  )

  // Update the notes of a marked location
  .put(
    '/:locationId/notes',
    validateUpdateMarkedLocationNotesInput,
    validationErrorHandler,
    updateMarkedLocationNotesHandler,
  )

  // Delete a marked location
  .delete(
    '/:locationId',
    validateDeleteMarkedLocationInput,
    validationErrorHandler,
    deleteMarkedLocationHandler,
  );

export default router;
