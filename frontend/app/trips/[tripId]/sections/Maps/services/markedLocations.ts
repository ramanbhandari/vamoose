import { LocationType } from "./mapbox";
import apiClient from "@/utils/apiClient";

export interface MarkedLocation {
  id: string;
  tripId: number;
  name: string;
  type: string;
  coordinates: { latitude: number; longitude: number };
  address?: string;
  notes?: string;
  website?: string;
  phoneNumber?: string;
  createdById: string;
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Define a POI type that matches what we're returning
export interface SavedPOI {
  id: string;
  name: string;
  address?: string;
  website?: string;
  locationType: LocationType;
  coordinates: [number, number]; // [longitude, latitude]
  isSaved: boolean;
  notes?: string;
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
  };
}

// Save a location to the trip
export async function saveLocation(
  tripId: number,
  data: {
    name: string;
    type: string;
    coordinates: { latitude: number; longitude: number };
    address?: string;
    notes?: string;
    website?: string;
    phoneNumber?: string;
  }
): Promise<MarkedLocation> {
  try {
    const response = await apiClient.post(
      `/trips/${tripId}/marked-locations`,
      data
    );
    return response.data.markedLocation;
  } catch (error) {
    console.error("Error saving location:", error);
    throw new Error(
      `Failed to save location: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Get all saved locations for a trip
export async function getSavedLocations(
  tripId: number
): Promise<MarkedLocation[]> {
  try {
    const response = await apiClient.get(`/trips/${tripId}/marked-locations`);
    return response.data.markedLocations || [];
  } catch (error) {
    console.error("Error fetching saved locations:", error);
    throw new Error(
      `Failed to fetch saved locations: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Update notes for a saved location
export async function updateLocationNotes(
  tripId: number,
  locationId: string,
  notes: string
): Promise<MarkedLocation> {
  try {
    const response = await apiClient.put(
      `/trips/${tripId}/marked-locations/${locationId}/notes`,
      { notes }
    );
    return response.data.updatedLocation;
  } catch (error) {
    console.error("Error updating location notes:", error);
    throw new Error(
      `Failed to update location notes: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Delete a saved location
export async function deleteLocation(
  tripId: number,
  locationId: string
): Promise<MarkedLocation> {
  try {
    console.log(`Deleting location with ID ${locationId} from trip ${tripId}`);
    const response = await apiClient.delete(
      `/trips/${tripId}/marked-locations/${locationId}`
    );
    console.log("Delete response:", response.data);

    if (!response.data || !response.data.deletedLocation) {
      throw new Error("Server did not return the deleted location data");
    }

    return response.data.deletedLocation;
  } catch (error) {
    console.error("Error deleting location:", error);
    throw new Error(
      `Failed to delete location: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Map server's LocationType enum to client-side LocationType
export function mapServerTypeToClientType(serverType: string): LocationType {
  const typeMap: Record<string, LocationType> = {
    ACCOMMODATION: LocationType.Hotels,
    RESTAURANT: LocationType.FoodAndDrink,
    CAFE: LocationType.CoffeeShops,
    SHOPPING: LocationType.Shopping,
    GAS_STATION: LocationType.GasStations,
  };

  return typeMap[serverType];
}

// Map client-side LocationType to server's LocationType enum
export function mapClientTypeToServerType(clientType: LocationType): string {
  const typeMap: Record<LocationType, string> = {
    [LocationType.Hotels]: "ACCOMMODATION",
    [LocationType.FoodAndDrink]: "RESTAURANT",
    [LocationType.CoffeeShops]: "CAFE",
    [LocationType.Shopping]: "SHOPPING",
    [LocationType.GasStations]: "GAS_STATION",
  };

  return typeMap[clientType];
}

// Convert MarkedLocation to POI
export function markedLocationToPOI(location: MarkedLocation): SavedPOI {
  return {
    id: location.id,
    name: location.name,
    address: location.address,
    website: location.website,
    locationType: mapServerTypeToClientType(location.type),
    coordinates: [
      location.coordinates.longitude,
      location.coordinates.latitude,
    ] as [number, number],
    isSaved: true,
    notes: location.notes,
    createdBy: location.createdBy,
  };
}