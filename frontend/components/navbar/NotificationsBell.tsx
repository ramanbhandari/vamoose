"use client";
import React, { useState } from "react";
import {
  IconButton,
  Badge,
  Menu,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Tooltip,
  alpha,
  Avatar,
  useTheme,
} from "@mui/material";

import { formatDateTime } from "@/utils/dateFormatter";
import { Circle, ClearAll, Notifications } from "@mui/icons-material";

interface UserNotification {
  id: number;
  userId: string;
  tripId: number | null;
  type: string;
  relatedId: number | null;
  channel: string | null;
  title: string;
  message: string;
  data: JSON | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

const initialFakeNotifications: UserNotification[] = [
  {
    id: 1,
    userId: "fakeUser",
    tripId: 123,
    type: "TEST",
    relatedId: null,
    channel: null,
    title: "Test Notification 1",
    message: "This is a test notification message.",
    data: null,
    isRead: false,
    createdAt: new Date().toISOString(),
    readAt: null,
  },
  {
    id: 2,
    userId: "fakeUser",
    tripId: 456,
    type: "TEST",
    relatedId: null,
    channel: null,
    title: "Test Notification 2",
    message: "This is a second test notification.",
    data: null,
    isRead: true,
    createdAt: new Date().toISOString(),
    readAt: new Date().toISOString(),
  },
  {
    id: 3,
    userId: "fakeUser",
    tripId: null,
    type: "TEST",
    relatedId: null,
    channel: null,
    title: "Test Notification 3",
    message: "This is a third, unread notification.",
    data: null,
    isRead: false,
    createdAt: new Date().toISOString(),
    readAt: null,
  },
];

export default function NotificationsBell() {
  const theme = useTheme();
  const [notifications, setNotifications] = useState<UserNotification[]>(
    initialFakeNotifications
  );

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Manage Menu open/close state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleBellClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notif: UserNotification) => {
    console.log("Notification clicked: ", notif);
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      );
      console.log("Marked as read: ", notif.id);
    }
    handleMenuClose();
  };

  const handleDeleteNotification = async (
    notifId: number,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    console.log("Deleting notification:", notifId);
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
  };

  const handleClearAll = async (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log("Clearing all notifications");
    setNotifications([]);
    handleMenuClose();
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleBellClick}>
        <Badge badgeContent={unreadCount} color="secondary">
          <Notifications />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              width: 380,
              maxHeight: 500,
              borderRadius: "12px",
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[24],
              backgroundColor: theme.palette.background.paper,
            },
          },
        }}
        MenuListProps={{
          sx: { py: 0 },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "background.default",
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            Notifications
          </Typography>
          {notifications.length > 0 && (
            <Tooltip title="Clear All">
              <IconButton
                onClick={handleClearAll}
                size="small"
                sx={{ color: "text.secondary" }}
              >
                <ClearAll fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {notifications.length === 0 ? (
          <Box
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Notifications
              sx={{ fontSize: 32, color: "text.disabled", mb: 1 }}
            />
            <Typography variant="body2" color="text.disabled">
              No new notifications
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {notifications.map((notif) => (
              <ListItemButton
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                sx={{
                  px: 2,
                  py: 1.5,
                  gap: 1.5,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                  position: "relative",
                  ...(!notif.isRead && {
                    "&:before": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      bgcolor: "primary.main",
                    },
                  }),
                }}
              >
                {!notif.isRead && (
                  <Circle
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      fontSize: 8,
                      color: "primary.main",
                    }}
                  />
                )}

                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "action.hover",
                    color: "primary.main",
                  }}
                >
                  <Notifications fontSize="small" />
                </Avatar>

                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      fontWeight={notif.isRead ? 400 : 600}
                      color={notif.isRead ? "text.primary" : "primary.main"}
                    >
                      {notif.title}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      component="span"
                      color="text.secondary"
                    >
                      {notif.message}
                      <br />{" "}
                      <Typography
                        variant="caption"
                        component="span"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        {formatDateTime(notif.createdAt)}
                      </Typography>
                    </Typography>
                  }
                  sx={{ my: 0 }}
                />
                <Tooltip title="Clear">
                  <IconButton
                    onClick={(e) => handleDeleteNotification(notif.id, e)}
                    size="small"
                    sx={{
                      color: "text.secondary",
                      "&:hover": {
                        color: "error.main",
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                      },
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M5.5 5.5a.5.5 0 0 1 .5.5V10a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zM10 5a.5.5 0 0 1 .5.5V10a.5.5 0 0 1-1 0V5.5A.5.5 0 0 1 10 5z" />
                      <path
                        fillRule="evenodd"
                        d="M4.5 1a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1h2.5a.5.5 0 0 1 0 1H14v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3h-.5a.5.5 0 0 1 0-1H4.5V1zm1 1a.5.5 0 0 0-.5.5V3h6v-.5a.5.5 0 0 0-.5-.5h-5z"
                      />
                    </svg>
                  </IconButton>
                </Tooltip>
              </ListItemButton>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
}
