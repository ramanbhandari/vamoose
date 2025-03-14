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

interface MapSearchFilterProps {
  onSearch?: (query: string) => void;
  onTagFilter?: (tags: string[]) => void;
}

// Sample tags - these would typically come from your data
const SAMPLE_TAGS = [
  "Restaurant",
  "Hotel",
  "Attraction",
  "Museum",
  "Park",
  "Beach",
  "Landmark",
];

export default function MapSearchFilter({
  onSearch,
  onTagFilter,
}: MapSearchFilterProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
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

  const handleTagToggle = (tag: string) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(newSelectedTags);
    onTagFilter?.(newSelectedTags);
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
              {SAMPLE_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  color={selectedTags.includes(tag) ? "primary" : "default"}
                  onClick={() => handleTagToggle(tag)}
                  clickable
                  size="small"
                  sx={{
                    transition: "all 0.2s ease-in-out",
                  }}
                />
              ))}
            </Box>

            {(isMobile || selectedTags.length > 0) && (
              <Chip
                label="Clear all"
                size="small"
                variant="outlined"
                onClick={() => {
                  setSelectedTags([]);
                  onTagFilter?.([]);
                }}
                sx={{
                  ml: "auto",
                  transition: "all 0.2s ease-in-out",
                  opacity: selectedTags.length > 0 ? 1 : 0.6,
                }}
              />
            )}
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
}
