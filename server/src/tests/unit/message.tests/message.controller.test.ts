import { Request, Response } from 'express';
import {
  updateMessageHandler,
  getMessagesHandler,
  addMessageHandler,
} from '@/controllers/message.controller.js';
import Message from '@/models/message.model.js';
import { handleControllerError } from '@/utils/errorHandlers.js';

// Mock dependencies
jest.mock('@/models/message.model.js');
jest.mock('@/utils/errorHandlers.js');

describe('Message Controller', () => {
  // Common mocks
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let saveMock: jest.Mock;
  let mockMessageClass: any;

  beforeEach(() => {
    // Reset mocks
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    saveMock = jest.fn();

    mockReq = {
      params: {},
      body: {},
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    // Properly mock the Message model
    const mockSort = jest.fn().mockReturnThis();
    const mockExec = jest.fn();
    const mockFind = jest
      .fn()
      .mockReturnValue({ sort: mockSort, exec: mockExec });
    const mockFindOneAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn() });

    // Set up Message constructor mock
    mockMessageClass = function () {
      return {
        save: saveMock,
      };
    };

    mockMessageClass.find = mockFind;
    mockMessageClass.findOneAndUpdate = mockFindOneAndUpdate;

    // Apply the mocks
    (Message as any) = mockMessageClass;
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

      const mockExec = jest.fn().mockResolvedValue(mockMessages);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      Message.find = jest.fn().mockReturnValue({ sort: mockSort });

      await getMessagesHandler(mockReq as Request, mockRes as Response);

      expect(Message.find).toHaveBeenCalledWith({ tripId: 1 });
      expect(mockSort).toHaveBeenCalledWith({ createdAt: 1 });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Fetched Messages Successfully!',
        messages: mockMessages,
      });
    });

    it('should handle invalid trip ID', async () => {
      mockReq = {
        params: { tripId: 'invalid' },
      };

      await getMessagesHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid trip ID' });
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

      const mockExec = jest.fn().mockResolvedValue([mockMessage]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      Message.find = jest.fn().mockReturnValue({ sort: mockSort });

      const mockUpdateExec = jest.fn().mockResolvedValue(mockUpdatedMessage);
      Message.findOneAndUpdate = jest
        .fn()
        .mockReturnValue({ exec: mockUpdateExec });

      await updateMessageHandler(mockReq as Request, mockRes as Response);

      expect(Message.findOneAndUpdate).toHaveBeenCalledWith(
        { messageId: 'msg123', tripId: 1 },
        { $set: { text: 'Updated message' } },
        { new: true },
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Message updated Successfully!',
        updatedMessage: mockUpdatedMessage,
      });
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

      const mockExec = jest.fn().mockResolvedValue([mockMessage]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      Message.find = jest.fn().mockReturnValue({ sort: mockSort });

      const mockUpdateExec = jest.fn().mockResolvedValue(mockUpdatedMessage);
      Message.findOneAndUpdate = jest
        .fn()
        .mockReturnValue({ exec: mockUpdateExec });

      await updateMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Message updated Successfully!',
        updatedMessage: mockUpdatedMessage,
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

      const mockExec = jest.fn().mockResolvedValue([mockMessage]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      Message.find = jest.fn().mockReturnValue({ sort: mockSort });

      const mockUpdateExec = jest.fn().mockResolvedValue(mockUpdatedMessage);
      Message.findOneAndUpdate = jest
        .fn()
        .mockReturnValue({ exec: mockUpdateExec });

      await updateMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Message updated Successfully!',
        updatedMessage: mockUpdatedMessage,
      });
    });

    it('should handle message not found error', async () => {
      mockReq = {
        params: { tripId: '1', messageId: 'nonexistent' },
        body: { text: 'Updated message' },
      };

      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      Message.find = jest.fn().mockReturnValue({ sort: mockSort });

      await updateMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'No messages found for this trip or the trip does not exist.',
      });
    });
  });

  describe('addMessageHandler', () => {
    it('should successfully add a new message', async () => {
      const mockSavedMessage = {
        tripId: 1,
        userId: 'user1',
        text: 'Hello world',
        messageId: 'msg123',
      };

      mockReq = {
        params: { tripId: '1' },
        body: { userId: 'user1', text: 'Hello world' },
      };

      saveMock.mockResolvedValue(mockSavedMessage);

      await addMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Message saved Successfully!',
        savedMessage: mockSavedMessage,
      });
    });

    it('should handle invalid trip ID', async () => {
      mockReq = {
        params: { tripId: 'invalid' },
        body: { userId: 'user1', text: 'Hello world' },
      };

      await addMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid trip ID' });
      expect(saveMock).not.toHaveBeenCalled();
    });

    it('should handle missing userId', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: { text: 'Hello world' },
      };

      await addMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Missing required field(s): userId, or text',
      });
      expect(saveMock).not.toHaveBeenCalled();
    });

    it('should handle missing text', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: { userId: 'user1' },
      };

      await addMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Missing required field(s): userId, or text',
      });
      expect(saveMock).not.toHaveBeenCalled();
    });

    it('should handle save errors', async () => {
      const errorMessage = 'Database error';

      mockReq = {
        params: { tripId: '1' },
        body: { userId: 'user1', text: 'Hello world' },
      };

      const mockError = new Error(errorMessage);
      saveMock.mockRejectedValue(mockError);

      (handleControllerError as jest.Mock) = jest
        .fn()
        .mockImplementation((err, res, prefix) => {
          res.status(500).json({ error: `${prefix} ${err.message}` });
        });

      await addMessageHandler(mockReq as Request, mockRes as Response);

      expect(handleControllerError).toHaveBeenCalledWith(
        mockError,
        mockRes,
        'Error adding message:',
      );
    });
  });
});
