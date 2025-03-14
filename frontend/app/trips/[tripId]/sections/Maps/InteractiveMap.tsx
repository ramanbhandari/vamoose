import { useState, useEffect, useCallback } from "react";
import maplibre, { Map as MapType } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Box,
  IconButton,
  useTheme,
  CircularProgress,
  Typography,
} from "@mui/material";
import { MyLocation } from "@mui/icons-material";
import { useNotificationStore } from "@/stores/notification-store";
import MapSearchFilter from "./MapSearchFilter";

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
  const [userMarker, setUserMarker] = useState<maplibre.Marker | null>(null);

  const mapStyles = {
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    light: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapContainer]);

  // Update map style when theme changes
  useEffect(() => {
    if (!map) return;
    map.setStyle(isDarkMode ? mapStyles.dark : mapStyles.light);
  }, [isDarkMode, map, mapStyles.dark, mapStyles.light]);

  // Auto-locate on mount
  useEffect(() => {
    if (!map) return;

    const autoLocate = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { longitude, latitude } = position.coords;
            map.flyTo({
              center: [longitude, latitude],
              zoom: 14,
            });
            // Add a red marker at the user's location
            const newMarker = new maplibre.Marker({ color: "var(--primary)" })
              .setLngLat([longitude, latitude])
              .addTo(map);

            setUserMarker(newMarker);
            setIsLocating(false);
          },
          (error) => {
            setNotification("Automatic location detection failed", "error");
            console.log(error);
          }
        );
      }
    };

    autoLocate();
  }, [map, setNotification]);

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

        // Ensure the map is loaded before adding the marker
        if (!map || !map.loaded()) {
          console.error("Map not loaded yet.");
          setIsLocating(false);
          return;
        }

        map.flyTo({
          center: [longitude, latitude],
          zoom: 14,
        });

        // Add a red marker at the user's location
        const newMarker = new maplibre.Marker({ color: "var(--primary)" })
          .setLngLat([longitude, latitude])
          .addTo(map);

        setUserMarker(newMarker);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        setNotification("Location access was denied", "error");
        console.log(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [map, setNotification, userMarker]);

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
  };

  const handleTagFilter = (tags: string[]) => {
    console.log("Filtering by tags:", tags);
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
              onTagFilter={handleTagFilter}
            />
          </Box>
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
            Map data © CARTO, OpenStreetMap contributors
          </Typography>
        </footer>
      </Box>
    </Box>
  );
}
