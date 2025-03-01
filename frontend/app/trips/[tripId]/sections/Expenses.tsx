"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Paper,
  Avatar,
  IconButton,
  Theme,
  useTheme,
  Grid,
  Container,
  Chip,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  Toolbar,
  SelectChangeEvent,
  CircularProgress,
} from "@mui/material";

import {
  AttachMoney,
  Restaurant,
  DirectionsCar,
  Hotel,
  Add,
  DeleteOutline,
  FilterList,
  Person,
  SportsKabaddi,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import styled from "@emotion/styled";
import apiClient from "@/utils/apiClient";
import BudgetDonut from "@/components/trips/Overview/BudgetDonut";
import { useTripStore } from "@/stores/trip-store";
import { useNotificationStore } from "@/stores/notification-store";
import ConfirmationDialog from "@/components/ConfirmationDialog";

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  tripId: number;
  paidBy: PaidBy;
}

interface PaidBy {
  email: string;
}

interface MemberDetails {
  email: string;
}

interface Member {
  tripId: number;
  userId: string;
  role: string;
  user: MemberDetails;
}

interface TripData {
  id: number;
  name: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  members: Member[];
  expenses: Expense[];
  expenseSummary: ExpensesSummary;
  stays: Array<[]>;
  imageUrl: string;
}

interface ExpenseBreakdown {
  category: string;
  total: number;
}

interface ExpensesSummary {
  breakdown: ExpenseBreakdown[];
  totalExpenses: number;
}

interface ExpensesProps {
  tripId: number;
  tripName: string;
  budget: number;
  imageUrl?: string;
  expenses: Expense[];
  members: Member[];
  tripData: TripData;
  expenseSummary: ExpensesSummary;
}

interface Filters {
  category: string;
  paidByEmail: string;
}

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

const ExpenseCard = styled(Paper)(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: theme.shadows[6],
  },
}));

const categories = [
  { label: "Food", value: "food", icon: <Restaurant />, color: "#F59E0B" },
  {
    label: "Transportation",
    value: "transportation",
    icon: <DirectionsCar />,
    color: "#ff696d",
  },
  {
    label: "Accommodation",
    value: "accommodation",
    icon: <Hotel />,
    color: "#3B82F6",
  },
  {
    label: "Activities",
    value: "activities",
    icon: <SportsKabaddi />,
    color: "#14B8A6",
  },
  {
    label: "Miscellaneous",
    value: "miscellaneous",
    icon: <AttachMoney />,
    color: "#8B5CF6",
  },
];

export default function Expenses({
  tripId,
  tripName,
  budget,
  imageUrl,
  expenses: initialExpenses,
  members,
  expenseSummary,
}: ExpensesProps) {
  const theme = useTheme();
  // fetch tripData from our store if it exists, else use the props
  const { tripData, addExpense, fetchTripData, deleteExpense, error } =
    useTripStore();
  const expenses = tripData?.expenses || initialExpenses;

  const { setNotification } = useNotificationStore();

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);

  const [filters, setFilters] = useState<Filters>({
    category: "",
    paidByEmail: "",
  });

  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
    paidByEmail: "",
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  // pendingDelete can be either a single expense id (number) or an array of numbers
  const [pendingDelete, setPendingDelete] = useState<number | number[] | null>(
    null
  );

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const categoryMatch = filters.category
        ? expense.category === filters.category
        : true;
      const paidByMatch = filters.paidByEmail
        ? expense.paidBy.email === filters.paidByEmail
        : true;
      return categoryMatch && paidByMatch;
    });
  }, [expenses, filters]);

  const handleFilterChange = (name: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent<string>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Add Expense API Call
  const handleSubmit = async () => {
    if (!formData.amount || !formData.category) {
      setNotification("Please fill in required fields!", "warning");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        amount: Number(formData.amount),
        category: formData.category,
        description: formData.description,
        ...(formData.paidByEmail && { paidByEmail: formData.paidByEmail }),
      };

      const response = await apiClient.post(
        `/trips/${tripId}/expenses`,
        payload
      );
      const newExpense = response.data.expense;
      addExpense(newExpense);

      setNotification("Successfully added Expense!", "success");

      setFormData({
        amount: "",
        category: "",
        description: "",
        paidByEmail: "",
      });

      await fetchTripData(tripId);
    } catch (error) {
      setNotification("Failed to add expense. Please try again.", "error");
      console.error("Error adding expense:", error);
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  const handleClose = () => setOpen(false);

  const handleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelected((prev) =>
      prev.length === filteredExpenses.length
        ? []
        : filteredExpenses.map((e) => e.id)
    );
  };

  const handleRequestSingleDelete = (expenseId: number) => {
    setPendingDelete(expenseId);
    setConfirmOpen(true);
  };

  // Multiple deletion handler wrapped in confirmation
  const handleRequestMultipleDelete = () => {
    if (selected.length === 0) return;
    setPendingDelete(selected);
    setConfirmOpen(true);
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!tripData || pendingDelete === null) return;
    setLoading(true);

    let response;
    try {
      if (Array.isArray(pendingDelete)) {
        response = await apiClient.delete(`/trips/${tripId}/expenses`, {
          data: { expenseIds: pendingDelete },
        });
      } else {
        response = await apiClient.delete(
          `/trips/${tripId}/expenses/${pendingDelete}`
        );
      }

      const storeDelete = deleteExpense(
        response.data.expense
          ? response.data.expense.id
          : response.data.validExpenseIds
      );

      if (storeDelete !== null) {
        setNotification("Expense(s) deleted successfully!", "success");
      } else if (error) {
        setNotification(error, "error");
      }
      // Clear selection if multiple deletion
      if (Array.isArray(pendingDelete)) setSelected([]);
      await fetchTripData(tripId);
    } catch (error) {
      setNotification("Failed to delete expense(s).", "error");
      console.error("Error deleting expense(s):", error);
    } finally {
      setLoading(false);
      setConfirmOpen(false);
      setPendingDelete(null);
    }
  };

  const membersList = Array.from(new Set(members.map((e) => e.user.email))).map(
    (email) => ({
      value: email,
      label: email,
    })
  );

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

  return (
    <Box key={tripId}>
      <ConfirmationDialog
        open={confirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={
          Array.isArray(pendingDelete)
            ? `Are you sure you want to delete ${pendingDelete.length} expenses?`
            : "Are you sure you want to delete this expense?"
        }
      />

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

          "& > *": {
            position: "relative",
            zIndex: 1,
          },
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <Typography variant="h4" fontWeight="bold">
              {tripName}
            </Typography>

            <Grid item xs={12} md={4} order={{ xs: 1, md: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: { xs: "center", md: "flex-end" },
                  mt: { xs: 4, md: 0 },
                  width: "100%",
                  position: "relative",
                  [theme.breakpoints.up("md")]: {
                    justifyContent: "flex-end",
                  },
                }}
              >
                <BudgetDonut
                  budget={budget || 0}
                  isEditMode={false}
                  expenseSummary={expenseSummary}
                />
              </Box>
            </Grid>
          </Box>
        </Container>
      </GradientHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Toolbar
            sx={{
              p: "8px !important",
              bgcolor: "background.paper",
              borderRadius: 2,
              mb: 2,
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexGrow: 1,
              }}
            >
              <FilterList color="action" />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {cat.icon}
                        {cat.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Paid By</InputLabel>
                <Select
                  value={filters.paidByEmail}
                  onChange={(e) =>
                    handleFilterChange("paidByEmail", e.target.value)
                  }
                  label="Paid By"
                >
                  <MenuItem value="">All Users</MenuItem>
                  {membersList.map((user) => (
                    <MenuItem key={user.value} value={user.value}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Person fontSize="small" />
                        {user.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpen(true)}
              sx={{ ml: "auto" }}
            >
              Add Expense
            </Button>
          </Toolbar>

          {selected.length > 0 && (
            <Paper
              sx={{
                p: 1,
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                bgcolor: "action.selected",
              }}
            >
              <Checkbox
                checked={selected.length === filteredExpenses.length}
                indeterminate={
                  selected.length > 0 &&
                  selected.length < filteredExpenses.length
                }
                onChange={handleSelectAll}
              />
              <Typography variant="body2" color="text.secondary">
                {selected.length} selected
              </Typography>
              <IconButton color="error" onClick={handleRequestMultipleDelete}>
                <DeleteOutline />
              </IconButton>
            </Paper>
          )}

          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((expense) => (
              <motion.div key={expense.id} layout>
                <ExpenseCard theme={theme} sx={{ my: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Checkbox
                      checked={selected.includes(expense.id)}
                      onChange={() => handleSelect(expense.id)}
                    />
                    <Avatar
                      sx={{
                        bgcolor: categories.find(
                          (c) => c.value === expense.category
                        )?.color,
                        color: "white",
                      }}
                    >
                      {
                        categories.find((c) => c.value === expense.category)
                          ?.icon
                      }
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
                          ${expense.amount.toFixed(2)}
                        </Typography>
                        <Chip
                          label={expense.category}
                          size="small"
                          sx={{
                            bgcolor:
                              categories.find(
                                (c) => c.value === expense.category
                              )?.color + "22",
                            color: categories.find(
                              (c) => c.value === expense.category
                            )?.color,
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {expense.description}
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
                          Paid by {expense.paidBy.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <IconButton
                    color="error"
                    onClick={() => handleRequestSingleDelete(expense.id)}
                    disabled={selected.length > 0}
                  >
                    <DeleteOutline />
                  </IconButton>
                </ExpenseCard>
              </motion.div>
            ))
          ) : (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary">
                No expenses found
              </Typography>
            </Paper>
          )}
        </Box>
      </Container>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Add New Expense</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Amount"
                name="amount"
                type="number"
                fullWidth
                required
                variant="outlined"
                onChange={handleChange}
                InputProps={{ startAdornment: "$" }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {cat.icon}
                        {cat.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Paid By</InputLabel>
                <Select
                  label="Paid By"
                  name="paidByEmail"
                  value={formData.paidByEmail}
                  onChange={handleChange}
                >
                  {membersList.map((member) => (
                    <MenuItem key={member.value} value={member.value}>
                      <Person fontSize="small" sx={{ mr: 1 }} />
                      {member.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Add Expense
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
