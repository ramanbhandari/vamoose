import { useState } from "react";
import {
  Box,
  TextField,
  Chip,
  InputAdornment,
  useTheme,
  Paper,
  IconButton,
  Typography,
  useMediaQuery,
  Collapse,
} from "@mui/material";
import { Search, Clear, FilterList } from "@mui/icons-material";
import { LocationType } from "./services/mapbox";

interface MapSearchFilterProps {
  onSearch?: (query: string) => void;
  onTagFilter?: (types: LocationType[]) => void;
}

// Map of location types to display names
const LOCATION_TYPES: Record<LocationType, string> = {
  [LocationType.Hotels]: "Hotels",
  [LocationType.FoodAndDrink]: "Food & Drink",
  [LocationType.CoffeeShops]: "Coffee Shops",
  [LocationType.Shopping]: "Shopping",
  [LocationType.GasStations]: "Gas Stations",
  [LocationType.Other]: "Other",
};

export default function MapSearchFilter({
  onSearch,
  onTagFilter,
}: MapSearchFilterProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<LocationType[]>([]);
  const [showFilters, setShowFilters] = useState(!isMobile);
  const isDarkMode = theme.palette.mode === "dark";

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    onSearch?.("");
  };

  const handleTypeToggle = (type: LocationType) => {
    const newSelectedTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];

    setSelectedTypes(newSelectedTypes);
    onTagFilter?.(newSelectedTypes);
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        width: "100%",
        borderRadius: theme.shape.borderRadius,
        opacity: 0.95,
        transition: "all 0.3s ease-in-out",
        position: "relative",
        backdropFilter: "blur(10px)",
        backgroundColor: "rgba(255, 255, 255, 0)",
        border: `1px solid ${
          isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
        }`,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={handleSearch}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    edge="end"
                    aria-label="clear search"
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {isMobile && (
            <IconButton
              onClick={handleToggleFilters}
              color={showFilters ? "primary" : "default"}
              sx={{
                ml: 1,
                transition: "all 0.2s ease-in-out",
                transform: showFilters ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <FilterList />
            </IconButton>
          )}
        </Box>

        <Collapse in={showFilters} timeout={300}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            {!isMobile && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  whiteSpace: "nowrap",
                  mr: 1,
                }}
              >
                Filter by:
              </Typography>
            )}

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                flex: 1,
              }}
            >
              {Object.entries(LOCATION_TYPES).map(([type, label]) => (
                <Chip
                  key={type}
                  label={label}
                  color={
                    selectedTypes.includes(type as LocationType)
                      ? "primary"
                      : "default"
                  }
                  onClick={() => handleTypeToggle(type as LocationType)}
                  clickable
                  size="small"
                  sx={{
                    transition: "all 0.2s ease-in-out",
                  }}
                />
              ))}
            </Box>

            {(isMobile || selectedTypes.length > 0) && (
              <Chip
                label="Clear all"
                size="small"
                variant="outlined"
                onClick={() => {
                  setSelectedTypes([]);
                  onTagFilter?.([]);
                }}
                sx={{
                  ml: "auto",
                  transition: "all 0.2s ease-in-out",
                  opacity: selectedTypes.length > 0 ? 1 : 0.6,
                }}
              />
            )}
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
}
