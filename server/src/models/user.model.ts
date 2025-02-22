import prisma from '../config/prismaClient.ts';
import { handlePrismaError } from '../utils/errorHandlers.ts';

// get user by email
export const getUserByEmail = async (email: string) => {
    try {
      return await prisma.user.findUnique({
        where: {email}
    })
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw handlePrismaError(error);
    }
};

// get user by id
export const getUserById = async (id: string) => {
    try {
      return await prisma.user.findUnique({
        where: {id}
    })
    } catch (error) {
      console.error('Error getting user by id:', error);
      throw handlePrismaError(error);
    }
};

export default {getUserByEmail, getUserById}