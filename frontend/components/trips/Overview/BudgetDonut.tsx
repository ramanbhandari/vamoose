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

interface BudgetCategory {
  name: string;
  value: number;
  color: string;
}

interface BudgetDonutProps {
  budget: number;
  isEditMode: boolean;
  tripDetails: {
    budget: string;
    [key: string]: string;
  };
  handleBudgetChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBudgetBlur: () => void;
  setTripDetails: React.Dispatch<
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

export default function BudgetDonut({
  budget,
  isEditMode,
  tripDetails,
  handleBudgetChange,
  handleBudgetBlur,
}: BudgetDonutProps) {
  const budgetCategories: BudgetCategory[] = [
    { name: "Accommodation", value: 40, color: "#6366F1" }, // Indigo
    { name: "Transportation", value: 25, color: "#ff696d" }, // primary
    { name: "Activities", value: 20, color: "#14B8A6" }, // Teal
    { name: "Food", value: 10, color: "#F59E0B" }, // Amber
    { name: "Other", value: 5, color: "#8B5CF6" }, // Purple
  ];

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <>
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
          // zIndex: 2,
          marginTop: isEditMode ? "20px" : "0",
        }}
      >
        <DonutChart
          data={budgetCategories.map((category) => ({
            name: category.name,
            value: budget * (category.value / 100),
            color: isEditMode ? "#808080" : category.color,
          }))}
          paddingAngle={5}
          tooltipDataSource="segment"
          size={isEditMode ? (isMobile ? 200 : 220) : isMobile ? 160 : 180}
          thickness={isMobile ? 25 : 30}
          withTooltip={isEditMode ? false : true}
          tooltipProps={{
            // position: "right",
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
                      {data.name} ({((data.value / budget) * 100).toFixed(1)}%)
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
              value={tripDetails.budget}
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
      {/* If required to show the segments color coded*/}
      {/*<Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
          <MantineGroup>
            {budgetCategories.map(category => (
              <MantineGroup key={category.name}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: category.color,
                  }}
                />
                <Text size='sm'>{category.name}</Text>
              </MantineGroup>
            ))}
          </MantineGroup>
        </Box> */}
    </>
  );
}
