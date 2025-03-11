"use client";
import io from "socket.io-client";
import { EventEmitter } from "events";
import apiClient from "./apiClient";

// Create a custom event emitter for socket events
class SocketEventEmitter extends EventEmitter {}

// Socket.io instance
let socket: ReturnType<typeof io> | null = null;
const eventEmitter = new SocketEventEmitter();

// Socket events enum
export enum SocketEvent {
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  ERROR = "error",
  NEW_MESSAGE = "new-message",
  REACTION_UPDATED = "reaction-updated",
}

// Message data interface
interface MessageData {
  messageId: string;
  tripId: string;
  userId: string;
  text: string;
  reactions?: { [emoji: string]: string[] };
  createdAt: Date;
  userName?: string;
}

/**
 * Initialize the socket connection
 * @returns Socket.io instance
 */
export const initializeSocket = (): ReturnType<typeof io> => {
  // If socket already exists and is connected, return it
  if (socket && socket.connected) {
    return socket;
  }

  // Create new socket connection
  socket = io("http://localhost:8000", {
    autoConnect: true,
  });

  // Set up event listeners
  socket.on(SocketEvent.CONNECT, () => {
    eventEmitter.emit(SocketEvent.CONNECT);
  });

  socket.on(SocketEvent.DISCONNECT, () => {
    eventEmitter.emit(SocketEvent.DISCONNECT);
  });

  socket.on(SocketEvent.NEW_MESSAGE, (message: MessageData) => {
    eventEmitter.emit(SocketEvent.NEW_MESSAGE, message);
  });

  socket.on(SocketEvent.REACTION_UPDATED, (message: MessageData) => {
    eventEmitter.emit(SocketEvent.REACTION_UPDATED, message);
  });

  socket.on(SocketEvent.ERROR, (error: { message: string }) => {
    console.error("Socket error:", error);
    eventEmitter.emit(SocketEvent.ERROR, error);
  });

  return socket;
};

export const isConnected = (): boolean => {
  return !!socket && socket.connected;
};

/**
 * Get the socket instance, initializing if necessary
 * @returns Socket.io instance
 */
export const getSocket = (): ReturnType<typeof io> => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join a trip's chat room
 * @param tripId Trip ID
 */
export const joinTripChat = (tripId: string): void => {
  const currentSocket = getSocket();
  currentSocket.emit("join-trip", tripId);
};

/**
 * Leave a trip's chat room
 * @param tripId Trip ID
 */
export const leaveTripChat = (tripId: string): void => {
  const currentSocket = getSocket();
  currentSocket.emit("leave-trip", tripId);
};

/**
 * Send a message to a trip's chat
 * @param tripId Trip ID
 * @param userId User ID
 * @param text Message text
 */
export const sendMessage = async (
  tripId: string,
  userId: string,
  text: string
): Promise<void> => {
  try {
    // First, send the message via HTTP using apiClient
    const response = await apiClient.post(
      `/trips/${tripId}/messages/sendMessage`,
      { text },
      {
        headers: {
          userId: userId,
        },
      }
    );

    const savedMessage = response.data.savedMessage;

    // Then, emit the saved message to the socket server for broadcasting
    const currentSocket = getSocket();
    currentSocket.emit("send-message", { tripId, savedMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    eventEmitter.emit(SocketEvent.ERROR, { message: "Failed to send message" });
    throw error;
  }
};

/**
 * Add or remove a reaction to a message
 * @param messageId Message ID
 * @param userId User ID
 * @param emoji Emoji reaction
 * @param tripId Trip ID
 * @param hasReacted Whether the user has already reacted with this emoji (for toggling)
 */
export const addReaction = async (
  messageId: string,
  userId: string,
  emoji: string,
  tripId?: string,
  hasReacted?: boolean
): Promise<void> => {
  try {
    if (!tripId) {
      console.error("No tripId provided for reaction");
      eventEmitter.emit(SocketEvent.ERROR, {
        message: "No tripId provided for reaction",
      });
      return;
    }

    // Send the reaction to the server via API
    // If hasReacted is true, we're removing the reaction
    const endpoint = hasReacted
      ? `/trips/${tripId}/messages/${messageId}/removeReaction`
      : `/trips/${tripId}/messages/${messageId}`;

    const response = await apiClient.patch(
      endpoint,
      { emoji },
      {
        headers: {
          userId: userId,
        },
      }
    );

    const updatedMessage = response.data.updatedMessage;

    // Emit the updated message to the socket server for broadcasting
    const currentSocket = getSocket();
    currentSocket.emit("reaction-updated", { tripId, updatedMessage });

    // Also emit a local event for immediate UI update
    eventEmitter.emit("local-reaction", { messageId, userId, emoji });
  } catch (error) {
    console.error("Error adding reaction:", error);
    eventEmitter.emit(SocketEvent.ERROR, { message: "Failed to add reaction" });
    throw error;
  }
};

/**
 * Subscribe to a socket event
 * @param event Event name
 * @param listener Event listener function
 */
export const onSocketEvent = (
  event: string,
  listener: (...args: unknown[]) => void
): void => {
  eventEmitter.on(event, listener);
};

/**
 * Unsubscribe from a socket event
 * @param event Event name
 * @param listener Event listener function
 */
export const offSocketEvent = (
  event: string,
  listener: (...args: unknown[]) => void
): void => {
  eventEmitter.off(event, listener);
};

const socketClient = {
  initializeSocket,
  getSocket,
  disconnectSocket,
  joinTripChat,
  leaveTripChat,
  sendMessage,
  addReaction,
  onSocketEvent,
  offSocketEvent,
  isConnected,
};

export default socketClient;
