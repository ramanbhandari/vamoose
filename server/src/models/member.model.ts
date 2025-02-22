import { PrismaPromise } from '@prisma/client';
import prisma from '../config/prismaClient.ts';
import { handlePrismaError } from '../utils/errorHandlers.ts';

// Get tripMember by tripId and userId
export const getTripMember = async (tripId: number, userId: string) => {
    try {
      return await prisma.tripMember.findUnique({
        where: { tripId_userId: { tripId, userId } },
      });
    } catch (error) {
      console.error('Error getting the existing trip member:', error);
      throw handlePrismaError(error);
    }
  
};

// add trip member
// needs the PrismaPromise for prisma transactions
export const addTripMember =  (tripId: number, userId: string, role: string, inTransaction: boolean = false):PrismaPromise<any> => {
    const createOperation = prisma.tripMember.create({
        data: {
          tripId,
          userId,
          role,
        },
    });

    if(inTransaction){
        return createOperation;
    }
    else{
        return createOperation.catch((error) => {
            console.error('Error adding trip member:', error);
            throw handlePrismaError(error);
        }) as PrismaPromise<any>;
    }
  
};


export default {getTripMember, addTripMember}