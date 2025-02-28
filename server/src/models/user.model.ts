import prisma from '@/config/prismaClient.js';
import { handlePrismaError } from '@/utils/errorHandlers.js';

// Get user by email
export const getUserByEmail = async (email: string) => {
  try {
    return await prisma.user.findUnique({
      where: { email },
    });
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw handlePrismaError(error);
  }
};

// Get user by ID
export const getUserById = async (id: string) => {
  try {
    return await prisma.user.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error getting user by id:', error);
    throw handlePrismaError(error);
  }
};

// Get multiple users by IDs
export const getUsersByIds = async (ids: string[]) => {
  try {
    return await prisma.user.findMany({
      where: { id: { in: ids } },
    });
  } catch (error) {
    console.error('Error getting users by IDs:', error);
    throw handlePrismaError(error);
  }
};

// Get multiple users by emails
export const getUsersByEmails = async (emails: string[]) => {
  try {
    return await prisma.user.findMany({
      where: { email: { in: emails } },
    });
  } catch (error) {
    console.error('Error getting users by emails:', error);
    throw handlePrismaError(error);
  }
};

export default { getUserByEmail, getUserById, getUsersByIds, getUsersByEmails };
