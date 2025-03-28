/**
 * @file userHelper.ts
 * @description Contains helper functions to extract and manage user information 
 * and roles (creator, admin, member) within a specific trip context. 
 * These functions are used to determine user roles based on the trip data.
 */


import { User } from "@supabase/supabase-js";
import { TripData } from "@/stores/trip-store";

interface UserInfo {
  id: string;
  email?: string;
  isCreator: (tripData: TripData | null) => boolean;
  isAdmin: (tripData: TripData | null) => boolean;
  isMember: (tripData: TripData | null) => boolean;
  getRole: (tripData: TripData | null) => string | undefined;
}

export function getUserInfo(user: User | null): UserInfo | null {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,

    isCreator: (tripData: TripData | null) => {
      return (
        tripData?.members.some(
          (member) => member.userId === user.id && member.role === "creator"
        ) ?? false
      );
    },

    isAdmin: (tripData: TripData | null) => {
      return (
        tripData?.members.some(
          (member) => member.userId === user.id && member.role === "admin"
        ) ?? false
      );
    },

    isMember: (tripData: TripData | null) => {
      return (
        tripData?.members.some((member) => member.userId === user.id) ?? false
      );
    },

    getRole: (tripData: TripData | null) => {
      return tripData?.members.find((member) => member.userId === user.id)
        ?.role;
    },
  };
}
