/**
 * @file BudgetDonut.tsx
 * @description A React component that renders a donut chart displaying the user's budget vs expenses.
 * It provides functionality for editing the budget, displaying breakdowns of expenses by category,
 * and showing alerts if the budget is near or exceeded. The chart is interactive and displays tooltips
 * with detailed information when hovered.
 * 
 * Features:
 * - Displays total budget and expenses with visual representation using a donut chart.
 * - Provides a real-time update of remaining and spent budget.
 * - Offers editing capabilities for budget input in the edit mode.
 * - Alerts the user when the budget is nearing or exceeded with animations.
 * 
 */


import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DonutChart } from "@mantine/charts";
import { Text, Box as MantineBox } from "@mantine/core";
import { keyframes } from "@mui/system";
import { ErrorOutline, WarningAmber } from "@mui/icons-material";

interface BudgetCategory {
  name: string;
  value: number;
  color: string;
}

interface ExpenseBreakdown {
  category: string;
  total: number;
}

interface ExpensesSummary {
  breakdown: ExpenseBreakdown[];
  totalExpenses: number;
}

interface BudgetDonutProps {
  budget: number;
  isEditMode: boolean;
  expenseSummary: ExpensesSummary;
  tripDetails?: {
    budget: string;
    [key: string]: string;
  };
  handleBudgetChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBudgetBlur?: () => void;
  setTripDetails?: React.Dispatch<
    React.SetStateAction<{
      name: string;
      destination: string;
      startDate: string;
      endDate: string;
      budget: string;
      currency: string;
      description: string;
    }>
  >;
}

const getCategoryColor = (category: string) => {
  const categoryColors: Record<string, string> = {
    accommodation: "#3B82F6",
    transportation: "#ff696d",
    activities: "#14B8A6",
    food: "#F59E0B",
    miscellaneous: "#8B5CF6",
  };

  return categoryColors[category] || "#9CA3AF";
};

const subtlePulse = keyframes`
  0% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.8; transform: scale(1); }
`;

const borderGlow = keyframes`
  0% { box-shadow: 0 0 10px rgba(255, 165, 0, 0.3); }
  50% { box-shadow: 0 0 20px rgba(255, 165, 0, 0.6); }
  100% { box-shadow: 0 0 10px rgba(255, 165, 0, 0.3); }
`;

const overBudgetGlow = keyframes`
  0% { box-shadow: 0 0 10px rgba(255, 59, 59, 0.3); }
  50% { box-shadow: 0 0 20px rgba(255, 59, 59, 0.6); }
  100% { box-shadow: 0 0 10px rgba(255, 59, 59, 0.3); }
`;

export default function BudgetDonut({
  budget,
  isEditMode,
  expenseSummary,
  tripDetails,
  handleBudgetChange,
  handleBudgetBlur,
}: BudgetDonutProps) {
  const usedBudget = expenseSummary?.totalExpenses || 0;
  const unusedBudget = budget - usedBudget > 0 ? budget - usedBudget : 0;

  const budgetCategories: BudgetCategory[] = [
    { name: "Unused Budget", value: unusedBudget, color: "#10B981" },
    ...expenseSummary.breakdown.map((item) => ({
      name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
      value: item.total,
      color: getCategoryColor(item.category),
    })),
  ];

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const budgetRatio = budget ? usedBudget / budget : 0;
  const isNearLimit = budgetRatio >= 0.8 && usedBudget <= budget;
  const isOverBudget = usedBudget > budget;
  const allBudgetUsed = usedBudget == budget;

  const alertMessage =
    isNearLimit && !isOverBudget
      ? allBudgetUsed
        ? `All budget used, $${(budget - usedBudget).toLocaleString()} remaining`
        : `Nearing budget, $${(budget - usedBudget).toLocaleString()} remaining`
      : `You've exceeded your budget by $${(usedBudget - budget).toLocaleString()}!`;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: isMobile ? 165 : 175,
          height: isMobile ? 165 : 175,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))",
          marginTop: isEditMode ? "20px" : "0",
          animation: `${!isEditMode && isOverBudget ? overBudgetGlow : !isEditMode && isNearLimit ? borderGlow : ""} 2s infinite`,
          "&:before": {
            content: '""',
            position: "absolute",
            inset: -4,
            borderRadius: "50%",
            border: `2px solid ${isOverBudget ? "#FF3B3B" : "#FFA500"}`,
            opacity: !isEditMode && (isNearLimit || isOverBudget) ? 0.4 : 0,
            animation:
              !isEditMode && (isNearLimit || isOverBudget)
                ? `${subtlePulse} 2s infinite`
                : "none",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: 140,
            height: 140,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))",
            marginTop: isEditMode ? "20px" : "0",
          }}
        >
          <DonutChart
            data={budgetCategories.map((category) => ({
              name: category.name,
              value: category.value,
              color: isEditMode ? "#808080" : category.color,
            }))}
            paddingAngle={5}
            tooltipDataSource="segment"
            size={isEditMode ? (isMobile ? 200 : 220) : isMobile ? 160 : 180}
            thickness={isMobile ? 25 : 30}
            withTooltip={isEditMode ? false : true}
            tooltipProps={{
              content: ({ payload }) => {
                if (payload && payload[0]) {
                  const data = payload[0].payload;
                  return (
                    <MantineBox
                      p="sm"
                      style={{
                        zIndex: 1000,
                        backgroundColor: data.color,
                        color: "#fff",
                        borderRadius: "15px",
                        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <Text size="sm" fw={500}>
                        {data.name} ({((data.value / budget) * 100).toFixed(1)}
                        %)
                      </Text>
                      <Text size="sm">${data.value.toLocaleString()}</Text>
                    </MantineBox>
                  );
                }
                return null;
              },
            }}
          />

          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%)`,
              textAlign: "center",
              width: isMobile ? "80%" : "100%",
              transition: "transform 0.3s ease-in-out",
              zIndex: isEditMode ? 0 : -2,
            }}
          >
            {isEditMode ? (
              <TextField
                variant="standard"
                type="text"
                value={tripDetails?.budget}
                onChange={handleBudgetChange}
                onBlur={handleBudgetBlur}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography
                          variant={isMobile ? "h5" : "h4"}
                          sx={{ color: "white" }}
                        >
                          $
                        </Typography>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  width: "100%",
                  color: "white",
                  "& .MuiInputBase-input": {
                    color: "white",
                    textAlign: "center",
                    fontSize: isMobile ? "1.7rem" : "2.0rem",
                    fontWeight: 700,
                  },
                  "& .MuiInput-underline:before": {
                    borderBottom: "1px solid white !important",
                  },
                  "& .MuiInput-underline:hover:before": {
                    borderBottom: "2px solid white !important",
                  },
                  "& .MuiInput-underline:after": {
                    borderBottom: "2px solid white",
                  },
                }}
              />
            ) : (
              <>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color="white"
                  sx={{ fontSize: "1.5rem" }}
                >
                  ${budget.toLocaleString() || "0"}
                </Typography>
                <Typography
                  variant="body2"
                  color="white"
                  sx={{ fontSize: "0.8rem" }}
                >
                  Total Budget
                </Typography>
              </>
            )}
          </Box>
        </Box>
      </Box>

      {(isNearLimit || isOverBudget) && !isEditMode && (
        <Box
          sx={{
            mt: 2,
            px: 1,
            py: 1,
            borderRadius: 2,
            border: `1px solid ${isOverBudget ? "#FF3B3B" : "#FFA500"}`,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          {isOverBudget ? (
            <ErrorOutline sx={{ color: "#FF3B3B", fontSize: "1.2rem" }} />
          ) : (
            <WarningAmber sx={{ color: "#FFA500", fontSize: "1.2rem" }} />
          )}
          <Typography
            variant="caption"
            sx={{ color: "white", fontWeight: 600 }}
          >
            {alertMessage}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
