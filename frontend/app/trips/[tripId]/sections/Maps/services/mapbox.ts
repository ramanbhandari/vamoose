import * as turf from "@turf/turf";

// Consistent search radius in kilometers
export const SEARCH_RADIUS_KM = 1;

export interface POI {
  id: string;
  name: string;
  address?: string;
  website?: string;
  locationType: LocationType;
  coordinates: [number, number]; // [longitude, latitude]
  properties?: Record<string, unknown>;
}

export interface SearchResult {
  name: string;
  coordinates: [number, number];
  address?: string;
  placeType?: string;
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
  place_name?: string;
  place_type?: string[];
  text?: string;
}

interface MapboxResponse {
  features?: MapboxFeature[];
  [key: string]: unknown;
}

/**
 * Search for locations using Mapbox Geocoding API
 */
export async function searchLocation(
  query: string,
  limit: number = 5
): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!token) {
    console.error("Mapbox access token is missing");
    return [];
  }

  // URL encode the query
  const encodedQuery = encodeURIComponent(query);

  // Mapbox Geocoding API endpoint
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${token}&limit=${limit}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Mapbox Geocoding API error: ${response.status}`);
    }

    const data = (await response.json()) as MapboxResponse;

    if (!data.features || !Array.isArray(data.features)) {
      return [];
    }

    return data.features.map((feature) => {
      const coordinates = feature.geometry?.coordinates || [0, 0];

      return {
        name: feature.text || feature.place_name || "Unknown location",
        coordinates: coordinates as [number, number],
        address: feature.place_name,
        placeType: feature.place_type?.[0],
      };
    });
  } catch (error) {
    console.error("Error searching for location:", error);
    return [];
  }
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
    const properties = feature.properties || {};
    const name = properties.name || "Unknown Location";

    // Extract website from metadata.website
    let website = "";

    // Check if metadata exists and has a website property
    if (properties.metadata && typeof properties.metadata === "object") {
      const metadata = properties.metadata as Record<string, unknown>;
      if (metadata.website && typeof metadata.website === "string") {
        website = metadata.website;
      }
    }
    
    // Ensure website has proper protocol
    if (website && !website.startsWith("http")) {
      website = "https://" + website;
    }

    return {
      id: feature.id || `poi-${Math.random().toString(36).substring(2, 9)}`,
      name,
      address: properties.address || "",
      website,
      locationType: locationType,
      coordinates: coordinates as [number, number],
      properties,
    };
  });
}
