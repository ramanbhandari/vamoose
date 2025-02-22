import prisma from '../config/prismaClient.ts';
import { handlePrismaError } from '../utils/errorHandlers.ts';
import { CreateInviteInput } from '../interfaces/interfaces.ts';
import { PrismaPromise } from '@prisma/client';


// to create a new invite
export const createTripInvite = async (inviteData: CreateInviteInput) => {
  try {
    return await prisma.tripInvitee.create({
      data: {
        ...inviteData,
      },
    });
  } catch (error) {
    console.error('Error creating trip invite:', error);
    throw handlePrismaError(error);
  }
};

// to get an invite by token
export const getInviteByToken = async (inviteToken: string) => {
  try {
    return await prisma.tripInvitee.findUnique({
      where: { inviteToken },
    });
  } catch (error) {
    console.error('Error getting invite from token:', error);
    throw handlePrismaError(error);
  }

};

// to update invite status (accepted, rejected, pending)
// needs the PrismaPromise for prisma transactions
export const updateInviteStatus = (inviteToken: string, status: string, inTransaction: boolean = false):PrismaPromise<any> => {
  const updateOperation = prisma.tripInvitee.update({
    where: { inviteToken },
    data: { status },
  });

  if (inTransaction) {
    return updateOperation;
  }
  else{
    return updateOperation.catch((error) => {
      console.error('Error updating invite status:', error);
      throw handlePrismaError(error);
    }) as PrismaPromise<any>;
  }

};

// to attach a user to an invite 
export const updateInvitedUser = async (inviteToken: string, invitedUserId: string) => {
  try {
      return await prisma.tripInvitee.update({
      where: { inviteToken },
      data: { invitedUserId },
    });
  } catch (error) {
    console.error('Error updating invited user:', error);
    throw handlePrismaError(error);
  }
};

// to check if a user has an existing invite
export const getExistingInvite = async (tripId: number, email: string) => {
  try {
    return await prisma.tripInvitee.findUnique({
      where: { tripId_email: { tripId, email } },
    });
  } catch (error) {
    console.error('Error getting the existing invite:', error);
    throw handlePrismaError(error);
  }

};

// delete an invite 
export const deleteInvite = async (inviteToken: string) => {
  try {
    return await prisma.tripInvitee.delete({
      where: { inviteToken },
    });
  } catch (error) {
    console.error('Error deleting invite:', error);
    throw handlePrismaError(error);
  }
};


export default {createTripInvite, getInviteByToken, updateInviteStatus, getExistingInvite, deleteInvite, updateInvitedUser}