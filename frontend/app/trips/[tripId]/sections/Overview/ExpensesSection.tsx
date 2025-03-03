"use client";

import { Box, Typography, Button, useTheme } from "@mui/material";
import { Calculate } from "@mui/icons-material";
import { motion } from "framer-motion";
import { SectionContainer } from "./styled";
import { Expense } from "@/types";

interface ExpensesSectionProps {
  expenses: Expense[];
  onSectionChange: (sectionId: string) => void;
}

export default function ExpenseSection({
  expenses,
  onSectionChange,
}: ExpensesSectionProps) {
  const theme = useTheme();
  return (
    <SectionContainer theme={theme}>
      <Box mb={3}>
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
          {expenses.length} expenses
        </Typography>
      </Box>

      <motion.div whileHover={{ scale: 1.05 }}>
        <Button
          fullWidth
          variant="contained"
          color="secondary"
          sx={{
            borderRadius: 3,
            py: 1.5,
            fontSize: "1.1rem",
          }}
          onClick={() => onSectionChange("expenses")}
        >
          Manage Expenses
        </Button>
      </motion.div>
    </SectionContainer>
  );
}
