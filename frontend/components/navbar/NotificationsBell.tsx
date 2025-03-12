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
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import CloseIcon from "@mui/icons-material/Close";
import { formatDateTime } from "@/utils/dateFormatter";

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
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        slotProps={{ paper: { sx: { width: 350, maxHeight: 400 } } }}
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
            <Tooltip title={"Clear All"}>
              <IconButton onClick={handleClearAll} size="small" color="primary">
                <ClearAllIcon />
              </IconButton>
            </Tooltip>
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
                  mb: 0.5,
                  borderRadius: 1,
                  backgroundColor: notif.isRead ? "inherit" : "action.selected",
                  display: "flex",
                  alignItems: "center",
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
