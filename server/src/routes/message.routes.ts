import express from 'express';
import {
  addMessageHandler,
  getMessagesHandler,
  updateMessageHandler,
  addReactionHandler,
} from '@/controllers/message.controller.js';

const router = express.Router({ mergeParams: true });

router
  // Add a message to the chat cluster
  .post('/sendMessage', addMessageHandler)

  // Get all messages from the chat cluster for a specific trip
  .get('/', getMessagesHandler)

  // Update a message in the chat cluster
  .patch('/:messageId', updateMessageHandler)

  // Add a reaction to a message
  .post('/:messageId/reactions', addReactionHandler);

export default router;
