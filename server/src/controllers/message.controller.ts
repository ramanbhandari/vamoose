import { Request, Response } from 'express';
import Message from '@/models/message.model.js';
import { handleControllerError } from '@/utils/errorHandlers.js';

/**
 * Add a new message to the chat
 */
export const addMessageHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { tripId, userId, text } = req.body;

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (!tripId || !userId || !text) {
      res
        .status(400)
        .json({ error: 'Missing required field(s): tripId, userId, or text' });
      return;
    }

    const newMessage = new Message({
      tripId,
      userId,
      text,
    });

    const savedMessage = await newMessage.save();

    res
      .status(201)
      .json({ message: 'Message saved Successfully!', savedMessage });
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
    const tripId = Number(req.params.tripId);

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (!tripId) {
      res.status(400).json({ error: 'Missing required field(s): tripId' });
      return;
    }

    const messages = await Message.find({ tripId })
      .sort({ createdAt: 1 })
      .exec();

    res
      .status(200)
      .json({ message: 'Fetched Messages Successfully!', messages });
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

    if (!messageId) {
      res.status(400).json({ error: 'Missing required field(s): messageId' });
      return;
    }

    const message = await Message.findOne({ messageId }).exec();
    if (!message) {
      res.status(404).json({ error: 'Message not found.' });
      return;
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
      res.status(404).json({ error: 'Message not found after update.' });
      return;
    }

    res
      .status(200)
      .json({ message: 'Message updated Successfully!', updatedMessage });
  } catch (error) {
    handleControllerError(error, res, 'Error updating message:');
  }
};
