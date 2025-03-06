import { Request, Response } from 'express';
import {
  updateMessageHandler,
  getMessagesHandler,
} from '@/controllers/message.controller.js';
import Message from '@/models/message.model.js';

// Mock dependencies
jest.mock('@/models/message.model.js');
jest.mock('@/utils/errorHandlers.js');

describe('Message Controller', () => {
  // Common mocks
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let findMock: jest.Mock;
  let findOneAndUpdateMock: jest.Mock;
  let execMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    execMock = jest.fn();

    mockReq = {
      params: {},
      body: {},
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    findMock = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: execMock,
      }),
    });

    findOneAndUpdateMock = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });

    (Message.find as jest.Mock) = findMock;
    (Message.findOneAndUpdate as jest.Mock) = findOneAndUpdateMock;
  });

  describe('getMessagesHandler', () => {
    it('should return messages sorted by creation date', async () => {
      const mockMessages = [
        { text: 'Message 1', createdAt: new Date('2024-01-01') },
        { text: 'Message 2', createdAt: new Date('2024-01-02') },
      ];

      mockReq = {
        params: { tripId: '1' },
      };

      (Message.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockMessages),
        }),
      });

      await getMessagesHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Fetched Messages Successfully!',
        messages: mockMessages,
      });
    });
  });

  describe('updateMessageHandler', () => {
    it('should update message text and maintain existing reactions', async () => {
      const mockMessage = {
        messageId: 'msg123',
        tripId: 1,
        userId: 'user1',
        text: 'Original message',
        reactions: { '👍': ['user2'] },
      };

      const mockUpdatedMessage = {
        ...mockMessage,
        text: 'Updated message',
      };

      mockReq = {
        params: { tripId: '1', messageId: 'msg123' },
        body: { text: 'Updated message' },
      };

      execMock.mockResolvedValueOnce([mockMessage]);

      findOneAndUpdateMock.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(mockUpdatedMessage),
      });

      await updateMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Message updated Successfully!',
        updatedMessage: expect.objectContaining({
          messageId: 'msg123',
          text: 'Updated message',
          reactions: { '👍': ['user2'] },
        }),
      });

      expect(findOneAndUpdateMock).toHaveBeenCalledWith(
        { messageId: 'msg123', tripId: 1 },
        { $set: { text: 'Updated message' } },
        { new: true },
      );
    });

    it('should add a new reaction while preserving existing ones', async () => {
      // Setup mock data
      const mockMessage = {
        messageId: 'msg123',
        tripId: 1,
        userId: 'user1',
        text: 'Hello world',
        reactions: { '👍': ['user2'] },
      };

      const mockUpdatedMessage = {
        ...mockMessage,
        reactions: {
          '👍': ['user2'],
          '❤️': ['user3'],
        },
      };

      // Setup request
      mockReq = {
        params: { tripId: '1', messageId: 'msg123' },
        body: { emoji: '❤️', userId: 'user3' },
      };

      execMock.mockResolvedValueOnce([mockMessage]);

      findOneAndUpdateMock.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(mockUpdatedMessage),
      });

      await updateMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Message updated Successfully!',
        updatedMessage: expect.objectContaining({
          messageId: 'msg123',
          reactions: {
            '👍': ['user2'],
            '❤️': ['user3'],
          },
        }),
      });
    });

    it('should prevent duplicate reactions from the same user', async () => {
      // Setup mock data
      const mockMessage = {
        messageId: 'msg123',
        tripId: 1,
        userId: 'user1',
        text: 'Hello world',
        reactions: { '👍': ['user2', 'user3'] },
      };

      const mockUpdatedMessage = {
        ...mockMessage,
        reactions: { '👍': ['user2', 'user3'] },
      };

      mockReq = {
        params: { tripId: '1', messageId: 'msg123' },
        body: { emoji: '👍', userId: 'user3' },
      };

      execMock.mockResolvedValueOnce([mockMessage]);

      findOneAndUpdateMock.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(mockUpdatedMessage),
      });

      await updateMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Message updated Successfully!',
        updatedMessage: expect.objectContaining({
          messageId: 'msg123',
          reactions: { '👍': ['user2', 'user3'] },
        }),
      });
    });

    it('should handle message not found error', async () => {
      mockReq = {
        params: { tripId: '1', messageId: 'nonexistent' },
        body: { text: 'Updated message' },
      };

      execMock.mockResolvedValueOnce([]);

      await updateMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'No messages found for this trip or the trip does not exist.',
      });
    });
  });
});
