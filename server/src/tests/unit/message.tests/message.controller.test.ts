import { Request, Response } from 'express';
import {
  updateMessageHandler,
  getMessagesHandler,
  addMessageHandler,
} from '@/controllers/message.controller.js';
import Message from '@/models/message.model.js';
import { handleControllerError } from '@/utils/errorHandlers.js';
import { AuthenticatedRequest } from '@/daos/interfaces.js';
import { getTripMember } from '@/models/member.model.js';

// Mock dependencies
jest.mock('@/models/message.model.js');
jest.mock('@/utils/errorHandlers.js');
jest.mock('@/models/member.model.js');

describe('Message Controller', () => {
  let mockReq: Partial<Request> & Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let saveMock: jest.Mock;
  let findMock: jest.Mock;
  let findOneAndUpdateMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    saveMock = jest.fn();

    mockReq = {
      params: {},
      body: {},
      userId: 'user1', // Default authenticated user
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    // Create mock functions
    findMock = jest.fn();
    findOneAndUpdateMock = jest.fn();

    // Mock the Message class and its static methods
    (Message as any) = jest.fn(() => ({
      save: saveMock,
    }));
    Message.find = findMock;
    Message.findOneAndUpdate = findOneAndUpdateMock;

    // Mock getTripMember to return a valid member by default
    (getTripMember as jest.Mock).mockResolvedValue({
      userId: 'user1',
      tripId: 1,
    });
  });

  describe('getMessagesHandler', () => {
    it('should return messages sorted by creation date', async () => {
      const mockMessages = [
        { text: 'Message 1', createdAt: new Date('2024-01-01') },
        { text: 'Message 2', createdAt: new Date('2024-01-02') },
      ];

      const mockExec = jest.fn().mockResolvedValue(mockMessages);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      findMock.mockReturnValue({ sort: mockSort });

      mockReq = {
        params: { tripId: '1' },
        userId: 'user1',
      };

      await getMessagesHandler(mockReq as Request, mockRes as Response);

      expect(findMock).toHaveBeenCalledWith({ tripId: 1 });
      expect(mockSort).toHaveBeenCalledWith({ createdAt: 1 });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Fetched Messages Successfully!',
        messages: mockMessages,
      });
    });

    it('should handle unauthorized request', async () => {
      mockReq = {
        params: { tripId: '1' },
        userId: undefined,
      };

      await getMessagesHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized Request' });
    });

    it('should handle invalid trip ID', async () => {
      mockReq = {
        params: { tripId: 'invalid' },
        userId: 'user1',
      };

      await getMessagesHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid trip ID' });
    });
  });

  describe('updateMessageHandler', () => {
    it('should update message text', async () => {
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

      const mockExec = jest.fn().mockResolvedValue([mockMessage]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      findMock.mockReturnValue({ sort: mockSort });

      const mockUpdateExec = jest.fn().mockResolvedValue(mockUpdatedMessage);
      findOneAndUpdateMock.mockReturnValue({ exec: mockUpdateExec });

      mockReq = {
        params: { tripId: '1', messageId: 'msg123' },
        body: { text: 'Updated message' },
        userId: 'user1',
      };

      await updateMessageHandler(mockReq as Request, mockRes as Response);

      expect(findOneAndUpdateMock).toHaveBeenCalledWith(
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
        body: { text: 'Hello world' },
        userId: 'user1',
      };

      saveMock.mockResolvedValue(mockSavedMessage);

      await addMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Message saved Successfully!',
        savedMessage: mockSavedMessage,
      });
    });

    it('should handle unauthorized request', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: { text: 'Hello world' },
        userId: undefined,
      };

      await addMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized Request' });
    });

    it('should handle invalid trip ID', async () => {
      mockReq = {
        params: { tripId: 'invalid' },
        body: { text: 'Hello world' },
        userId: 'user1',
      };

      await addMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid trip ID' });
    });

    it('should handle missing text', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: {},
        userId: 'user1',
      };

      await addMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Missing required field: text',
      });
    });

    it('should handle non-member access', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: { text: 'Hello world' },
        userId: 'user1',
      };

      (getTripMember as jest.Mock).mockResolvedValue(null);

      await addMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'You are not a member of this trip',
      });
    });

    it('should handle save errors', async () => {
      mockReq = {
        params: { tripId: '1' },
        body: { text: 'Hello world' },
        userId: 'user1',
      };

      const mockError = new Error('Database error');
      saveMock.mockRejectedValue(mockError);

      await addMessageHandler(mockReq as Request, mockRes as Response);

      expect(handleControllerError).toHaveBeenCalledWith(
        mockError,
        mockRes,
        'Error adding message:',
      );
    });
  });
});
