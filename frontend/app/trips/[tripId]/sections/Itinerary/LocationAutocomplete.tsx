import React, { useState, useEffect } from "react";
import {
  Autocomplete,
  TextField,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import LocationOn from "@mui/icons-material/LocationOn";

interface LocationOption {
  properties: {
    name: string;
    city?: string;
    country?: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

interface LocationAutocompleteProps {
  onSelect: (option: LocationOption) => void;
  value: string;
  onChange: (value: string) => void;
}

export default function LocationAutocomplete({
  onSelect,
  value,
  onChange,
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      if (inputValue.length < 3) {
        setOptions([]);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(
            inputValue
          )}&limit=5`
        );
        const data = await response.json();
        setOptions(data.features);
      } catch (error) {
        console.error("Error fetching locations:", error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchLocations();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [inputValue]);

  return (
    <Autocomplete
      freeSolo
      options={options}
      getOptionLabel={(option) =>
        typeof option === "string"
          ? option
          : `${option.properties.name}${
              option.properties.city ? `, ${option.properties.city}` : ""
            }${option.properties.country ? `, ${option.properties.country}` : ""}`
      }
      filterOptions={(x) => x}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
        onChange(newInputValue);
      }}
      onChange={(event, newValue) => {
        if (newValue && typeof newValue !== "string") {
          onSelect(newValue);
          onChange(
            `${newValue.properties.name}${
              newValue.properties.city ? `, ${newValue.properties.city}` : ""
            }${newValue.properties.country ? `, ${newValue.properties.country}` : ""}`
          );
        }
      }}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Location"
          variant="outlined"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <LocationOn sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
