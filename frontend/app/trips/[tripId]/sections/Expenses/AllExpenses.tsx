"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
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
import { useTripStore } from "@/stores/trip-store";
import { useNotificationStore } from "@/stores/notification-store";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { TripData, Expense, Member, ExpensesSummary } from "@/types";
import { FloatingDialog } from "../Polls/styled";

export interface ExpensesProps {
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

const ExpenseCard = styled(Paper)<{ theme?: Theme }>(({ theme }) => ({
  padding: theme?.spacing(3),
  borderRadius: theme?.shape.borderRadius * 2,
  boxShadow: theme?.shadows[1],
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.1s, box-shadow 0.1s",
  background: `linear-gradient(145deg, ${theme?.palette.background.paper} 0%, ${theme?.palette.action.hover} 100%)`,
  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow: theme?.shadows[8],
  },
  [theme!.breakpoints.up("sm")]: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
}));

export const categories = [
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
  expenses: initialExpenses,
  members,
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

  const membersList = Array.from(new Set(members.map((e) => e.user))).map(
    (user) => ({
      value: user.email,
      label: `${user.fullName} (${user.email})`,
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

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Toolbar
            sx={{
              p: "8px !important",
              borderRadius: 2,
              mb: 2,
              gap: 2,
              flexWrap: "wrap",
              boxShadow: theme.shadows[1],
              background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
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
                background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
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
                <ExpenseCard
                  theme={theme}
                  sx={{
                    my: 1.5,
                  }}
                >
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
                            maxWidth: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
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
                          Paid by{" "}
                          {expense.paidBy.fullName
                            ? expense.paidBy.fullName
                            : expense.paidBy.email}
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
            <Paper
              sx={{
                p: 8,
                textAlign: "center",
                background: `linear-gradient(45deg, ${theme.palette.background.default} 30%, ${theme.palette.action.hover} 90%)`,
                borderRadius: 6,
              }}
            >
              <AttachMoney
                sx={{
                  fontSize: 80,
                  color: theme.palette.text.secondary,
                  mb: 2,
                }}
              />
              <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                {"No expenses found!"}
              </Typography>

              <Typography variant="body1" color="text.secondary">
                Start spending...
              </Typography>
            </Paper>
          )}
        </Box>
      </Container>

      <FloatingDialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle
          sx={{
            backgroundColor: theme.palette.background.default,
          }}
        >
          Add New Expense
        </DialogTitle>
        <DialogContent
          sx={{
            backgroundColor: theme.palette.background.default,
          }}
        >
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
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
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
        <DialogActions
          sx={{
            p: 3,
            pt: 2,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Button
            onClick={() => setOpen(false)}
            color="inherit"
            sx={{ mr: "auto" }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit}>
            Add Expense
          </Button>
        </DialogActions>
      </FloatingDialog>
    </Box>
  );
}
