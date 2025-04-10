import { Request, Response } from 'express';
import Message from '@/models/message.model.js';
import { handleControllerError } from '@/utils/errorHandlers.js';
import { AuthenticatedRequest } from '@/daos/interfaces.js';
import { getTripMember } from '@/models/member.model.js';

/**
 * Add a new message to the chat
 */
export const addMessageHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const { text } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (!text) {
      res.status(400).json({ error: 'Missing required field: text' });
      return;
    }

    const requestingMember = await getTripMember(tripId, userId);
    if (!requestingMember) {
      res.status(403).json({ error: 'You are not a member of this trip' });
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
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

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
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const { messageId } = req.params;

    //reactions is {emoji: [userid1, userid2...], emoji2:[userid1, userid3...]}
    const { text, reactions, emoji } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (!tripId) {
      res.status(400).json({ error: 'Missing required field(s): tripId' });
      return;
    }

    if (!messageId) {
      res.status(400).json({ error: 'Missing required field(s): messageId' });
      return;
    }

    const requestingMember = await getTripMember(tripId, userId);
    if (!requestingMember) {
      res.status(403).json({ error: 'You are not a member of this trip' });
      return;
    }

    // First we get all the messages for the trip
    const tripMessages = await Message.find({ tripId })
      .sort({ createdAt: 1 })
      .exec();

    if (!tripMessages || tripMessages.length === 0) {
      res.status(404).json({
        error: 'No messages found for this trip or the trip does not exist.',
      });
      return;
    }

    // Find the specific message within the trip messages
    const message = tripMessages.find((msg) => msg.messageId === messageId);
    if (!message) {
      res.status(404).json({ error: 'Message not found in this trip.' });
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
      { messageId, tripId },
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

/**
 * Remove a reaction from a message
 */
export const removeReactionHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (!tripId) {
      res.status(400).json({ error: 'Missing required field(s): tripId' });
      return;
    }

    if (!messageId) {
      res.status(400).json({ error: 'Missing required field(s): messageId' });
      return;
    }

    if (!emoji) {
      res.status(400).json({ error: 'Missing required field(s): emoji' });
      return;
    }

    const requestingMember = await getTripMember(tripId, userId);
    if (!requestingMember) {
      res.status(403).json({ error: 'You are not a member of this trip' });
      return;
    }

    // First we get the message
    const message = await Message.findOne({ messageId, tripId }).exec();

    if (!message) {
      res.status(404).json({ error: 'Message not found.' });
      return;
    }

    // Get current reactions
    const currentReactions = message.reactions || {};

    // Check if the emoji reaction exists
    if (!currentReactions[emoji]) {
      res.status(400).json({ error: 'Reaction does not exist' });
      return;
    }

    // Check if the user has reacted with this emoji
    if (!currentReactions[emoji].includes(userId)) {
      res.status(400).json({ error: 'User has not reacted with this emoji' });
      return;
    }

    // Remove the user's reaction
    currentReactions[emoji] = currentReactions[emoji].filter(
      (id) => id !== userId,
    );

    // If no users left for this emoji, remove the emoji entry
    if (currentReactions[emoji].length === 0) {
      delete currentReactions[emoji];
    }

    // Update the message with the new reactions
    const updatedMessage = await Message.findOneAndUpdate(
      { messageId, tripId },
      { $set: { reactions: currentReactions } },
      { new: true },
    ).exec();

    if (!updatedMessage) {
      res.status(404).json({ error: 'Message not found after update.' });
      return;
    }

    res
      .status(200)
      .json({ message: 'Reaction removed successfully!', updatedMessage });
  } catch (error) {
    handleControllerError(error, res, 'Error removing reaction:');
  }
};
