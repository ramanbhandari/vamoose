"use client"

import React, { useState } from "react";
import MemberOwedCard from "./MemberOwedCard";
import { Box, Container, Paper, Typography } from "@mui/material";
import { MemberSummary } from "@/stores/expense-share-store";
import { useUserStore } from "@/stores/user-store";

interface ExpenseBreakdownProps {
  memberSummaries: MemberSummary[];
  tripId: number;
}

export default function ExpenseBreakdown({ memberSummaries, tripId }: ExpenseBreakdownProps) {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const { user } = useUserStore();

  const currentUserEmail = user?.email;

  // Find the current user's memberSummary
  const currentUserSummary = memberSummaries.find(
    (summary) => summary.debtorEmail === currentUserEmail
  );

  // Filter out the current user's memberSummary from the list
  const otherMemberSummaries = memberSummaries.filter(
    (summary) => summary.debtorEmail !== currentUserEmail
  );

  // Combine the current user's summary
  const sortedMemberSummaries = currentUserSummary
    ? [currentUserSummary, ...otherMemberSummaries]
    : otherMemberSummaries;

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
        {sortedMemberSummaries.length > 0 ? (
          sortedMemberSummaries.map((memberSummary, index) => (
            <MemberOwedCard
              key={index}
              memberSummary={memberSummary}
              isExpanded={expandedCard === index}
              onExpand={() => handleExpand(index)}
              isLastCard={index === sortedMemberSummaries.length - 1}
              tripId={tripId}
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