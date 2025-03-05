"use client";

import { useEffect, useState } from "react";
import { Tabs, Tab, Box, Typography, useTheme, Theme, useMediaQuery, CircularProgress } from "@mui/material";
import styled from "@emotion/styled";
import BudgetDonut from "@/components/trips/Overview/BudgetDonut";
import AllExpenses, { ExpensesProps } from "./AllExpenses"; 
import ExpenseBreakdown from "./ExpenseBreakdown";
import { useExpenseShareStore } from "@/stores/expense-share-store";

const GradientHeader = styled(Box)<{ theme: Theme }>(({}) => ({
    padding: "3rem 2rem",
    color: "white",
    borderRadius: "0 0 80px 80px",
    position: "relative",
    overflow: "hidden",
    "&:before": {
      content: '""',
      position: "absolute",
      background: "rgba(255,255,255,0.1)",
      borderRadius: "50%",
    },
  }));

type TripTabsProps = ExpensesProps;

export default function Expenses({
  tripId,
  tripName,
  budget,
  imageUrl,
  expenses,
  members,
  tripData,
  expenseSummary,
}: TripTabsProps) {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const tabs = ["All Expenses", "Expense Debts"];

  const {memberSummaries, loading, error, fetchExpenseShareData} = useExpenseShareStore();

  useEffect(() => {
      if (tripId) fetchExpenseShareData(tripId);
    }, [tripId, fetchExpenseShareData, budget]);
  
    //Just a loading screen
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
    <>
      <GradientHeader
        theme={theme}
        sx={{
          background: imageUrl
            ? "none"
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          "&::after": imageUrl
            ? {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: `url(${imageUrl}) center/cover no-repeat`,
                filter: "brightness(0.5) blur(4px)",
                zIndex: -2,
              }
            : "none",
        }}
      >
        <Box
          sx={{
            maxWidth: "lg",
            margin: "0 auto",
            padding: "0 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h4" fontWeight="bold">
            {tripName}
          </Typography>
          <BudgetDonut
            budget={budget}
            isEditMode={false}
            expenseSummary={expenseSummary}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: isMobile ? 'center' : 'flex-start',
            width: '100%', 
          }}
        >
            <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons={false}
            // centered={isMobile ? true : false}
            sx={{ 
              mt: 2,
              '& .MuiTab-root': {
                color: 'white', 
                transition: 'all 0.2s ease',
                '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                transform: 'translateY(-2px)', 
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                },
              },
            }}
          >
            {tabs.map((tab) => (
              <Tab key={tab} label={tab} />
            ))}
          </Tabs>
        </Box>
        

      </GradientHeader>

        <Box>
            {currentTab === 0 && (
            <AllExpenses
                tripId={tripId}
                tripName={tripName}
                budget={budget}
                expenses={expenses}
                members={members}
                tripData={tripData}
                expenseSummary={expenseSummary}
            />
            )}

            {currentTab === 1 && (
              <ExpenseBreakdown memberSummaries={memberSummaries} />
            )}
        </Box>      
    </>
  );
}