import { Request, Response } from "express";
import prisma from "../config/prismaClient";
import { AuthenticatedRequest } from '../interfaces/interfaces.ts';
import { BaseError } from "../utils/errors.ts";
import TripInvite from "../models/TripInvite.ts";
import { getUserByEmail, getUserById } from "../models/User.ts";
import { addTripMember, getTripMember } from "../models/TripMember.ts";
// import { createTrip } from "../models/tripModels.ts";


// export const createTripHandler = async (req: Request, res: Response) => {
//   try {
//     let {
//       userId,
//       body: {
//         name,
//         description,
//         destination,
//         startDate: start,
//         endDate: end,
//         budget,
//       },
//     } = req as AuthenticatedRequest;

//     console.log(name, destination, start, end);
    

//     userId = "344d76da-33cc-4861-874e-26971b493480"

//     if (!userId) {
//       res.status(401).json({ error: 'Unauthorized Request' });
//       return;
//     }

//     if (!name || !destination || !start || !end) {
//       res.status(400).json({ error: 'Missing required fields' });
//       return;
//     }

//     const startDate = new Date(start);
//     const endDate = new Date(end);
//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // Normalize to midnight for accurate comparison

//     // Ensure valid dates
//     if (isNaN(startDate.getDate()) || isNaN(endDate.getDate())) {
//       res.status(400).json({ error: 'Invalid start date or end date format' });
//       return;
//     }

//     // Ensure start date is today at the earliest or in the future
//     if (startDate < today) {
//       res
//         .status(400)
//         .json({ error: 'Start date must be today or in the future' });
//       return;
//     }

//     if (startDate >= endDate) {
//       res.status(400).json({ error: 'Start date must be before end date' });
//       return;
//     }

//     const trip = await createTrip({
//       name,
//       description,
//       destination,
//       startDate: startDate,
//       endDate: endDate,
//       budget: budget ?? null,
//       createdBy: userId,
//     });

//     res.status(201).json({ message: 'Trip created successfully', trip });
//     return;
//   } catch (error) {
//     if (error instanceof BaseError) {
//       res.status(error.statusCode).json({ error: error.message });
//     } else {
//       console.error('Error updating trip:', error);
//       res.status(500).json({ error: 'Internal Server Error' });
//     }
//   }
// };

// ─────────────────────────────────────────────────────────────────────────────
// ✅ Send Invite & Generate Token
// ─────────────────────────────────────────────────────────────────────────────

export const createInvite = async (req: Request, res: Response) => {
  try {
    let {
        userId,
        body: {
            tripId,
            email,
        },
      } = req as AuthenticatedRequest;

    userId = "344d76da-33cc-4861-874e-26971b493480"

    // userId = "aaa53077-b6b8-4b5e-9361-49a6e759aa86" //not admin

    if (!tripId || !email){
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized Request' });
        return;
    }

    //TODO get trip using Model when its complete
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true },
    });

    if (!trip) {
        res.status(404).json({ error: "Trip not found." });
        return;
    } 

    // Check if the user sending the invite is the trip creator/admin
    const isAdmin = trip.members.some(
      (member) => member.userId === userId && (member.role === "creator" || member.role === "admin")
    );

    if (!isAdmin) {
        res.status(403).json({ error: "Only admin can send invites." });
        return;
    }

    const invitedUser = await getUserByEmail(email);

    //if invited user exists check if they are part of the trip already
    if(invitedUser)
    {
        // Check if the invitee is already a trip member
        const existingMember = await getTripMember(tripId, invitedUser.id);

        if (existingMember) {
          res.status(400).json({ error: "User is already a member of this trip." });
          return;
        }
    
    }

    const existingInvite = await TripInvite.getExistingInvite(tripId,email);

    if (existingInvite) {
       res.status(400).json({ error: "Invite already exists.",  inviteUrl: `${process.env.FRONTEND_URL}/invite/${existingInvite.invitetoken}`});
       return;
    }

    const inviteData = {
        tripId,
        email,
        createdBy: userId,
        ...(invitedUser && {invitedUserId: invitedUser.id})
    }
    // Create invite
    const invite = await TripInvite.createTripInvite(inviteData);

    // console.log(invite);
    
    // Return invite URL
    res.status(200).json({inviteUrl: `${process.env.FRONTEND_URL}/invite/${invite.invitetoken}`});
    return;

  } catch (error) {
    if (error instanceof BaseError) {
        res.status(error.statusCode).json({ error: error.message });
    }
    else{
        console.error("Error sending invite:", error);
        res.status(500).json({ error: "Internal server error." });
    }

  }
};

export const validateInvite = async (req: Request, res: Response) => {
  try {
    //TODO clean up
    let {
        userId,
        params: {
            token,
        },
    } = req as AuthenticatedRequest;

    userId = "344d76da-33cc-4861-874e-26971b493480"

    userId = "aaa53077-b6b8-4b5e-9361-49a6e759aa86" //not admin
    // userId = "af0098b8-b4b9-4817-8038-87494dba4045" //not admin

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized Request' });
        return;
    }

    // Find the invite by token
    let invite = await TripInvite.getInviteByToken(token);

    if (!invite) {
        res.status(400).json({ error: "Invite not found" });
        return;
    }

    // console.log(invite);
    
    const user = await getUserById(userId);

    // Ensure the logged-in user matches the invitee email
    if (invite.email !== user?.email) {
        res.status(403).json({ error: `This invite is for ${invite.email}. Please log in with that email.`,});
        return;
    }

    //attach the user to the invite if not already attached
    if(!invite.invitedUserId){
        invite = await TripInvite.updateInvitedUser(invite.invitetoken, userId);
        // console.log("attaching userID", invite);
        
    }

    //TODO Fetch trip details using Model when done
    const trip = await prisma.trip.findUnique({
        where: { id: invite.tripId },
        include: { members: true },
    });

    // Return trip details
    res.status(200).json({trip});

  } catch (error) {
    if (error instanceof BaseError) {
        res.status(error.statusCode).json({ error: error.message });
    }
    else{
        console.error("Error validating invite:", error);
        res.status(500).json({ error: "Internal server error." });
    }
  }
};

export const acceptInvite = async (req: Request, res: Response) => {
  try {
    //TODO clean up
    let {
        userId,
        params: {
            token,
        },
    } = req as AuthenticatedRequest;

    userId = "344d76da-33cc-4861-874e-26971b493480"

    userId = "aaa53077-b6b8-4b5e-9361-49a6e759aa86" //not admin
    userId = "af0098b8-b4b9-4817-8038-87494dba4045" //not admin

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized Request' });
        return;
    }

    // Find the invite by token
    const invite = await TripInvite.getInviteByToken(token);

    if (!invite) {
        res.status(400).json({ error: "Invite not found" });
        return;
    }

    const user = await getUserById(userId);

    // Ensure email matches
    if (invite.email !== user?.email) {
       res.status(403).json({
        error: `This invite is for ${invite.email}. Please log in with that email.`,
      });
      return;
    }

    if (invite.status === 'accepted')
    {
        res.status(400).json({ error: "Invite already accepted" });
        return;
    }

    const result = await prisma.$transaction([
        // add user to trip
        addTripMember(invite.tripId, userId, 'member', true),

        // Update invite status to "accepted"
        TripInvite.updateInviteStatus(token, "accepted", true)
      ]);
      
    //   console.log("Transaction successful:", result);

    res.status(200).json({ message: "Invite accepted" });
    return;

  } catch (error) {
    if (error instanceof BaseError) {
        res.status(error.statusCode).json({ error: error.message });
    }
    else{
        console.error("Error accepting invite:", error);
        res.status(500).json({ error: "Internal server error." });
    }
  }
};

export const rejectInvite = async (req: Request, res: Response) => {
  try {
    //TODO clean up
    let {
        userId,
        params: {
            token,
        },
    } = req as AuthenticatedRequest;

    userId = "344d76da-33cc-4861-874e-26971b493480"

    userId = "aaa53077-b6b8-4b5e-9361-49a6e759aa86" //not admin
    userId = "af0098b8-b4b9-4817-8038-87494dba4045" //not admin


    if (!userId) {
        res.status(401).json({ error: 'Unauthorized Request' });
        return;
    }

    // Find the invite by token
    const invite = await TripInvite.getInviteByToken(token);

    if (!invite) {
        res.status(400).json({ error: "Invite not found" });
        return;
    }

    //TODO model to get user by id
    const user = await getUserById(userId);

    // Ensure email matches
    if (invite.email !== user?.email) {
       res.status(403).json({
        error: `This invite is for ${invite.email}. Please log in with that email.`,
      });
      return;
    }

    if (invite.status !== 'pending')
    {
        res.status(400).json({ error: "Invite not pending" });
        return;
    }
    
    // Update invite status to "rejected"
    await TripInvite.updateInviteStatus(invite.invitetoken, 'rejected');

    res.status(200).json({ message: "Invite rejected." });
    return;

  } catch (error) {
    console.error("Error rejecting invite:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const deleteInvite = async (req: Request, res: Response) => {
    try {
        //TODO: clean this 
        let {
            userId,
            params: {
                token,
            },
        } = req as AuthenticatedRequest;
    
        userId = "344d76da-33cc-4861-874e-26971b493480"
    
        // userId = "aaa53077-b6b8-4b5e-9361-49a6e759aa86" //not admin


        if (!userId) {
            res.status(401).json({ error: 'Unauthorized Request' });
            return;
        }    

        // Find the invite
        const invite = await TripInvite.getInviteByToken(token);

        if (!invite) {
            res.status(400).json({error: "Invite not found"});
            return;
        }

        // to get the role of this user in the trip 
        const tripMember = await getTripMember(invite.tripId, userId);

        // ensure the delete is called by the admin
        if (!tripMember || !(tripMember.role === 'creator' || tripMember.role === "admin")) {
            res.status(403).json({ error: "Only admin can delete invites." });
            return;
        }

        // Delete the invite
        await TripInvite.deleteInvite(token);

        res.status(200).json({ message: 'Invite deleted successfully' });

    } catch (error) {
        if (error instanceof BaseError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else{
            console.error("Error deleting invite:", error);
            res.status(500).json({ error: "Internal server error." });
        }
    }
};
