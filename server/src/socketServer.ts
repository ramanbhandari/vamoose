import { Server as SocketServer } from 'socket.io';
import { Express } from 'express';
import http from 'http';

export const initializeSocketServer = (app: Express): http.Server => {
  const server = http.createServer(app);
  const socketServer = new SocketServer(server, {
    cors: {
      origin: '*', //allow all origins (TODO: change it to frontend URL when deployed.)
      methods: ['GET', 'POST', 'PATCH'],
      credentials: true,
    },
  });

  // listen for connection event
  socketServer.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // listen for join-trip event
    socket.on('join-trip', (tripId) => {
      socket.join(`trip-${tripId}`);
      console.log(`User ${socket.id} joined trip-${tripId}`);
    });

    // listen to leave-trip event
    socket.on('leave-trip', (tripId) => {
      socket.leave(`trip-${tripId}`);
      console.log(`User ${socket.id} left trip-${tripId}`);
    });

    // listen for send-message event
    socket.on('send-message', (data) => {
      try {
        const { tripId, savedMessage } = data;

        if (!tripId || !savedMessage) {
          console.error('Invalid message data received:', data);
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }

        // Broadcast the saved message to all users in the trip's room (including sender)
        socketServer.to(`trip-${tripId}`).emit('new-message', savedMessage);
        console.log(
          `Message broadcast to trip-${tripId}:`,
          savedMessage.messageId,
        );
      } catch (error) {
        console.error('Error broadcasting message:', error);
        socket.emit('error', { message: 'Failed to broadcast message' });
      }
    });

    // listen for reaction-updated event
    socket.on('reaction-updated', (data) => {
      try {
        const { tripId, updatedMessage } = data;

        if (!tripId || !updatedMessage) {
          console.error('Invalid reaction data received:', data);
          socket.emit('error', { message: 'Invalid reaction data' });
          return;
        }

        // Broadcast the updated message to all users in the trip's room (including sender)
        socketServer
          .to(`trip-${tripId}`)
          .emit('reaction-updated', updatedMessage);
        console.log(
          `Reaction update broadcast to trip-${tripId} for message:`,
          updatedMessage.messageId,
        );
      } catch (error) {
        console.error('Error broadcasting reaction update:', error);
        socket.emit('error', {
          message: 'Failed to broadcast reaction update',
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return server;
};
