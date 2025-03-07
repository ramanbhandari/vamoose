import { useState, useEffect, useCallback } from "react";
import maplibre, { Map as MapType } from "maplibre-gl";
import {
  Box,
  IconButton,
  useTheme,
  CircularProgress,
  Typography,
} from "@mui/material";
import { MyLocation } from "@mui/icons-material";
import { useNotificationStore } from "@/stores/notification-store";
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

  // Auto-locate on mount, if fails tell the user that theres an error (mostly browser block)
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
        map?.flyTo({
          center: [longitude, latitude],
          zoom: 14,
        });
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
  }, [map, setNotification]);

  return (
    <Box
      sx={{
        position: "relative",
        height: "100vh",
        width: "100%",
        borderRadius: theme.shape.borderRadius,
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      <div ref={(el) => setMapContainer(el)} className="w-full h-full" />

      <Box
        sx={{
          position: "absolute",
          top: theme.spacing(2),
          left: theme.spacing(2),
          p: 1,
          display: "flex",
          gap: 1,
          zIndex: 1,
        }}
      >
        <IconButton
          onClick={handleGeolocate}
          color="primary"
          aria-label="Locate me"
          sx={{
            backgroundColor: theme.palette.background.paper,
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
        style={{ position: "absolute", bottom: 0, right: 6, zIndex: 1000 }}
      >
        <Typography variant="caption" color="primary">
          Map data © CARTO, OpenStreetMap contributors
        </Typography>
      </footer>
    </Box>
  );
}
