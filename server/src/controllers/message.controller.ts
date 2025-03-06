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
    //reactions is {emoji: [userid1, userid2...], emoji2:[userid1, userid3...]}
    const { text, reactions, emoji, userId } = req.body;
    console.log(req.body);

    if (!messageId) {
      throw new BadRequestError('Message ID is required');
    }

    const message = await Message.findOne({ messageId }).exec();
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // this is the update object
    const updateData: {
      text?: string;
      reactions?: { [emoji: string]: string[] };
    } = {};

    if (text !== undefined) {
      updateData.text = text;
    }

    //for complete reactions object
    if (reactions) {
      updateData.reactions = reactions;
    } else if (emoji && userId) {
      // for individual emoji reactions
      const currentReactions = message.reactions || {};

      const emojiReactions = currentReactions[emoji] || [];

      if (!emojiReactions.includes(userId)) {
        emojiReactions.push(userId);
      }

      updateData.reactions = {
        ...currentReactions,
        [emoji]: emojiReactions,
      };
    }

    // Update the message with the new data
    const updatedMessage = await Message.findOneAndUpdate(
      { messageId },
      { $set: updateData },
      { new: true },
    ).exec();

    if (!updatedMessage) {
      throw new NotFoundError('Message not found after update');
    }

    res.status(200).json(updatedMessage);
  } catch (error) {
    handleControllerError(error, res, 'Error updating message:');
  }
};
