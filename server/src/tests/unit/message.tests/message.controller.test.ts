import {
  addMessageHandler,
  getMessagesHandler,
  updateMessageHandler,
} from '@/controllers/message.controller.js';
import Message from '@/models/message.model.js';
import { Request, Response } from 'express';

jest.mock('@/models/message.model.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

describe('Message Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = {
      status: statusMock,
      json: jsonMock,
    } as Partial<Response>;
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
      const existingMessage = {
        messageId: 'msg123',
        text: 'Old text',
        reactions: { '👍': ['user1'] },
      };

      mockReq = {
        params: { messageId: 'msg123' },
        body: { text: 'New text' },
      };

      (Message.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingMessage),
      });

      (Message.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...existingMessage,
          text: 'New text',
        }),
      });

      await updateMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Message updated Successfully!',
        updatedMessage: expect.objectContaining({
          text: 'New text',
          reactions: { '👍': ['user1'] },
        }),
      });
    });

    it('should add a new reaction while preserving existing ones', async () => {
      const existingMessage = {
        messageId: 'msg123',
        text: 'Hello',
        reactions: { '👍': ['user1'] },
      };

      mockReq = {
        params: { messageId: 'msg123' },
        body: { emoji: '❤️', userId: 'user2' },
      };

      (Message.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingMessage),
      });

      (Message.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...existingMessage,
          reactions: {
            '👍': ['user1'],
            '❤️': ['user2'],
          },
        }),
      });

      await updateMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Message updated Successfully!',
        updatedMessage: expect.objectContaining({
          reactions: {
            '👍': ['user1'],
            '❤️': ['user2'],
          },
        }),
      });
    });

    it('should prevent duplicate reactions from the same user', async () => {
      const existingMessage = {
        messageId: 'msg123',
        text: 'Hello',
        reactions: { '👍': ['user1'] },
      };

      mockReq = {
        params: { messageId: 'msg123' },
        body: { emoji: '👍', userId: 'user1' },
      };

      (Message.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingMessage),
      });

      (Message.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...existingMessage,
          reactions: { '👍': ['user1'] }, // user1 should appear only once
        }),
      });

      await updateMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Message updated Successfully!',
        updatedMessage: expect.objectContaining({
          reactions: { '👍': ['user1'] },
        }),
      });
    });

    it('should handle message not found error', async () => {
      mockReq = {
        params: { messageId: 'nonexistent' },
        body: { text: 'New text' },
      };

      (Message.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await updateMessageHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Message not found.',
      });
    });
  });
});
