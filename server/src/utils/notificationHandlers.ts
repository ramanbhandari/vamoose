import { createNotification } from '@/services/notificationService.js';
import { getAllTripMembers } from '@/models/member.model.js';
import { NotificationType } from '@/interfaces/enums.js';
import { InputJsonValue } from '@prisma/client/runtime/library';

/**
 * NotificationOptions defines the notification details required
 * to build a notification.
 */
export interface NotificationOptions {
  type: NotificationType;
  relatedId?: number;
  title: string;
  message: string;
  data?: InputJsonValue; // Not used
  channel?: 'IN_APP' | 'EMAIL';
  sendAt?: Date;
}

/**
 * notifyTripMembers
 *
 * Notifies every member of the trip.
 *
 * @param tripId - The trip's ID.
 * @param options - Notification details.
 */
export async function notifyTripMembers(
  tripId: number,
  options: NotificationOptions,
): Promise<void> {
  try {
    const members = await getAllTripMembers(tripId);
    const userIds = members.map((member) => member.userId);
    if (userIds.length === 0) return;
    await createNotification({
      userIds,
      tripId,
      type: options.type,
      relatedId: options.relatedId,
      title: options.title,
      message: options.message,
      data: options.data,
      channel: options.channel,
      sendAt: options.sendAt,
    });
  } catch (error) {
    console.error(
      '[NotificationUtils] Error notifying all trip members:',
      error,
    );
  }
}

/**
 * notifySpecificTripMembers
 *
 * Notifies only the specified members of the trip.
 *
 * @param tripId - The trip's ID.
 * @param userIds - Array of userIds to notify.
 * @param options - Notification details.
 */
export async function notifySpecificTripMembers(
  tripId: number,
  userIds: string[],
  options: NotificationOptions,
): Promise<void> {
  try {
    if (userIds.length === 0) return;
    const members = await getAllTripMembers(tripId);
    const validUserIds = members
      .filter((member) => userIds.includes(member.userId))
      .map((member) => member.userId);

    await createNotification({
      userIds: validUserIds,
      tripId,
      type: options.type,
      relatedId: options.relatedId,
      title: options.title,
      message: options.message,
      data: options.data,
      channel: options.channel,
      sendAt: options.sendAt,
    });
  } catch (error) {
    console.error(
      '[NotificationUtils] Error notifying specific trip members:',
      error,
    );
  }
}
/**
 * notifyTripMembersExcept
 *
 * Notifies all trip members except the provided userIds.
 *
 * @param tripId - The trip's ID.
 * @param excludeUserIds - Array of userIds to exclude.
 * @param options - Notification details.
 */
export async function notifyTripMembersExcept(
  tripId: number,
  excludeUserIds: string[],
  options: NotificationOptions,
): Promise<void> {
  try {
    const members = await getAllTripMembers(tripId);
    const userIds = members
      .filter((member) => !excludeUserIds.includes(member.userId))
      .map((member) => member.userId);
    if (userIds.length === 0) return;
    await createNotification({
      userIds,
      tripId,
      type: options.type,
      relatedId: options.relatedId,
      title: options.title,
      message: options.message,
      data: options.data,
      channel: options.channel,
      sendAt: options.sendAt,
    });
  } catch (error) {
    console.error(
      '[NotificationUtils] Error notifying trip members except:',
      error,
    );
  }
}

/**
 * notifyIndividual
 *
 * Notifies an individual user.
 *
 * @param userId - The recipient's userId
 * @param tripId - The trip's ID
 * @param options - Notification details
 */
export async function notifyIndividual(
  userId: string,
  tripId: number,
  options: NotificationOptions,
): Promise<void> {
  try {
    await createNotification({
      userIds: [userId],
      tripId,
      type: options.type,
      relatedId: options.relatedId,
      title: options.title,
      message: options.message,
      data: options.data,
      channel: options.channel,
      sendAt: options.sendAt,
    });
  } catch (error) {
    console.error(
      '[NotificationUtils] Error notifying individual user:',
      error,
    );
  }
}

/**
 * notifyIndividuals
 *
 * Notifies a list of users.
 *
 * @param userIds - The list of users to notify
 * @param tripId - The trip's ID
 * @param options - Notification details
 */
export async function notifyIndividuals(
  userIds: string[],
  tripId: number,
  options: NotificationOptions,
): Promise<void> {
  try {
    await createNotification({
      userIds,
      tripId,
      type: options.type,
      relatedId: options.relatedId,
      title: options.title,
      message: options.message,
      data: options.data,
      channel: options.channel,
      sendAt: options.sendAt,
    });
  } catch (error) {
    console.error(
      '[NotificationUtils] Error notifying individual user:',
      error,
    );
  }
}

/**
 * notifyTripMembersExceptInitiator
 *
 * Convenience function that notifies all trip members except the initiator (Poll/Trip/Expense/Invite).
 * @param tripId - The trip's ID.
 * @param initiatorUserId - The userId of the trip initiator.
 * @param options - Notification details.
 */
export async function notifyTripMembersExceptInitiator(
  tripId: number,
  initiatorUserId: string,
  options: NotificationOptions,
): Promise<void> {
  await notifyTripMembersExcept(tripId, [initiatorUserId], options);
}

/**
 * notifyTripAdmins
 *
 * Notifies only the trip creator and trip admins.
 *
 * @param tripId - The trip's ID.
 * @param options - Notification details.
 */
export async function notifyTripAdmins(
  tripId: number,
  options: NotificationOptions,
): Promise<void> {
  try {
    const members = await getAllTripMembers(tripId);
    const adminUserIds = members
      .filter((member) => member.role === 'admin' || member.role === 'creator')
      .map((member) => member.userId);

    if (adminUserIds.length === 0) return;

    await createNotification({
      userIds: adminUserIds,
      tripId,
      type: options.type,
      relatedId: options.relatedId,
      title: options.title,
      message: options.message,
      data: options.data,
      channel: options.channel,
      sendAt: options.sendAt,
    });
  } catch (error) {
    console.error(
      '[NotificationUtils] Error notifying trip creator and admins:',
      error,
    );
  }
}
