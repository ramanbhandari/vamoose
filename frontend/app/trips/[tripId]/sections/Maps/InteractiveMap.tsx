import React, { useState, useEffect, useCallback } from "react";
import maplibre, { Map as MapType } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as turf from "@turf/turf";
import {
  Box,
  IconButton,
  useTheme,
  CircularProgress,
  Typography,
  Paper,
  Fade,
  SvgIconProps,
  Link,
  Slider,
} from "@mui/material";
import {
  MyLocation,
  Restaurant,
  LocalCafe,
  Hotel,
  LocalGasStation,
  ShoppingBag,
  Help,
  Clear,
  Place,
  Language,
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
  const [pois, setPois] = useState<POI[]>([]);
  const [selectedLocationTypes, setSelectedLocationTypes] = useState<
    LocationType[]
  >([]);
  const [isLoadingPOIs, setIsLoadingPOIs] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [hoveredPOI, setHoveredPOI] = useState<POI | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(SEARCH_RADIUS_KM);

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

    initialMap.addControl(new maplibre.NavigationControl(), "top-right");
    setMap(initialMap);

    return () => initialMap.remove();
  }, [mapContainer]); //ignore other dependencies, cause it re-renders the map infinitely

  // Update map style when theme changes
  useEffect(() => {
    if (!map) return;
    map.setStyle(isDarkMode ? mapStyles.dark : mapStyles.light);
  }, [isDarkMode, map, mapStyles.dark, mapStyles.light]);

  // Fetch POIs when location or selected location types change
  useEffect(() => {
    const fetchPOIs = async () => {
      if (!currentLocation || selectedLocationTypes.length === 0) {
        setPois([]);
        return;
      }

      setIsLoadingPOIs(true);

      try {
        // Clear existing POIs
        setPois([]);

        // Fetch POIs for each selected location type
        const poiPromises = selectedLocationTypes.map((locationType) =>
          fetchPOIsByType(locationType, currentLocation, searchRadius)
        );

        const results = await Promise.all(poiPromises);

        // Combine all POIs from different categories
        const allPois = results.flat();

        setPois(allPois);
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

      // Calculate zoom level based on current radius
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
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { longitude, latitude } = position.coords;
            updateUserLocation(longitude, latitude);
          },
          (error) => {
            setNotification("Automatic location detection failed", "error");
            console.error(error);
          }
        );
      } else {
        setNotification(
          "Geolocation is not supported by your browser",
          "error"
        );
      }
    };

    if (map.loaded()) {
      autoLocate();
    } else {
      map.once("load", autoLocate);
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
    if (!navigator.geolocation) {
      setNotification("Geolocation is not supported by your browser", "error");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        updateUserLocation(longitude, latitude);
      },
      (error) => {
        setIsLocating(false);
        setNotification("Location access was denied", "error");
        console.error(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
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

  const handlePOIMarkerClick = (poi: POI) => {
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
  const handlePOIMarkerMouseEnter = (poi: POI) => {
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

      // Adjust zoom level based on radius
      // Smaller radius = higher zoom level (more zoomed in)
      // Larger radius = lower zoom level (more zoomed out)
      const zoomLevel = calculateZoomForRadius(newRadius);

      map.flyTo({
        center: currentLocation,
        zoom: zoomLevel,
        duration: 500, // shorter animation for better UX when sliding
      });
    }
  };

  // Calculate appropriate zoom level based on radius
  const calculateZoomForRadius = (radiusKm: number): number => {
    // These values can be adjusted based on preference
    // The formula creates a logarithmic relationship between radius and zoom
    // Max zoom (closest) = 16 when radius = 1km
    // Min zoom (furthest) = 10 when radius = 10km
    return 16 - Math.log2(radiusKm) * 2;
  };

  return (
    <Box sx={{ position: "relative" }}>
      <Box
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
              zIndex: 5,
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
              />
            );
          })}

        {/* Conditionally render the MarkerCard on hover */}
        {hoveredPOI && map && (
          <MarkerCard
            key={hoveredPOI.id}
            map={map}
            coordinates={hoveredPOI.coordinates}
            name={hoveredPOI.name}
            address={hoveredPOI.address}
            locationType={hoveredPOI.locationType}
            color={locationConfig[hoveredPOI.locationType].color}
          />
        )}

        {/* POI Info Popup */}
        {selectedPOI && (
          <Box
            sx={{
              position: "absolute",
              bottom: theme.spacing(10),
              left: "50%",
              transform: "translateX(-50%)",
              width: "90%",
              maxWidth: "400px",
              zIndex: 10,
            }}
          >
            <Fade in={!!selectedPOI}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  borderLeft: `4px solid ${locationConfig[selectedPOI.locationType].color}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box
                    sx={{
                      mr: 1,
                      color: locationConfig[selectedPOI.locationType].color,
                    }}
                  >
                    {locationConfig[selectedPOI.locationType].icon}
                  </Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {selectedPOI.name}
                  </Typography>
                </Box>

                {selectedPOI.address && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {selectedPOI.address}
                  </Typography>
                )}

                {/* Website links section */}
                <Box
                  sx={{
                    mt: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                  }}
                >
                  {/* Direct website link */}
                  {selectedPOI.website && (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Language
                        fontSize="small"
                        sx={{ mr: 0.5, color: theme.palette.primary.main }}
                      />
                      <Link
                        href={selectedPOI.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="body2"
                        sx={{
                          textDecoration: "none",
                          "&:hover": { textDecoration: "underline" },
                          color: theme.palette.primary.main,
                          fontWeight: "medium",
                        }}
                      >
                        Visit website
                      </Link>
                    </Box>
                  )}

                  {/* Google search link */}
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Language
                      fontSize="small"
                      sx={{ mr: 0.5, color: "text.secondary" }}
                    />
                    <Link
                      href={`https://www.google.com/search?q=${encodeURIComponent(selectedPOI.name + " " + (selectedPOI.address || ""))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="body2"
                      sx={{
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      Search on Google
                    </Link>
                  </Box>
                </Box>

                <Box
                  sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}
                >
                  <IconButton size="small" onClick={() => setSelectedPOI(null)}>
                    <Clear fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            </Fade>
          </Box>
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
        <Box
          sx={{
            position: "absolute",
            bottom: theme.spacing(12),
            left: theme.spacing(3.75),
            zIndex: 100,
            height: "150px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Slider
            value={searchRadius}
            min={1}
            max={15}
            step={1}
            orientation="vertical"
            onChange={handleRadiusChange}
            valueLabelDisplay="off"
            aria-labelledby="search-radius-slider"
            sx={{
              height: "100%",
              "& .MuiSlider-thumb": {
                width: 16,
                height: 16,
              },
              "& .MuiSlider-track": {
                width: 4,
              },
              "& .MuiSlider-rail": {
                width: 4,
              },
            }}
          />
          <Typography
            variant="caption"
            color="white"
            sx={{
              mt: 1,
              textShadow: "0px 0px 4px rgba(0,0,0,0.7)",
              fontWeight: "bold",
            }}
          >
            {searchRadius}km
          </Typography>
        </Box>

        {/* Geolocation Button */}
        <Box
          sx={{
            position: "absolute",
            bottom: theme.spacing(2),
            left: theme.spacing(2),
            p: 1,
            display: "flex",
            gap: 1,
            zIndex: 1,
            transition: "all 0.3s ease-in-out",
          }}
        >
          <IconButton
            onClick={handleGeolocate}
            color="primary"
            aria-label="Locate me"
            sx={{
              backgroundColor: theme.palette.background.paper,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                backgroundColor: theme.palette.primary.main,
              },
            }}
          >
            {isLocating ? (
              <CircularProgress size={24} />
            ) : (
              <MyLocation
                fontSize="large"
                sx={{ color: theme.palette.text.primary }}
              />
            )}
          </IconButton>
        </Box>

        {/* Loading indicator for POIs */}
        {isLoadingPOIs && (
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
            <Typography variant="caption">Loading POIs...</Typography>
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
