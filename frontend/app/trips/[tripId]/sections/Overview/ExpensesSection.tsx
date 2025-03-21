"use client";

import {
  Box,
  Typography,
  Button,
  useTheme,
  Paper,
  Avatar,
  Chip,
  useMediaQuery,
} from "@mui/material";
import { Calculate, Person } from "@mui/icons-material";
import { motion } from "framer-motion";
import { SectionContainer } from "./styled";
import { Expense, PaidBy } from "@/types";
import { categories } from "../Expenses/AllExpenses";
import Masonry from "@mui/lab/Masonry";

interface ExpenseCardProps {
  id: number;
  description: string;
  category: string;
  amount: number;
  paidBy: PaidBy;
  onClick?: () => void;
}

function ExpensePreviewCard({
  description,
  category,
  amount,
  paidBy,
  onClick,
}: ExpenseCardProps) {
  return (
    <motion.div whileHover={{ y: -5 }}>
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          transition: "all 0.3s ease",
          cursor: "pointer",
          backgroundColor: "background.default",
          "&:hover": {
            boxShadow: 6,
          },
        }}
        onClick={onClick}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: categories.find((c) => c.value === category)?.color,
              color: "white",
            }}
          >
            {categories.find((c) => c.value === category)?.icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 0.5,
              }}
            >
              <Typography variant="h6" fontWeight="600">
                ${amount.toFixed(2)}
              </Typography>
              <Chip
                label={category}
                size="small"
                sx={{
                  bgcolor:
                    categories.find((c) => c.value === category)?.color + "22",
                  color: categories.find((c) => c.value === category)?.color,
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 0.5,
              }}
            >
              <Person fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Paid by {paidBy.fullName ? paidBy.fullName : paidBy.email}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
}

interface ExpensesSectionProps {
  expenses: Expense[];
  onSectionChange: (sectionId: string) => void;
}

export default function ExpenseSection({
  expenses,
  onSectionChange,
}: ExpensesSectionProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const MAX_EXPENSES = 4;
  return (
    <SectionContainer theme={theme}>
      <Box
        mb={3}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Calculate fontSize="large" />
            Expenses
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {expenses.length} expense(s)
          </Typography>
        </Box>

        {!isMobile && (
          <Box>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  fontSize: "1.1rem",
                }}
                onClick={() => onSectionChange("expenses")}
              >
                View All Expenses
              </Button>
            </motion.div>
          </Box>
        )}
      </Box>

      <Masonry columns={isMobile ? 1 : 2} spacing={2}>
        {expenses.slice(0, MAX_EXPENSES).map((expense) => (
          <ExpensePreviewCard
            key={expense.id}
            id={expense.id}
            description={expense.description}
            category={expense.category}
            amount={expense.amount}
            paidBy={expense.paidBy}
            onClick={() => onSectionChange("expenses")}
          />
        ))}
      </Masonry>
      {isMobile && (
        <Box
          sx={{
            mt: 3,
            mx: "auto",
          }}
        >
          <motion.div whileHover={{ scale: 1.05 }}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              sx={{
                borderRadius: 3,
                py: 1.5,
                fontSize: "1.1rem",
              }}
              onClick={() => onSectionChange("expenses")}
            >
              {expenses.length > 0 ? "View All Expenses" : "Go to Expenses"}
            </Button>
          </motion.div>
        </Box>
      )}
    </SectionContainer>
  );
}
