"use client";
import { create } from "zustand";
import apiClient from "@/utils/apiClient";
import socketClient, { SocketEvent } from "@/utils/socketClient";

export interface Message {
  messageId: string;
  tripId: string;
  userId: string;
  text: string;
  reactions?: { [emoji: string]: string[] };
  createdAt: Date;
  userName?: string; // Display name for the message sender
}

interface MessageState {
  messages: Message[];
  isConnected: boolean;
  currentTripId: string | null;
  loading: boolean;
  error: string | null;

  // Message actions
  sendMessage: (tripId: string, userId: string, text: string) => Promise<void>;
  fetchMessages: (tripId: string) => Promise<void>;
  clearMessages: () => void;
  addReaction: (messageId: string, userId: string, emoji: string) => void;

  // Trip chat actions
  joinTripChat: (tripId: string) => void;
  leaveTripChat: () => void;

  // Socket connection management
  initializeSocket: () => void;
  disconnectSocket: () => void;
  initializeSocketListeners: () => void;
  cleanupSocketListeners: () => void;

  // State management
  setError: (error: string | null) => void;
  setIsConnected: (isConnected: boolean) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  isConnected: false,
  currentTripId: null,
  loading: false,
  error: null,

  // Initialize socket event listeners
  initializeSocketListeners: () => {
    const handleConnect = () => {
      set({ isConnected: true });
      console.log("Socket connected");
    };

    const handleDisconnect = () => {
      set({ isConnected: false });
      console.log("Socket disconnected");
    };

    const handleNewMessage = (message: unknown) => {
      if (message && typeof message === "object" && "messageId" in message) {
        const typedMessage = message as Message;

        // Check if message already exists to prevent duplicates
        set((state) => {
          // If message with this ID already exists, don't add it again
          const messageExists = state.messages.some(
            (m) => m.messageId === typedMessage.messageId
          );

          if (messageExists) {
            return state; // Return unchanged state
          }

          // Add new message
          return {
            messages: [...state.messages, typedMessage],
          };
        });
      }
    };

    const handleError = (error: unknown) => {
      if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
      ) {
        set({ error: error.message });
      }
    };

    // Handle local reactions (non-persistent)
    const handleLocalReaction = (data: unknown) => {
      if (
        data &&
        typeof data === "object" &&
        "messageId" in data &&
        "userId" in data &&
        "emoji" in data &&
        typeof data.messageId === "string" &&
        typeof data.userId === "string" &&
        typeof data.emoji === "string"
      ) {
        // Use the addReaction function we already defined
        get().addReaction(data.messageId, data.userId, data.emoji);
      }
    };

    // Register event listeners
    socketClient.onSocketEvent(SocketEvent.CONNECT, handleConnect);
    socketClient.onSocketEvent(SocketEvent.DISCONNECT, handleDisconnect);
    socketClient.onSocketEvent(SocketEvent.NEW_MESSAGE, handleNewMessage);
    socketClient.onSocketEvent(SocketEvent.ERROR, handleError);
    socketClient.onSocketEvent("local-reaction", handleLocalReaction);
  },

  // Clean up socket event listeners
  cleanupSocketListeners: () => {
    // We would need to keep references to the handlers to remove them
    // For simplicity, we'll just disconnect the socket
    socketClient.disconnectSocket();

    // If we had references to the handlers, we would do:
    // socketClient.offSocketEvent(SocketEvent.CONNECT, handleConnect);
    // socketClient.offSocketEvent(SocketEvent.DISCONNECT, handleDisconnect);
    // socketClient.offSocketEvent(SocketEvent.NEW_MESSAGE, handleNewMessage);
    // socketClient.offSocketEvent(SocketEvent.ERROR, handleError);
    // socketClient.offSocketEvent('local-reaction', handleLocalReaction);
  },

  // Join a trip's chat room
  joinTripChat: (tripId) => {
    socketClient.joinTripChat(tripId);
    set({ currentTripId: tripId });
  },

  // Leave the current trip's chat room
  leaveTripChat: () => {
    const { currentTripId } = get();
    if (currentTripId) {
      socketClient.leaveTripChat(currentTripId);
      set({ currentTripId: null });
    }
  },

  // Send a message
  sendMessage: async (tripId, userId, text) => {
    set({ error: null });
    try {
      // Send message via socket client
      await socketClient.sendMessage(tripId, userId, text);
      // No need to update state here as the message will come back via socket
    } catch (error) {
      console.error("Error sending message:", error);
      set({ error: "Failed to send message" });
      throw error;
    }
  },

  // Fetch messages for a trip
  fetchMessages: async (tripId) => {
    set({ loading: true, error: null, messages: [] }); // Clear messages when switching trips
    try {
      const response = await apiClient.get(`/trips/${tripId}/messages`);

      if (response.data && Array.isArray(response.data.messages)) {
        set({
          messages: response.data.messages,
          loading: false,
        });
      } else {
        set({
          messages: [],
          loading: false,
          error: "Invalid response format",
        });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      set({
        error: "Failed to load messages",
        loading: false,
      });
    }
  },

  // Clear messages (e.g., when switching trips)
  clearMessages: () => {
    set({ messages: [] });
  },

  // Set error state
  setError: (error) => {
    set({ error });
  },

  // Set connection state
  setIsConnected: (isConnected) => {
    set({ isConnected });
  },

  // Add these implementations in the create function
  initializeSocket: () => {
    socketClient.initializeSocket();
  },

  disconnectSocket: () => {
    socketClient.disconnectSocket();
  },

  // Add reaction to a message
  addReaction: (messageId, userId, emoji) => {
    set((state) => {
      const updatedMessages = state.messages.map((message) => {
        if (message.messageId === messageId) {
          // Create a copy of the reactions object or initialize it if it doesn't exist
          const reactions = { ...(message.reactions || {}) };

          // Check if this emoji reaction already exists
          if (reactions[emoji]) {
            // Check if user has already reacted with this emoji
            const userIndex = reactions[emoji].indexOf(userId);

            if (userIndex !== -1) {
              // User already reacted with this emoji, so remove the reaction
              reactions[emoji] = reactions[emoji].filter((id) => id !== userId);

              // If no users left for this emoji, remove the emoji entry
              if (reactions[emoji].length === 0) {
                delete reactions[emoji];
              }
            } else {
              // User hasn't reacted with this emoji yet, add the reaction
              reactions[emoji] = [...reactions[emoji], userId];
            }
          } else {
            // This emoji reaction doesn't exist yet, create it
            reactions[emoji] = [userId];
          }

          return {
            ...message,
            reactions,
          };
        }
        return message;
      });

      return { messages: updatedMessages };
    });
  },
}));
