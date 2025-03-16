import * as turf from "@turf/turf";

export const SEARCH_RADIUS_KM = 1;

export interface POI {
  id: string;
  name: string;
  address?: string;
  locationType: LocationType;
  coordinates: [number, number]; // [longitude, latitude]
  properties?: Record<string, unknown>;
}

export enum LocationType {
  Hotels = "hotel",
  FoodAndDrink = "restaurant",
  CoffeeShops = "coffee",
  Shopping = "shopping",
  GasStations = "gas_station",
  Other = "other",
}

// Define a type for the Mapbox API response
interface MapboxFeature {
  id?: string;
  type?: string;
  geometry?: {
    type: string;
    coordinates: [number, number];
  };
  properties?: {
    name?: string;
    address?: string;
    category?: string;
    [key: string]: unknown;
  };
}

interface MapboxResponse {
  features?: MapboxFeature[];
  [key: string]: unknown;
}

/**
 * Fetches Points of Interest by location type using Mapbox Category Search API
 */
export async function fetchPOIsByType(
  locationType: LocationType,
  center: [number, number],
  radiusKm: number = SEARCH_RADIUS_KM,
  limit: number = 10
): Promise<POI[]> {
  // Access the token from the environment variable
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!token) {
    console.error("Mapbox access token is missing");
    return [];
  }

  // Calculate bounding box from center point and radius
  const bbox = calculateBoundingBox(center, radiusKm);

  // Format the bbox as a string for the API
  const bboxString = bbox.join(",");

  const url = `https://api.mapbox.com/search/searchbox/v1/category/${locationType}?bbox=${bboxString}&limit=${limit}&access_token=${token}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = (await response.json()) as MapboxResponse;

    // Transform the response into our POI format
    return transformMapboxResponseToPOIs(data, locationType);
  } catch (error) {
    console.error("Error fetching POIs:", error);
    return [];
  }
}

/**
 * Calculate a bounding box from a center point and radius in kilometers
 */
function calculateBoundingBox(
  center: [number, number],
  radiusKm: number
): [number, number, number, number] {
  // Create a point from the center coordinates
  const point = turf.point(center);

  // Create a circle with the given radius
  const circle = turf.circle(point, radiusKm, {
    steps: 64,
    units: "kilometers",
  });

  // Get the bounding box of the circle
  const bbox = turf.bbox(circle);

  // Return as [west, south, east, north]
  return bbox as [number, number, number, number];
}

/**
 * Transform Mapbox API response to our POI format
 */
function transformMapboxResponseToPOIs(
  response: MapboxResponse,
  locationType: LocationType
): POI[] {
  if (!response.features || !Array.isArray(response.features)) {
    return [];
  }

  return response.features.map((feature: MapboxFeature) => {
    const coordinates = feature.geometry?.coordinates || [0, 0];

    return {
      id: feature.id || `poi-${Math.random().toString(36).substring(2, 9)}`,
      name: feature.properties?.name || "Unknown Location",
      address: feature.properties?.address || "",
      locationType: locationType,
      coordinates: coordinates as [number, number],
      properties: feature.properties || {},
    };
  });
}
