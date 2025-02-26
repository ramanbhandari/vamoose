import { Box, Typography, TextField, InputAdornment } from "@mui/material";
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

export default function BudgetDonut ({
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

  return (
    <>
      <Box
        sx={{
          position: "relative",
          backgroundColor: "rgba(0, 0, 0, 0.45)",
          backdropFilter: "blur(10px)",
          borderRadius: "100%",
          ml: "6rem",
          transition: "transform 0.2s ease-in-out",
          "&:hover": {
            transform: "scale(1.05)",
          },
        }}
      >
        <DonutChart
          data={budgetCategories.map(category => ({
            name: category.name,
            value: budget * (category.value / 100),
            color: category.color,
          }))}
          tooltipDataSource='segment'
          size={200}
          thickness={50}
          tooltipProps={{
            position: { x: 50, y: 205 },
            content: ({ payload }) => {
              if (payload && payload[0]) {
                const data = payload[0].payload;
                return (
                  <MantineBox
                    p='sm'
                    style={{
                      zIndex: 1000,
                      backgroundColor: data.color,
                      color: "#fff",
                      borderRadius: "15px",
                      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                      "& > *": {
                        color: `${
                          data.color === "#FFEEAD" || data.color === "#96CEB4"
                            ? "#333"
                            : "#fff"
                        } !important`,
                      },
                    }}
                  >
                    <Text size='sm' fw={500}>
                      {data.name}
                    </Text>
                    <Text size='xs'>${data.value.toLocaleString()}</Text>
                    <Text size='xs'>
                      {((data.value / budget) * 100).toFixed(1)}%
                    </Text>
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
            transform: `translate(-50%, ${isEditMode ? '-350%' : '-50%'})`,
            textAlign: "center",
            width: "60%",
            transition: "transform 0.3s ease-in-out",
          }}
        >
          {isEditMode ? (
            <TextField
              variant='standard'
              type='text'
              value={tripDetails.budget}
              onChange={handleBudgetChange}
              onBlur={handleBudgetBlur}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Typography variant='h6' sx={{ color: "white" }}>
                        $
                      </Typography>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                width: "100%",
                "& .MuiInputBase-input": {
                  color: "white",
                  textAlign: "left",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                },
              }}
            />
          ) : (
            <>
              <Typography
                variant='h4'
                fontWeight={700}
                color='white'
                sx={{ fontSize: "1.5rem" }}
              >
                ${budget.toLocaleString() || "0"}
              </Typography>
              <Typography
                variant='body2'
                color='white'
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
