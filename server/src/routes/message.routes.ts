import express from 'express';
import {
  addMessageHandler,
  getMessagesHandler,
  updateMessageHandler,
  removeReactionHandler,
} from '@/controllers/message.controller.js';
import {
  validateCreateMessageInput,
  validateGetMessagesInput,
  validateUpdateMessageInput,
} from '@/middlewares/message.validators.js';
import validationErrorHandler from '@/middlewares/validationErrorHandler.js';

const router = express.Router({ mergeParams: true });

router
  // Add a message to the chat cluster
  .post(
    '/sendMessage',
    validateCreateMessageInput,
    validationErrorHandler,
    addMessageHandler,
  )

  // Get all messages from the chat cluster for a specific trip
  .get(
    '/',
    validateGetMessagesInput,
    validationErrorHandler,
    getMessagesHandler,
  )

  // Update a message or its reactions
  .patch(
    '/:messageId',
    validateUpdateMessageInput,
    validationErrorHandler,
    updateMessageHandler,
  )

  // Remove a reaction from a message
  .patch(
    '/:messageId/removeReaction',
    validateUpdateMessageInput,
    validationErrorHandler,
    removeReactionHandler,
  );

export default router;
