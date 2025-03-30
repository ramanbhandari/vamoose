/**
 * @file mapbox.ts
 * @description Utility functions and types for working with the Mapbox Search API.
 * Includes support for location suggestions, detailed location retrieval, and category-based POI fetching.
 *
 * Constants:
 * - `SEARCH_RADIUS_KM`: Default search radius used for POI queries.
 *
 */

import * as turf from "@turf/turf";
import { v4 as uuidv4 } from "uuid";

export const SEARCH_RADIUS_KM = 1;

export interface POI {
  id: string;
  name: string;
  address?: string;
  website?: string;
  locationType: LocationType;
  coordinates: [number, number]; // [longitude, latitude]
  properties?: Record<string, unknown>;
  notes?: string;
  hasSavedVersion?: boolean;
}

export interface SearchResult {
  id?: string;
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

interface MapboxSuggestion {
  name: string;
  mapbox_id: string;
  feature_type: string;
  address?: string;
  full_address?: string;
  place_formatted?: string;
  context?: {
    country?: {
      name?: string;
    };
    region?: {
      name?: string;
    };
    place?: {
      name?: string;
    };
  };
}

interface MapboxSuggestResponse {
  suggestions: MapboxSuggestion[];
  attribution: string;
}

interface MapboxRetrieveResponse {
  features: {
    type: string;
    properties: {
      name: string;
      mapbox_id: string;
      feature_type: string;
      full_address?: string;
    };
    geometry: {
      coordinates: [number, number];
      type: string;
    };
  }[];
  attribution: string;
}

// Session token to group related search API calls
let sessionToken = uuidv4();

// Reset session token periodically
export function resetSessionToken() {
  sessionToken = uuidv4();
  return sessionToken;
}

/**
 * Search for locations using Mapbox Search Box API with suggestions and proximity
 */
export async function searchLocation(
  query: string,
  limit: number = 10,
  proximity?: [number, number]
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

  // Build the URL with optional proximity parameter
  let url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodedQuery}&limit=${limit}&session_token=${sessionToken}&access_token=${token}`;

  // Add proximity if provided
  if (proximity && proximity.length === 2) {
    url += `&proximity=${proximity[0]},${proximity[1]}`;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Mapbox Search Box API error: ${response.status}`);
    }

    const data = (await response.json()) as MapboxSuggestResponse;

    if (
      !data.suggestions ||
      !Array.isArray(data.suggestions) ||
      data.suggestions.length === 0
    ) {
      return [];
    }

    // Return suggestions without coordinates for display in dropdown
    return data.suggestions.map((suggestion) => {
      return {
        id: suggestion.mapbox_id,
        name: suggestion.name,
        coordinates: [0, 0],
        address:
          suggestion.full_address ||
          suggestion.address ||
          suggestion.place_formatted,
        placeType: suggestion.feature_type,
      };
    });
  } catch (error) {
    console.error("Error searching for location:", error);
    return [];
  }
}

/**
 * Retrieve detailed information for a selected suggestion
 */
export async function retrieveLocation(
  suggestionId: string
): Promise<SearchResult | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!token) {
    console.error("Mapbox access token is missing");
    return null;
  }

  try {
    const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestionId}?session_token=${sessionToken}&access_token=${token}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Mapbox Retrieve API error: ${response.status}`);
    }

    const data = (await response.json()) as MapboxRetrieveResponse;

    if (
      !data.features ||
      !Array.isArray(data.features) ||
      data.features.length === 0
    ) {
      return null;
    }

    const feature = data.features[0];

    return {
      id: feature.properties.mapbox_id,
      name: feature.properties.name,
      coordinates: feature.geometry.coordinates as [number, number],
      address: feature.properties.full_address,
      placeType: feature.properties.feature_type,
    };
  } catch (error) {
    console.error("Error retrieving location details:", error);
    return null;
  }
}

/**
 * Fetches Points of Interest by location type using Mapbox Category Search API
 */
export async function fetchPOIsByType(
  locationType: LocationType,
  center: [number, number],
  radiusKm: number = SEARCH_RADIUS_KM,
  limit: number = 15
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