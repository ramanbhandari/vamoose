"use client";

import React from "react";
import {
  Toolbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
  Box,
  Button,
} from "@mui/material";
import { PollFilter } from "./types";
import { Add, FilterList, Person } from "@mui/icons-material";

import { pollStatusOptions } from "./constants";
import { Member } from "@/types";

interface PollFiltersProps {
  filters: PollFilter;
  members: Member[];
  onFilterChange: (name: keyof PollFilter, value: string) => void;
}

export default function PollFilters({
  filters,
  members,
  onFilterChange,
}: PollFiltersProps) {
  const membersList = Array.from(new Set(members.map((e) => e.user.email))).map(
    (email) => ({
      value: email,
      label: email,
    })
  );
  return (
    // <Container maxWidth="lg" sx={{ py: 4 }}>
    // <Box sx={{ mb: 4 }}>
    <Toolbar
      sx={{
        p: "8px !important",
        bgcolor: "background.paper",
        borderRadius: 2,
        mb: 2,
        gap: 2,
        flexWrap: "wrap",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexGrow: 1,
        }}
      >
        <FilterList color="action" />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            label="Category"
          >
            {pollStatusOptions.map((cat) => (
              <MenuItem key={cat.value} value={cat.value}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {cat.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Created By</InputLabel>
          <Select
            value={filters.createdBy}
            onChange={(e) => handleFilterChange("createdBy", e.target.value)}
            label="Created By"
          >
            <MenuItem value="">All Users</MenuItem>
            {membersList.map((user) => (
              <MenuItem key={user.value} value={user.value}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Person fontSize="small" />
                  {user.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={() => setOpen(true)}
        sx={{ ml: "auto" }}
      >
        Create a new Poll
      </Button>
    </Toolbar>
    // </Box>
    // </Container>
  );
}
