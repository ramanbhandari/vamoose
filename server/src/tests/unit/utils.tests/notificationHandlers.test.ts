import {
  notifyTripMembers,
  notifyTripMembersExcept,
  notifyIndividual,
  notifyTripMembersExceptInitiator,
  NotificationOptions,
} from '@/utils/notificationHandlers.js';
import { createNotification } from '@/services/notificationService.js';
import { getAllTripMembers } from '@/models/member.model.js';
import { NotificationType } from '@/daos/enums.js';

// Mock the dependencies
jest.mock('@/services/notificationService.js', () => ({
  createNotification: jest.fn(),
}));

jest.mock('@/models/member.model.js', () => ({
  getAllTripMembers: jest.fn(),
}));

describe('Notification Utils', () => {
  const tripId = 1;
  const sampleMembers = [
    { userId: 'user1' },
    { userId: 'user2' },
    { userId: 'user3' },
  ];

  beforeEach(() => {
    // Resolve getAllTripMembers with our sample members array
    (getAllTripMembers as jest.Mock).mockResolvedValue(sampleMembers);
    jest.clearAllMocks();
  });

  describe('notifyTripMembers', () => {
    it('should notify all trip members', async () => {
      const options: NotificationOptions = {
        type: NotificationType.POLL_CREATED,
        title: 'Test Title',
        message: 'Test Message',
        data: { key: 'value' },
        channel: 'IN_APP',
      };

      await notifyTripMembers(tripId, options);

      expect(getAllTripMembers).toHaveBeenCalledWith(tripId);
      expect(createNotification).toHaveBeenCalledWith({
        userIds: sampleMembers.map((m) => m.userId),
        tripId,
        type: options.type,
        relatedId: undefined,
        title: options.title,
        message: options.message,
        data: options.data,
        channel: options.channel,
        sendAt: undefined,
      });
    });
  });

  describe('notifyTripMembersExcept', () => {
    it('should notify all trip members except those excluded', async () => {
      const options: NotificationOptions = {
        type: NotificationType.EXPENSE_CREATED,
        title: 'Expense Title',
        message: 'Expense Message',
        data: { expense: 123 },
        channel: 'IN_APP',
      };
      const excludeUserIds = ['user2'];

      await notifyTripMembersExcept(tripId, excludeUserIds, options);

      expect(getAllTripMembers).toHaveBeenCalledWith(tripId);
      // Expected userIds are 'user1' and 'user3' after filtering out 'user2'
      expect(createNotification).toHaveBeenCalledWith({
        userIds: ['user1', 'user3'],
        tripId,
        type: options.type,
        relatedId: undefined,
        title: options.title,
        message: options.message,
        data: options.data,
        channel: options.channel,
        sendAt: undefined,
      });
    });
  });

  describe('notifyIndividual', () => {
    it('should notify a single individual', async () => {
      const options: NotificationOptions = {
        type: NotificationType.MEMBER_JOINED,
        title: 'Welcome',
        message: 'Welcome to the trip',
        data: undefined,
        channel: 'IN_APP',
      };
      const userId = 'user1';

      await notifyIndividual(userId, tripId, options);

      expect(createNotification).toHaveBeenCalledWith({
        userIds: [userId],
        tripId,
        type: options.type,
        relatedId: undefined,
        title: options.title,
        message: options.message,
        data: options.data,
        channel: options.channel,
        sendAt: undefined,
      });
    });
  });

  describe('notifyTripMembersExceptInitiator', () => {
    it('should notify all trip members except the creator', async () => {
      const options: NotificationOptions = {
        type: NotificationType.EXPENSE_SHARE_SETTLED,
        title: 'Share Settled',
        message: 'Your share has been settled',
        data: { settled: true },
        channel: 'IN_APP',
      };
      const creatorUserId = 'user1';

      // This should call notifyTripMembersExcept with [creatorUserId] as exclusion
      await notifyTripMembersExceptInitiator(tripId, creatorUserId, options);

      expect(getAllTripMembers).toHaveBeenCalledWith(tripId);
      expect(createNotification).toHaveBeenCalledWith({
        userIds: ['user2', 'user3'], // sampleMembers excluding 'user1'
        tripId,
        type: options.type,
        relatedId: undefined,
        title: options.title,
        message: options.message,
        data: options.data,
        channel: options.channel,
        sendAt: undefined,
      });
    });
  });
});
