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
        backgroundColor: theme.palette.background.paper,
        opacity: 0.95,
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
              sx={{ ml: 1 }}
            >
              <FilterList />
            </IconButton>
          )}
        </Box>

        {showFilters && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
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
                />
              ))}
            </Box>

            {selectedTags.length > 0 && (
              <Chip
                label="Clear all"
                size="small"
                variant="outlined"
                onClick={() => {
                  setSelectedTags([]);
                  onTagFilter?.([]);
                }}
                sx={{ ml: "auto" }}
              />
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
}
