"use client"

import React, { useState, useEffect } from "react";
import MemberOwedCard from "./MemberOwedCard";
import { Box, CircularProgress, Container, Typography } from "@mui/material";
import apiClient from "@/utils/apiClient";

export default function ExpenseBreakdown({ tripId }: { tripId: number }) {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [data, setData] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchExpenseData = async () => {
      try {
        const response = await apiClient.get(`/trips/${tripId}/expenseShares/debt-summary/`);
        setData(response.data.summary); 
      } catch (err) {
        setError("Failed to fetch expense data. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false); 
      }
    };

    fetchExpenseData();
  }, [tripId]); 

  const handleExpand = (index: number) => {
    if (expandedCard === index) {
      setExpandedCard(null);
    } else {
      setExpandedCard(index);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 4,
        }}
      >
        <Typography
          variant="h2"
          color="error"
          sx={{
            fontWeight: "700",
            fontFamily: "apple-system",
          }}
        >
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mb: 4 }}>
        {data.map((memberSummary, index) => (
          <MemberOwedCard
            key={index}
            memberSummary={memberSummary}
            isExpanded={expandedCard === index}
            onExpand={() => handleExpand(index)}
            isLastCard={index === data.length - 1}
          />
        ))}
      </Box>
    </Container>
  );
}