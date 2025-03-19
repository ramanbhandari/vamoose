import { Request, Response } from 'express';
import {
  addNoteToItineraryEvent,
  getItineraryEventNoteById,
  updateItineraryEventNote,
  getItineraryEventNotesByIds,
  deleteItineraryEventNote,
  batchDeleteItineraryEventNotes,
} from '@/models/itineraryEventNote.model.js';
import { getTripMember } from '@/models/member.model.js';
import { getItineraryEventById } from '@/models/itineraryEvent.model.js';
import { AuthenticatedRequest } from '@/interfaces/interfaces.js';
import { handleControllerError } from '@/utils/errorHandlers.js';
import { notifySpecificTripMembers } from '@/utils/notificationHandlers.js';
import { NotificationType } from '@/interfaces/enums.js';
import { fetchSingleTrip } from '@/models/trip.model.js';

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

// Update a note
export const updateItineraryEventNoteHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const eventId = Number(req.params.eventId);
    const noteId = Number(req.params.noteId);
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
    if (isNaN(noteId)) {
      res.status(400).json({ error: 'Invalid note ID' });
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

    const note = await getItineraryEventNoteById(noteId, eventId);
    if (!note) {
      res.status(404).json({ error: 'Event note not found' });
      return;
    }

    const isNoteCreator = note.createdBy === userId;
    if (!isNoteCreator) {
      res.status(403).json({
        error: 'Only the note creator can update the note',
      });
      return;
    }

    const updatedNote = await updateItineraryEventNote(noteId, content);

    res.status(200).json({ message: 'Note updated successfully', updatedNote });

    // Notify assigned users
    const trip = await fetchSingleTrip(userId, tripId);
    const assignedUsers = event.assignedUsers.map(
      (assignedUser) => assignedUser.user.id,
    );

    await notifySpecificTripMembers(tripId, assignedUsers, {
      type: NotificationType.EVENT_NOTE_ADDED,
      relatedId: eventId,
      title: 'New Note Added to Your Assigned Event',
      message: `A new note was added to "${event.title}" in "${trip.name}". Check it out!`,
      channel: 'IN_APP',
    });
  } catch (error) {
    handleControllerError(error, res, 'Error updating note:');
  }
};

export const deleteItineraryEventNoteHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const eventId = Number(req.params.eventId);
    const noteId = Number(req.params.noteId);

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
    if (isNaN(noteId)) {
      res.status(400).json({ error: 'Invalid note ID' });
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

    const note = await getItineraryEventNoteById(noteId, eventId);
    if (!note) {
      res.status(404).json({ error: 'Event note not found' });
      return;
    }

    const isNoteCreator = note.createdBy === userId;
    if (!isNoteCreator) {
      res.status(403).json({
        error: 'Only the note creator can delete the note',
      });
      return;
    }

    await deleteItineraryEventNote(noteId);
    res.status(200).json({ message: 'Event note deleted successfully' });
  } catch (error) {
    handleControllerError(error, res, 'Error deleting event note:');
  }
};

export const batchDeleteItineraryEventNotesHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const eventId = Number(req.params.eventId);
    const { noteIds } = req.body;

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

    const notes = await getItineraryEventNotesByIds(noteIds, eventId);
    if (notes.length === 0) {
      res.status(404).json({ error: 'Event notes not found' });
      return;
    }

    const notesToDelete = notes.filter((note) => note.createdBy === userId);
    const deletableNoteIds = notesToDelete.map((note) => note.id);

    if (deletableNoteIds.length === 0) {
      res
        .status(403)
        .json({ error: 'You do not have permission to delete these notes' });
      return;
    }

    await batchDeleteItineraryEventNotes(deletableNoteIds);
    res.status(200).json({
      message: 'Event notes deleted successfully',
      deletedNoteIds: deletableNoteIds,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error deleting event notes:');
  }
};
