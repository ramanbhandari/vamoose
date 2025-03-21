import React, { useState, useEffect, useCallback, useRef } from "react";
import maplibre, { Map as MapType } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as turf from "@turf/turf";
import {
  Box,
  useTheme,
  CircularProgress,
  Typography,
  SvgIconProps,
} from "@mui/material";
import {
  Restaurant,
  LocalCafe,
  Hotel,
  LocalGasStation,
  ShoppingBag,
  Help,
  Place,
} from "@mui/icons-material";
import { useNotificationStore } from "@/stores/notification-store";
import MapSearchFilter from "./MapSearchFilter";
import Marker from "./Marker";
import {
  fetchPOIsByType,
  POI,
  LocationType,
  SEARCH_RADIUS_KM,
  SearchResult,
} from "./services/mapbox";
import MarkerCard from "./MarkerCard";
import { GeolocationButton, RadiusSlider } from "./controls";
import { getGeolocation } from "./utils/geolocation";
import { useParams } from "next/navigation";
import {
  getSavedLocations,
  markedLocationToPOI,
  SavedPOI,
} from "./services/markedLocations";

// Map location types to icons and colors
const locationConfig: Record<
  LocationType,
  { icon: React.ReactElement<SvgIconProps>; color: string }
> = {
  [LocationType.Hotels]: { icon: <Hotel />, color: "#5C6BC0" },
  [LocationType.FoodAndDrink]: { icon: <Restaurant />, color: "#FF5252" },
  [LocationType.CoffeeShops]: { icon: <LocalCafe />, color: "#8D6E63" },
  [LocationType.Shopping]: { icon: <ShoppingBag />, color: "#EC407A" },
  [LocationType.GasStations]: { icon: <LocalGasStation />, color: "#66BB6A" },
  [LocationType.Other]: { icon: <Help />, color: "#757575" },
};

interface MapComponentProps {
  initialCenter?: [number, number];
  initialZoom?: number;
}

export default function MapComponent({
  initialCenter = [0, 0],
  initialZoom = 2,
}: MapComponentProps) {
  const theme = useTheme();
  const params = useParams();
  const tripId = Number(params.tripId);
  const isDarkMode = theme.palette.mode === "dark";
  const { setNotification } = useNotificationStore();
  const [map, setMap] = useState<MapType | null>(null);
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  // Save current location so it persists after initial load
  const [currentLocation, setCurrentLocation] = useState<
    [number, number] | null
  >(null);
  // State for POIs
  const [pois, setPois] = useState<(POI | SavedPOI)[]>([]);
  const [selectedLocationTypes, setSelectedLocationTypes] = useState<
    LocationType[]
  >([]);
  const [isLoadingPOIs, setIsLoadingPOIs] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState<POI | SavedPOI | null>(null);
  const [hoveredPOI, setHoveredPOI] = useState<POI | SavedPOI | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(SEARCH_RADIUS_KM);
  const [isLoadingSavedLocations, setIsLoadingSavedLocations] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);

  const mapStyles = {
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    light: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  };

  // Initialize the map when the container is ready
  useEffect(() => {
    if (!mapContainer) return;

    const initialMap = new maplibre.Map({
      container: mapContainer,
      style: isDarkMode ? mapStyles.dark : mapStyles.light,
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false,
      logoPosition: "bottom-left",
    });

    setMap(initialMap);

    return () => initialMap.remove();
  }, [mapContainer]); // Include necessary dependencies but still avoid infinite rerenders

  // Update map style when theme changes
  useEffect(() => {
    if (!map) return;
    map.setStyle(isDarkMode ? mapStyles.dark : mapStyles.light);
  }, [isDarkMode, map, mapStyles.dark, mapStyles.light]);

  // Fetch saved locations when the map is ready and trip ID is available
  useEffect(() => {
    const fetchSavedLocations = async () => {
      if (!map || !tripId) return;

      setIsLoadingSavedLocations(true);
      try {
        const savedLocations = await getSavedLocations(tripId);

        // Convert saved locations to POI format and ensure notes are included
        const savedPois = savedLocations.map(markedLocationToPOI);
        console.log("Saved POIs with notes:", savedPois); // Debug log

        setPois((currentPois) => {
          const unsavedPois = currentPois.filter(
            (poi) => !("isSaved" in poi) || !poi.isSaved
          );
          return [...unsavedPois, ...savedPois];
        });
      } catch (error) {
        console.error("Error fetching saved locations:", error);
        setNotification("Failed to load saved locations", "error");
      } finally {
        setIsLoadingSavedLocations(false);
      }
    };

    if (map && map.loaded()) {
      fetchSavedLocations();
    } else if (map) {
      map.once("load", fetchSavedLocations);
    }
  }, [map, tripId, setNotification]);

  // Fetch POIs when location or selected location types change
  useEffect(() => {
    const fetchPOIs = async () => {
      if (!currentLocation || selectedLocationTypes.length === 0) {
        // Don't clear saved POIs, only clear unsaved ones
        setPois((currentPois) =>
          currentPois.filter((poi) => "isSaved" in poi && poi.isSaved)
        );
        return;
      }

      setIsLoadingPOIs(true);

      try {
        // Clear existing unsaved POIs
        setPois((currentPois) =>
          currentPois.filter((poi) => "isSaved" in poi && poi.isSaved)
        );

        // Get current saved POIs
        const savedPois = pois.filter((poi) => "isSaved" in poi && poi.isSaved);

        // Fetch POIs for each selected location type
        const poiPromises = selectedLocationTypes.map((locationType) =>
          fetchPOIsByType(locationType, currentLocation, searchRadius)
        );

        const results = await Promise.all(poiPromises);

        // Combine all POIs from different categories
        const allPois = results.flat();

        // Filter POIs to ensure they're within the circle using turf
        const filteredPois = allPois.filter((poi) => {
          const distance = turf.distance(
            turf.point(currentLocation),
            turf.point(poi.coordinates),
            { units: "kilometers" }
          );
          return distance <= searchRadius;
        });

        const unsavedPois = filteredPois.map((poi) => {
          // Check if this POI has a saved version
          const hasSavedVersion = savedPois.some((savedPoi) => {
            const coordinateTolerance = 0.0001;
            return (
              Math.abs(savedPoi.coordinates[0] - poi.coordinates[0]) <
                coordinateTolerance &&
              Math.abs(savedPoi.coordinates[1] - poi.coordinates[1]) <
                coordinateTolerance &&
              savedPoi.name.toLowerCase() === poi.name.toLowerCase()
            );
          });

          // Add a property to track if this has a saved version
          return {
            ...poi,
            hasSavedVersion,
          };
        });

        // Add all POIs to the state
        setPois((currentPois) => {
          const savedPois = currentPois.filter(
            (poi) => "isSaved" in poi && poi.isSaved
          );
          return [...savedPois, ...unsavedPois];
        });
      } catch (error) {
        console.error("Error fetching POIs:", error);
        setNotification("Failed to load points of interest", "error");
      } finally {
        setIsLoadingPOIs(false);
      }
    };

    fetchPOIs();
  }, [currentLocation, selectedLocationTypes, searchRadius, setNotification]);

  // Update user location{ center map, add marker and circle, and save location}
  const updateUserLocation = useCallback(
    (longitude: number, latitude: number) => {
      if (!map) {
        console.warn("Map instance not available yet. Retrying...");
        return;
      }

      if (!map.loaded()) {
        console.warn("Map not fully loaded yet. Waiting for load event...");
        map.once("load", () => {
          console.log("Map loaded! Proceeding with location update...");
          updateUserLocation(longitude, latitude);
        });
        return;
      }

      setCurrentLocation([longitude, latitude]);

      const zoomLevel = calculateZoomForRadius(searchRadius);

      map.flyTo({
        center: [longitude, latitude],
        zoom: zoomLevel,
      });

      const circleGeoJSON = turf.circle([longitude, latitude], searchRadius, {
        steps: 64,
        units: "kilometers",
      });

      // Add or update the circle layer
      if (!map.getSource("user-radius")) {
        map.addSource("user-radius", {
          type: "geojson",
          data: circleGeoJSON,
        });
        map.addLayer({
          id: "user-radius-layer",
          type: "fill",
          source: "user-radius",
          layout: {},
          paint: {
            "fill-color": "rgba(0, 123, 255, 0.2)",
            "fill-outline-color": "rgba(0, 123, 255, 0.5)",
          },
        });
      } else {
        (map.getSource("user-radius") as maplibre.GeoJSONSource).setData(
          circleGeoJSON
        );
      }

      setIsLocating(false);
    },
    [map, searchRadius]
  );

  // Auto-locate on mount—only after the map has loaded
  useEffect(() => {
    if (!map) return;
    const autoLocate = () => {
      getGeolocation(
        (longitude, latitude) => {
          updateUserLocation(longitude, latitude);
        },
        // Error handler
        (errorMessage) => {
          setNotification(errorMessage, "error");
        }
      );
    };

    if (map.loaded()) {
      autoLocate();
    } else {
      const handleLoadEvent = () => {
        console.log("Map load event fired");
        autoLocate();
      };

      const handleIdleEvent = () => {
        console.log("Map idle event fired");
        autoLocate();
      };

      map.once("load", handleLoadEvent);
      map.once("idle", handleIdleEvent);

      // Cleanup
      return () => {
        map.off("load", handleLoadEvent);
        map.off("idle", handleIdleEvent);
      };
    }
  }, [map, updateUserLocation, setNotification]);

  // Re-add the circle layer after a style change
  useEffect(() => {
    if (!map || !currentLocation) return;

    const readdCircleLayer = () => {
      const circleGeoJSON = turf.circle(currentLocation, searchRadius, {
        steps: 64,
        units: "kilometers",
      });

      if (!map.getSource("user-radius")) {
        map.addSource("user-radius", {
          type: "geojson",
          data: circleGeoJSON,
        });
        map.addLayer({
          id: "user-radius-layer",
          type: "fill",
          source: "user-radius",
          layout: {},
          paint: {
            "fill-color": "rgba(0, 123, 255, 0.2)",
            "fill-outline-color": "rgba(0, 123, 255, 0.5)",
          },
        });
      } else {
        (map.getSource("user-radius") as maplibre.GeoJSONSource).setData(
          circleGeoJSON
        );
      }
    };

    map.once("styledata", readdCircleLayer);
  }, [map, currentLocation, searchRadius, isDarkMode]);

  // When the tab becomes visible again, re-center the map using the saved location
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && map && currentLocation) {
        map.flyTo({
          center: currentLocation,
          zoom: 14,
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [map, currentLocation]);

  // Manual geolocation button handler
  const handleGeolocate = useCallback(() => {
    setIsLocating(true);
    getGeolocation(
      (longitude, latitude) => {
        updateUserLocation(longitude, latitude);
      },
      // Error handler
      (errorMessage) => {
        setNotification(errorMessage, "error");
      },
      setIsLocating
    );
  }, [setNotification, updateUserLocation]);

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
  };

  const handleLocationTypeFilter = (types: LocationType[]) => {
    console.log("Filtering by location types:", types);
    setSelectedLocationTypes(types);
  };

  const handleLocationSelect = (location: SearchResult) => {
    console.log("Location selected:", location);

    // Update the map center to the selected location
    if (map) {
      const { coordinates } = location;

      // Update the current location
      setCurrentLocation(coordinates);

      // Calculate zoom level based on current radius
      const zoomLevel = calculateZoomForRadius(searchRadius);

      // Fly to the selected location
      map.flyTo({
        center: coordinates,
        zoom: zoomLevel,
      });

      // Clear any selected POI
      setSelectedPOI(null);

      // Create a circle for the search radius
      const circleGeoJSON = turf.circle(coordinates, searchRadius, {
        steps: 64,
        units: "kilometers",
      });

      // Add or update the circle layer
      if (!map.getSource("user-radius")) {
        map.addSource("user-radius", {
          type: "geojson",
          data: circleGeoJSON,
        });
        map.addLayer({
          id: "user-radius-layer",
          type: "fill",
          source: "user-radius",
          layout: {},
          paint: {
            "fill-color": "rgba(0, 123, 255, 0.2)",
            "fill-outline-color": "rgba(0, 123, 255, 0.5)",
          },
        });
      } else {
        (map.getSource("user-radius") as maplibre.GeoJSONSource).setData(
          circleGeoJSON
        );
      }
    }
  };

  const handleUserMarkerClick = () => {
    setSelectedPOI(null);
  };

  const handlePOIMarkerClick = (poi: POI | SavedPOI) => {
    console.log("Selected POI:", poi); // Debug log
    setSelectedPOI(poi);

    // Center the map on the POI
    if (map) {
      map.flyTo({
        center: poi.coordinates,
        zoom: 16,
      });
    }
  };

  // Mouse event handlers for POI markers
  const handlePOIMarkerMouseEnter = (poi: POI | SavedPOI) => {
    setHoveredPOI(poi);
  };

  const handlePOIMarkerMouseLeave = () => {
    setHoveredPOI(null);
  };

  // Update user location marker position when map moves
  useEffect(() => {
    if (!map || !currentLocation) return;

    const updateMarkerPosition = () => {
      const markerEl = document.getElementById("user-location-marker");
      if (markerEl) {
        const { x, y } = map.project(currentLocation);
        markerEl.style.left = `${x}px`;
        markerEl.style.top = `${y}px`;
      }
    };

    map.on("move", updateMarkerPosition);
    map.on("zoom", updateMarkerPosition);

    return () => {
      map.off("move", updateMarkerPosition);
      map.off("zoom", updateMarkerPosition);
    };
  }, [map, currentLocation]);

  // Handle radius change
  const handleRadiusChange = (_event: Event, value: number | number[]) => {
    const newRadius = Array.isArray(value) ? value[0] : value;
    setSearchRadius(newRadius);

    // Update the circle if we have a current location
    if (map && currentLocation) {
      const circleGeoJSON = turf.circle(currentLocation, newRadius, {
        steps: 64,
        units: "kilometers",
      });

      if (map.getSource("user-radius")) {
        (map.getSource("user-radius") as maplibre.GeoJSONSource).setData(
          circleGeoJSON
        );
      }

      const zoomLevel = calculateZoomForRadius(newRadius);

      map.flyTo({
        center: currentLocation,
        zoom: zoomLevel,
        duration: 500,
      });
    }
  };

  const handleSavePOI = (savedPOI: SavedPOI) => {
    // Update the POIs state to reflect the saved status
    setPois((currentPois) => {
      // Find if this POI already exists in the state
      const existingPOIIndex = currentPois.findIndex(
        (poi) =>
          poi.coordinates[0] === savedPOI.coordinates[0] &&
          poi.coordinates[1] === savedPOI.coordinates[1] &&
          poi.name === savedPOI.name
      );

      if (existingPOIIndex >= 0) {
        // Update existing POI
        const newPois = [...currentPois];
        newPois[existingPOIIndex] = savedPOI;
        return newPois;
      } else {
        // Add new POI
        return [...currentPois, savedPOI];
      }
    });

    // Update the selected POI
    setSelectedPOI(savedPOI);
  };

  const handleDeletePOI = (deletedId: string) => {
    // Get the POI being deleted to find its coordinates and name for matching
    const deletedPOI = pois.find((poi) => poi.id === deletedId);
    if (!deletedPOI) {
      console.error("Could not find POI with ID:", deletedId);
      return;
    }

    // Remove the deleted POI from the state
    setPois((currentPois) => {
      const filteredPois = currentPois.filter((poi) => poi.id !== deletedId);

      // If there was a hidden unsaved version, make it visible by removing hasSavedVersion flag
      const updatedPois = filteredPois.map((poi) => {
        if (
          !("isSaved" in poi) &&
          "hasSavedVersion" in poi &&
          poi.hasSavedVersion
        ) {
          // Check if this is the same location as the deleted one
          const coordinateTolerance = 0.0001;
          const isSameLocation =
            Math.abs(deletedPOI.coordinates[0] - poi.coordinates[0]) <
              coordinateTolerance &&
            Math.abs(deletedPOI.coordinates[1] - poi.coordinates[1]) <
              coordinateTolerance &&
            deletedPOI.name.toLowerCase() === poi.name.toLowerCase();

          if (isSameLocation) {
            // This is the unsaved version of what we just deleted - make it visible
            console.log("Making hidden unsaved POI visible:", poi.name);
            return { ...poi, hasSavedVersion: false };
          }
        }
        return poi;
      });

      console.log(
        "POIs before:",
        currentPois.length,
        "POIs after:",
        updatedPois.length
      ); // Debug log
      return updatedPois;
    });

    // Clear the selected POI if it was the one that was deleted
    if (selectedPOI && selectedPOI.id === deletedId) {
      setSelectedPOI(null);
    }

    // After deleting, refetch the saved locations to ensure sync with server
    const refetchSavedLocations = async () => {
      try {
        const savedLocations = await getSavedLocations(tripId);
        const savedPois = savedLocations.map(markedLocationToPOI);

        // Update only saved POIs, keeping unsaved ones
        setPois((currentPois) => {
          // Keep only unsaved POIs
          const unsavedPois = currentPois.filter(
            (poi) => !("isSaved" in poi) || !poi.isSaved
          );
          return [...unsavedPois, ...savedPois];
        });
      } catch (error) {
        console.error("Error refetching saved locations after delete:", error);
      }
    };

    // Delay the refetch slightly to allow the server to process the delete
    setTimeout(refetchSavedLocations, 500);
  };

  const calculateZoomForRadius = (radiusKm: number): number => {
    return 16 - Math.log2(radiusKm) * 2;
  };

  return (
    <Box sx={{ position: "relative" }}>
      <Box
        ref={mapRef}
        sx={{
          position: "relative",
          height: "45rem",
          width: "100%",
          borderRadius: theme.shape.borderRadius,
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.3s ease-in-out",
        }}
      >
        <div ref={(el) => setMapContainer(el)} className="w-full h-full" />

        {/* Render user location marker */}
        {map && currentLocation && (
          <div
            style={{
              position: "absolute",
              zIndex: 1,
              pointerEvents: "none",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
            }}
          >
            <div
              style={{
                position: "absolute",
                transform: "translate(-50%, -100%)",
                pointerEvents: "auto",
              }}
              id="user-location-marker"
              ref={(el) => {
                if (el && map) {
                  const { x, y } = map.project(currentLocation);
                  el.style.left = `${x}px`;
                  el.style.top = `${y}px`;
                }
              }}
            >
              <Place
                color="primary"
                fontSize="large"
                sx={{
                  fontSize: 44,
                  filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.4))",
                  cursor: "pointer",
                }}
                onClick={handleUserMarkerClick}
              />
            </div>
          </div>
        )}

        {/* Render POI markers */}
        {map &&
          pois.map((poi) => {
            // Skip rendering unsaved POIs that have a saved version
            if (
              !("isSaved" in poi) &&
              "hasSavedVersion" in poi &&
              poi.hasSavedVersion
            ) {
              return null;
            }

            const config = locationConfig[poi.locationType];
            return (
              <Marker
                key={poi.id}
                map={map}
                position={poi.coordinates}
                color={config.color}
                size={32}
                onClick={() => handlePOIMarkerClick(poi)}
                icon={config.icon}
                onMouseEnter={() => handlePOIMarkerMouseEnter(poi)}
                onMouseLeave={handlePOIMarkerMouseLeave}
                isSaved={"isSaved" in poi && poi.isSaved}
              />
            );
          })}

        {/* Conditionally render the MarkerCard on hover */}
        {hoveredPOI && map && hoveredPOI.id !== selectedPOI?.id && (
          <MarkerCard
            key={`hover-${hoveredPOI.id}`}
            map={map}
            coordinates={hoveredPOI.coordinates}
            name={hoveredPOI.name}
            address={hoveredPOI.address}
            locationType={hoveredPOI.locationType}
            color={locationConfig[hoveredPOI.locationType].color}
            isSelected={false}
            isSaved={"isSaved" in hoveredPOI && hoveredPOI.isSaved}
            onMouseEnter={() => setHoveredPOI(hoveredPOI)}
            onMouseLeave={() => setHoveredPOI(null)}
          />
        )}

        {/* Selected POI Info */}
        {selectedPOI && map && (
          <MarkerCard
            key={`selected-${selectedPOI.id}`}
            map={map}
            coordinates={selectedPOI.coordinates}
            name={selectedPOI.name}
            address={selectedPOI.address}
            locationType={selectedPOI.locationType}
            color={locationConfig[selectedPOI.locationType].color}
            isSelected={true}
            website={selectedPOI.website}
            onClose={() => setSelectedPOI(null)}
            isSaved={"isSaved" in selectedPOI && selectedPOI.isSaved}
            notes={selectedPOI.notes}
            onSave={handleSavePOI}
            onDelete={handleDeletePOI}
            id={selectedPOI.id}
            createdBy={
              "createdBy" in selectedPOI ? selectedPOI.createdBy : undefined
            }
          />
        )}

        {/* Map Search and Filter Component */}
        <Box
          sx={{
            position: "absolute",
            top: theme.spacing(2),
            left: theme.spacing(2),
            right: theme.spacing(2),
            zIndex: 2,
          }}
        >
          <Box
            sx={{
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backdropFilter: "blur(8px)",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: theme.shape.borderRadius,
              },
            }}
          >
            <MapSearchFilter
              onSearch={handleSearch}
              onTagFilter={handleLocationTypeFilter}
              onLocationSelect={handleLocationSelect}
            />
          </Box>
        </Box>

        {/* Radius Slider */}
        <RadiusSlider
          searchRadius={searchRadius}
          onRadiusChange={handleRadiusChange}
        />

        {/* Geolocation Button */}
        <GeolocationButton
          isLocating={isLocating}
          onGeolocate={handleGeolocate}
        />

        {/* Loading indicator for POIs */}
        {(isLoadingPOIs || isLoadingSavedLocations) && (
          <Box
            sx={{
              position: "absolute",
              bottom: theme.spacing(2),
              right: theme.spacing(2),
              p: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
              zIndex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              borderRadius: theme.shape.borderRadius,
              color: "white",
            }}
          >
            <CircularProgress size={20} color="inherit" />
            <Typography variant="caption">
              {isLoadingSavedLocations
                ? "Loading saved locations..."
                : "Loading POIs..."}
            </Typography>
          </Box>
        )}

        <footer
          style={{
            position: "absolute",
            bottom: 0,
            right: 6,
            zIndex: 1000,
            transition: "all 0.3s ease-in-out",
          }}
        >
          <Typography variant="caption" color="primary">
            Map data © CARTO, OpenStreetMap contributors | POI data © Mapbox
          </Typography>
        </footer>
      </Box>
    </Box>
  );
}
