import { Request, Response } from 'express';
import { addNoteToItineraryEvent } from '@/models/itineraryEventNote.model.js';
import { getTripMember } from '@/models/member.model.js';
import { getItineraryEventById } from '@/models/itineraryEvent.model.js';
import { AuthenticatedRequest } from '@/interfaces/interfaces.js';
import { handleControllerError } from '@/utils/errorHandlers.js';

// Add a note to an event
export const addNoteToItineraryEventHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const eventId = Number(req.params.eventId);
    const { content } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (isNaN(eventId)) {
      res.status(400).json({ error: 'Invalid event ID' });
      return;
    }

    const requestingMember = await getTripMember(tripId, userId);
    if (!requestingMember) {
      res.status(403).json({ error: 'You are not a member of this trip' });
      return;
    }

    const event = await getItineraryEventById(tripId, eventId);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const note = await addNoteToItineraryEvent(eventId, userId, content);
    res.status(201).json({ message: 'Note added successfully', note });
  } catch (error) {
    handleControllerError(error, res, 'Error adding note to event:');
  }
};
