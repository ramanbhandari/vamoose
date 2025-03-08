"use client";

import React, { useState } from "react";
import MemberOwedCard from "./MemberOwedCard";
import { Box, Container, Paper, Typography, useTheme } from "@mui/material";
import { MemberSummary } from "@/stores/expense-share-store";
import { useUserStore } from "@/stores/user-store";
import { CreditCardOff } from "@mui/icons-material";

interface ExpenseBreakdownProps {
  memberSummaries: MemberSummary[];
  tripId: number;
}

export default function ExpenseBreakdown({
  memberSummaries,
  tripId,
}: ExpenseBreakdownProps) {
  const theme = useTheme();
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

  const filterMembersWithDebt = sortedMemberSummaries.filter(
    (summary) => summary.totalOwed > 0
  );

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
        {filterMembersWithDebt.length > 0 ? (
          filterMembersWithDebt.map((memberSummary, index) => (
            <MemberOwedCard
              key={index}
              memberSummary={memberSummary}
              isExpanded={expandedCard === index}
              onExpand={() => handleExpand(index)}
              isLastCard={index === filterMembersWithDebt.length - 1}
              tripId={tripId}
            />
          ))
        ) : (
          <Paper
            sx={{
              p: 8,
              textAlign: "center",
              background: `linear-gradient(45deg, ${theme.palette.background.default} 30%, ${theme.palette.action.hover} 90%)`,
              borderRadius: 6,
            }}
          >
            <CreditCardOff
              sx={{
                fontSize: 80,
                color: theme.palette.text.secondary,
                mb: 2,
              }}
            />
            <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
              {"No expense debt found!"}
            </Typography>

            <Typography variant="body1" color="text.secondary">
              Everything is settled or no expenses incurred yet!
            </Typography>
          </Paper>
          // <Paper
          //   sx={{
          //     p: 4,
          //     textAlign: "center",
          //     background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
          //   }}
          // >
          //   <Typography variant="h6" color="text.secondary">
          //     No expense debts found
          //   </Typography>
          // </Paper>
        )}
      </Box>
    </Container>
  );
}
