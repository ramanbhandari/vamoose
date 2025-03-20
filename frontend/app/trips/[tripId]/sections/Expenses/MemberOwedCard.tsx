"use client";

import React, { useState, useEffect, useRef, RefObject } from "react";
import {
  Card,
  CardContent,
  Box,
  Avatar,
  Typography,
  IconButton,
  Collapse,
  List,
  ListItem,
  Chip,
  Divider,
  Pagination,
  IconButtonProps,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Modal,
  Tabs,
  Tab,
  Tooltip,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { CheckCircle, ExpandMore } from "@mui/icons-material";
import {
  MemberSummary,
  ExpenseSummaryItem,
  useExpenseShareStore,
} from "@/stores/expense-share-store";
import { useUserStore } from "@/stores/user-store";
import ConfirmationDialog from "@/components/ConfirmationDialog"; // Import the ConfirmationDialog component
import { getUserInfo } from "@/utils/userHelper";

// Category colors
const categories = [
  { value: "food", color: "#F59E0B" },
  { value: "transportation", color: "#ff696d" },
  { value: "accommodation", color: "#3B82F6" },
  { value: "activities", color: "#14B8A6" },
  { value: "miscellaneous", color: "#8B5CF6" },
];

// Styled component for the expand icon
interface ExpandMoreButtonProps extends IconButtonProps {
  expanded?: boolean;
}

interface MemberOwedCardProps {
  memberSummary: MemberSummary;
  isExpanded: boolean;
  onExpand: () => void;
  isLastCard: boolean;
  tripId: number;
}

const ExpandMoreButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "expanded",
})<ExpandMoreButtonProps>(({ theme, expanded }) => ({
  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
  transition: theme.transitions.create("transform", {
    duration: theme.transitions.duration.shortest,
  }),
}));

export default function MemberOwedCard({
  memberSummary,
  isExpanded,
  onExpand,
  isLastCard,
  tripId,
}: MemberOwedCardProps) {
  const theme = useTheme();
  const [filterEmail, setFilterEmail] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCreditor, setSelectedCreditor] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // Track active tab (0: Outstanding, 1: Settled)
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false);
  const [creditorToSettle, setCreditorToSettle] = useState<string | null>(null);
  const [transactionToSettle, setTransactionToSettle] =
    useState<ExpenseSummaryItem | null>(null); // Track the transaction to settle
  const itemsPerPage = 3; // Number of items per page
  const cardRef = useRef<HTMLDivElement>(null);
  const { user } = useUserStore();
  const { settleExpenses } = useExpenseShareStore();

  const userInfo = getUserInfo(user);
  const currUserEmail = userInfo?.email;

  const canSettle = (creditor: string) => {
    return (
      memberSummary.outstanding.length > 0 &&
      (memberSummary.outstanding[0].debtorId === user?.id ||
        creditor === user?.email)
    );
  };

  // Filter outstanding amounts by creditor email
  const filteredOutstanding = memberSummary.outstanding.filter((item) =>
    item.creditorEmail.toLowerCase().includes(filterEmail.toLowerCase())
  );

  // Filter settled amounts by creditor email
  const filteredSettled = memberSummary.settled.filter((item) =>
    item.creditorEmail.toLowerCase().includes(filterEmail.toLowerCase())
  );

  // Group outstanding amounts by creditor
  const groupedOutstanding = filteredOutstanding.reduce(
    (acc, item) => {
      if (!acc[item.creditorEmail]) {
        acc[item.creditorEmail] = { total: 0, items: [] };
      }
      acc[item.creditorEmail].total += item.amount;
      acc[item.creditorEmail].items.push(item);
      return acc;
    },
    {} as Record<string, { total: number; items: ExpenseSummaryItem[] }>
  );

  // Group settled amounts by creditor
  const groupedSettled = filteredSettled.reduce(
    (acc, item) => {
      if (!acc[item.creditorEmail]) {
        acc[item.creditorEmail] = { total: 0, items: [] };
      }
      acc[item.creditorEmail].total += item.amount;
      acc[item.creditorEmail].items.push(item);
      return acc;
    },
    {} as Record<string, { total: number; items: ExpenseSummaryItem[] }>
  );

  // Get unique creditors for the Select dropdown
  const creditors = Array.from(
    new Set(
      [...memberSummary.outstanding, ...memberSummary.settled].map(
        (item) => item.creditorEmail
      )
    )
  );

  // Pagination logic
  const paginatedCreditors = Object.keys(
    activeTab === 0 ? groupedOutstanding : groupedSettled
  ).slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(
    Object.keys(activeTab === 0 ? groupedOutstanding : groupedSettled).length /
      itemsPerPage
  );

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };

  const scrollToCard = (ref: RefObject<HTMLElement | null>) => {
    if (ref.current) {
      const cardTop = ref.current.getBoundingClientRect().top;
      const scrollPosition = cardTop;
      window.scrollTo({ top: scrollPosition, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (isExpanded && cardRef.current) {
      scrollToCard(cardRef);
    }
  }, [isExpanded]);

  // Handle opening/closing the modal
  const handleOpenModal = (creditor: string) => {
    setSelectedCreditor(creditor);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCreditor(null);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(1);
  };

  // Check if there are any transactions for the active tab
  const hasTransactions =
    activeTab === 0
      ? memberSummary.outstanding.length > 0
      : memberSummary.settled.length > 0;

  // Handle settling expenses
  const handleSettleExpenses = async (
    creditor: string,
    transaction?: ExpenseSummaryItem
  ) => {
    if (!canSettle(creditor)) {
      return;
    }
    try {
      const expensesToSettle = transaction
        ? [
            {
              expenseId: transaction.expenseShareId,
              debtorUserId: transaction.debtorId,
            },
          ]
        : groupedOutstanding[creditor].items.map((item) => ({
            expenseId: item.expenseShareId,
            debtorUserId: item.debtorId,
          }));

      await settleExpenses(tripId, memberSummary.debtorEmail, expensesToSettle);

      // Close the modal if settling a single transaction
      if (transaction) {
        handleCloseModal();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Handle opening the confirmation dialog
  const handleOpenConfirmationDialog = (creditor: string) => {
    setCreditorToSettle(creditor);
    setIsConfirmationDialogOpen(true);
  };

  // Handle closing the confirmation dialog
  const handleCloseConfirmationDialog = () => {
    setIsConfirmationDialogOpen(false);
    setCreditorToSettle(null);
  };

  // Handle confirming the settlement
  const handleConfirmSettlement = () => {
    if (creditorToSettle) {
      handleSettleExpenses(creditorToSettle);
    }
    handleCloseConfirmationDialog();
  };

  // Handle settling a single transaction
  const handleSettleSingleTransaction = (transaction: ExpenseSummaryItem) => {
    setTransactionToSettle(transaction);
    setIsConfirmationDialogOpen(true);
  };

  // Handle confirming the settlement of a single transaction
  const handleConfirmSingleSettlement = () => {
    if (transactionToSettle && selectedCreditor) {
      handleSettleExpenses(selectedCreditor, transactionToSettle);
    }
    setIsConfirmationDialogOpen(false);
    setTransactionToSettle(null);
  };

  return (
    <>
      <Card
        sx={{
          width: "100%",
          margin: "0 auto",
          boxShadow: theme.shadows[3],
          mb: isLastCard ? 2 : 0,
          borderRadius: 2,
          background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
        }}
      >
        <CardContent
          ref={cardRef}
          onClick={onExpand}
          sx={{
            cursor: "pointer",
            boxShadow: theme.shadows[3],
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Member Avatar */}
            <Avatar sx={{ bgcolor: "primary.main", color: "white" }}>
              {memberSummary.debtorEmail[0].toUpperCase()}
            </Avatar>

            {/* Member Details */}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                {memberSummary.debtorEmail === currUserEmail
                  ? "Me"
                  : memberSummary.debtorEmail}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Still Owes: ${memberSummary.totalOwed.toFixed(2)}
              </Typography>
            </Box>

            {/* Expand Button */}
            <ExpandMoreButton
              expanded={isExpanded}
              onClick={onExpand}
              aria-expanded={isExpanded}
              aria-label="show more"
            >
              <ExpandMore />
            </ExpandMoreButton>
          </Box>
        </CardContent>

        {/* Collapsible Section */}
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <CardContent sx={{ pt: 0, mt: 1 }}>
            {/* Grid container for Tabs and Filter */}
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} sm={8}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons={false}
                >
                  <Tab label="Outstanding" />
                  <Tab label="Settled" />
                </Tabs>
              </Grid>
              <Grid
                item
                xs={12}
                sm={4}
                sx={{
                  display: "flex",
                  justifyContent: { xs: "start", sm: "end" },
                  pr: 3,
                }}
              >
                {hasTransactions && (
                  <FormControl fullWidth size="small" sx={{ maxWidth: 200 }}>
                    <InputLabel id="filter-by-creditor-label">
                      Filter by Creditor
                    </InputLabel>
                    <Select
                      labelId="filter-by-creditor-label"
                      value={filterEmail}
                      label="Filter by Creditor"
                      onChange={(e) => {
                        setFilterEmail(e.target.value as string);
                        setPage(1);
                      }}
                    >
                      <MenuItem value="">All Creditors</MenuItem>
                      {creditors.map((creditor) => (
                        <MenuItem key={creditor} value={creditor}>
                          {creditor}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Grid>
            </Grid>

            {/* Show message if no transactions */}
            {!hasTransactions && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "100px",
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  No {activeTab === 0 ? "outstanding" : "settled"} transactions.
                </Typography>
              </Box>
            )}

            {/* List of transactions */}
            {hasTransactions && paginatedCreditors.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "100px",
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  No {activeTab === 0 ? "outstanding" : "settled"} amounts match
                  the filter.
                </Typography>
              </Box>
            ) : (
              hasTransactions && (
                <>
                  <List>
                    {paginatedCreditors.map((creditor, index) => {
                      const { total } =
                        activeTab === 0
                          ? groupedOutstanding[creditor]
                          : groupedSettled[creditor];
                      return (
                        <React.Fragment key={creditor}>
                          {/* Creditor Summary */}
                          <ListItem>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item>
                                <Avatar
                                  sx={{
                                    bgcolor: "secondary.main",
                                    color: "white",
                                  }}
                                >
                                  {creditor[0].toUpperCase()}
                                </Avatar>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body1" fontWeight="bold">
                                  {creditor}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Total Amount{" "}
                                  {activeTab === 0 ? "Owed" : "Settled"}: $
                                  {total.toFixed(2)}
                                </Typography>
                              </Grid>
                              <Grid
                                item
                                xs={12}
                                sm={5}
                                sx={{
                                  display: "flex",
                                  justifyContent: { xs: "start", sm: "end" },
                                  gap: 1,
                                }}
                              >
                                {activeTab === 0 && canSettle(creditor) && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() =>
                                      handleOpenConfirmationDialog(creditor)
                                    }
                                  >
                                    Settle
                                  </Button>
                                )}
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleOpenModal(creditor)}
                                >
                                  Show Details
                                </Button>
                              </Grid>
                            </Grid>
                          </ListItem>

                          {/* Divider between creditors */}
                          {index < paginatedCreditors.length - 1 && (
                            <Divider sx={{ my: 2 }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </List>

                  {/* Pagination */}
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mt: 2 }}
                  >
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                    />
                  </Box>
                </>
              )
            )}
          </CardContent>
        </Collapse>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={isConfirmationDialogOpen}
        onClose={handleCloseConfirmationDialog}
        onConfirm={
          transactionToSettle
            ? handleConfirmSingleSettlement
            : handleConfirmSettlement
        }
        title="Confirm Settlement"
        message={
          transactionToSettle
            ? "Are you sure you want to settle this transaction?"
            : "Are you sure you want to settle these expenses?"
        }
      />

      {/* Modal for Transaction Details */}
      <Modal open={isModalOpen} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            maxWidth: 600,
            maxHeight: "70vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Modal Header */}
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {activeTab === 0 ? "Outstanding" : "Settled"} Transactions for{" "}
            {selectedCreditor}
          </Typography>

          {/* Scrollable List */}
          <Box sx={{ overflowY: "auto", flexGrow: 1, mb: 2 }}>
            <List>
              {selectedCreditor &&
                (activeTab === 0
                  ? groupedOutstanding[selectedCreditor]
                  : groupedSettled[selectedCreditor]
                ).items.map((item, index) => {
                  const category = categories.find(
                    (cat) => cat.value === item.category
                  );
                  return (
                    <React.Fragment key={index}>
                      <ListItem>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={8}>
                            <Typography variant="body1">
                              ${item.amount.toFixed(2)} {item.description}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                label={item.category}
                                size="small"
                                sx={{
                                  bgcolor: category
                                    ? `${category.color}22`
                                    : "#f5f5f5",
                                  color: category
                                    ? category.color
                                    : "text.primary",
                                }}
                              />
                            </Box>
                          </Grid>
                          <Grid
                            item
                            xs={4}
                            sx={{ display: "flex", justifyContent: "flex-end" }}
                          >
                            {activeTab === 0 &&
                              canSettle(selectedCreditor!) && (
                                <Tooltip title="Settle Expense" placement="top">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() =>
                                      handleSettleSingleTransaction(item)
                                    }
                                    sx={{ ml: 1 }}
                                  >
                                    <CheckCircle fontSize="medium" />
                                  </IconButton>
                                </Tooltip>
                              )}
                          </Grid>
                        </Grid>
                      </ListItem>
                      {index <
                        (activeTab === 0
                          ? groupedOutstanding[selectedCreditor]
                          : groupedSettled[selectedCreditor]
                        ).items.length -
                          1 && <Divider />}
                    </React.Fragment>
                  );
                })}
            </List>
          </Box>

          {/* Close Button */}
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button variant="contained" onClick={handleCloseModal}>
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
