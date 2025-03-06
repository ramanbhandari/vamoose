import { Request, Response } from 'express';
import Message from '@/models/message.model.js';
import { handleControllerError } from '@/utils/errorHandlers.js';
import { BadRequestError, NotFoundError } from '@/utils/errors.js';

/**
 * Add a new message to the chat
 */
export const addMessageHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { tripId, senderId, text } = req.body;

    if (!tripId || !senderId || !text) {
      throw new BadRequestError(
        'Missing required fields: tripId, senderId, or text',
      );
    }

    const newMessage = new Message({
      tripId,
      senderId,
      text,
    });

    const savedMessage = await newMessage.save();

    res.status(201).json(savedMessage);
  } catch (error) {
    handleControllerError(error, res, 'Error adding message:');
  }
};

/**
 * Get all messages for a specific trip
 */
export const getMessagesHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { tripId } = req.params;

    if (!tripId) {
      throw new BadRequestError('Trip ID is required');
    }

    // Find all messages for the trip, sorted by creation date
    const messages = await Message.find({ tripId })
      .sort({ createdAt: 1 })
      .exec();

    res.status(200).json(messages);
  } catch (error) {
    handleControllerError(error, res, 'Error retrieving messages:');
  }
};

/**
 * Update a message
 */
export const updateMessageHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;

    if (!messageId) {
      throw new BadRequestError('Message ID is required');
    }

    // Find and update the message
    const updatedMessage = await Message.findOneAndUpdate(
      { messageId },
      { text },
      { new: true }, // Return the updated document
    );

    if (!updatedMessage) {
      throw new NotFoundError('Message not found');
    }

    res.status(200).json(updatedMessage);
  } catch (error) {
    handleControllerError(error, res, 'Error updating message:');
  }
};

/**
 * Add a reaction to a message
 */
export const addReactionHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { messageId } = req.params;
    const { emoji, userId } = req.body;

    if (!messageId || !emoji || !userId) {
      throw new BadRequestError('Message ID, emoji, and user ID are required');
    }

    // Find the message
    const message = await Message.findOne({ messageId });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Initialize reactions if not exists
    if (!message.reactions) {
      message.reactions = {};
    }

    // Add user to the reaction if not already reacted with this emoji
    const emojiReactions = message.reactions[emoji] || [];
    if (!emojiReactions.includes(userId)) {
      emojiReactions.push(userId);
      message.reactions[emoji] = emojiReactions;
      await message.save();
    }

    res.status(200).json(message);
  } catch (error) {
    handleControllerError(error, res, 'Error adding reaction:');
  }
};
