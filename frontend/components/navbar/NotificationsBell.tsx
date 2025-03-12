"use client";

import React, { useState } from "react";
import {
  IconButton,
  Badge,
  Menu,
  Box,
  Typography,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Tooltip,
  Stack,
  useTheme,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CloseIcon from "@mui/icons-material/Close";

import {
  useUserNotificationsStore,
  UserNotification,
} from "@/stores/user-notifications-store";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/utils/dateFormatter";
import { useNotificationStore } from "@/stores/notification-store";

export default function NotificationsBell() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const router = useRouter();
  const { setNotification } = useNotificationStore();
  const {
    notifications,
    markAsRead,
    markManyAsRead,
    deleteOne,
    deleteMany,
    clearError,
    error,
  } = useUserNotificationsStore();

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Manage the Menu open/close state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleBellClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async (event: React.MouseEvent) => {
    event.stopPropagation();
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await markManyAsRead(unreadIds);
    handleMenuClose();
  };

  // When a notification is clicked, mark it as read and navigate if tripId is not null
  const handleNotificationClick = async (notif: UserNotification) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    handleMenuClose();

    if (error) {
      setNotification(error, "error");
      clearError();
      return;
    }
    if (notif.tripId) {
      router.push(`/trips/${notif.tripId}`);
    }
  };

  // Handle individual notification deletion
  const handleDeleteNotification = async (
    notifId: number,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    await deleteOne(notifId);

    if (error) {
      setNotification(error, "error");
      clearError();
    }
  };

  // Handle clearing all notifications
  const handleClearAll = async (event: React.MouseEvent) => {
    event.stopPropagation();
    const notificationIds = notifications.map((notif) => notif.id);
    await deleteMany(notificationIds);
    if (error) {
      setNotification(error, "error");
      clearError();
    }
    handleMenuClose();
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleBellClick}>
        <Badge badgeContent={unreadCount} color="secondary">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              width: 350,
              maxHeight: 400,
              borderRadius: "8px",
              boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
              backgroundColor: isDarkMode ? "background.default" : "primary",
            },
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Notifications</Typography>
          {notifications.length > 0 && (
            <Stack direction="row" spacing={1}>
              {unreadCount > 0 && (
                <Tooltip title="Mark All as Read">
                  <IconButton
                    onClick={handleMarkAllAsRead}
                    size="small"
                    color="success"
                  >
                    <DoneAllIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Clear All">
                <IconButton
                  onClick={handleClearAll}
                  size="small"
                  color="primary"
                >
                  <ClearAllIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No notifications yet..
            </Typography>
          </Box>
        ) : (
          <List>
            {notifications.map((notif) => (
              <ListItemButton
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                sx={{
                  backgroundColor: notif.isRead ? "inherit" : "action.selected",
                  display: "flex",
                  alignItems: "center",
                  boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
                  border: "1px solid",
                  borderColor: "divider",
                  transition: "background 0.2s",
                }}
              >
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        component="span"
                        sx={{ fontWeight: notif.isRead ? 400 : 600 }}
                      >
                        {notif.title}
                      </Typography>
                      <Tooltip title={"Clear"}>
                        <IconButton
                          onClick={(e) => handleDeleteNotification(notif.id, e)}
                          size="small"
                          sx={{ ml: "auto" }}
                          color="inherit"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
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
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
}
