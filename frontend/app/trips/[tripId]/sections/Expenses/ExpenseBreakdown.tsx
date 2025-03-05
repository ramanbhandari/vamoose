"use client"

import React, { useState } from "react";
import MemberOwedCard from "./MemberOwedCard";
import { Box, Container, Paper, Typography } from "@mui/material";
import { MemberSummary } from "@/stores/expense-share-store";

interface ExpenseBreakdownProps {
  memberSummaries: MemberSummary[];
}

export default function ExpenseBreakdown({ memberSummaries }: ExpenseBreakdownProps) {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const handleExpand = (index: number) => {
    if (expandedCard === index) {
      setExpandedCard(null);
    } else {
      setExpandedCard(index);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mb: 4 }}>
      {memberSummaries.length > 0 ? (
        memberSummaries.map((memberSummary, index) => (
          <MemberOwedCard
            key={index}
            memberSummary={memberSummary}
            isExpanded={expandedCard === index}
            onExpand={() => handleExpand(index)}
            isLastCard={index === memberSummaries.length - 1}
          />
        ))
        ) : (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary">
            No expense debts found
          </Typography>
        </Paper>
      )}
      </Box>
    </Container>
  );
}