/**
 * @file DestinationField.tsx
 * @description A form field with autocomplete for selecting a destination using the Photon geocoding API. Includes error handling and dynamic suggestion list.
 */

import React, { useState, useRef } from "react";
import {
  TextField,
  Popper,
  Paper,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";

interface CitySuggestion {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

interface ApiResponse {
  features: {
    properties: {
      name: string;
      country: string;
    };
    geometry: {
      coordinates: [number, number]; // [longitude, latitude]
    };
  }[];
}

const DestinationField: React.FC<{
  tripDetails: {
    name: string;
    description: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: string;
    currency: string;
  };
  setTripDetails: React.Dispatch<
    React.SetStateAction<{
      name: string;
      description: string;
      destination: string;
      startDate: string;
      endDate: string;
      budget: string;
      currency: string;
    }>
  >;
  errors: { destination?: string };
  setErrors: React.Dispatch<React.SetStateAction<{ destination?: string }>>;
  setGlobalError: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({ tripDetails, setTripDetails, errors, setErrors, setGlobalError }) => {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDestinationChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    setTripDetails((prev) => ({
      ...prev,
      destination: value ?? "",
    }));

    if (value.trim()) {
      setErrors((prev) => ({ ...prev, destination: "" }));
      setGlobalError(null);
    }

    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(value)}&limit=5`
      );
      const data: ApiResponse = await response.json();

      setSuggestions(
        data.features.map((place) => ({
          name: place.properties.name,
          country: place.properties.country,
          lat: place.geometry.coordinates[1],
          lon: place.geometry.coordinates[0],
        }))
      );
    } catch (error) {
      console.error("Error fetching city suggestions:", error);
    }
  };

  const handleSelectCity = (city: CitySuggestion) => {
    if (!city || !city.name || !city.country) return;

    setTripDetails((prev) => ({
      ...prev,
      destination: `${city.name}, ${city.country}`,
    }));

    setSuggestions([]);
  };

  return (
    <div style={{ position: "relative", zIndex: 100 }}>
      <TextField
        fullWidth
        label="Destination"
        margin="normal"
        required
        value={tripDetails.destination ?? ""}
        onChange={handleDestinationChange}
        error={!!errors.destination}
        helperText={errors.destination}
        inputRef={(el) => (inputRef.current = el)}
      />

      <Popper
        open={suggestions.length > 0}
        anchorEl={inputRef.current}
        placement="bottom-start"
        disablePortal
        style={{ zIndex: 1300 }}
        modifiers={[
          {
            name: "preventOverflow",
            options: {
              boundary: "window",
            },
          },
          {
            name: "flip",
            options: {
              fallbackPlacements: ["bottom-end", "top-start"],
            },
          },
        ]}
      >
        <Paper style={{ width: inputRef.current?.clientWidth || 300 }}>
          <List>
            {suggestions.map((city, index) => (
              <ListItemButton
                key={index}
                onClick={() => handleSelectCity(city)}
              >
                <ListItemText primary={`${city.name}, ${city.country}`} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Popper>
    </div>
  );
};

export default DestinationField;
