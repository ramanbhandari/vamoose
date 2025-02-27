"use client";

import React from "react";
import { Snackbar, Alert } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import { useNotificationStore } from "@/stores/notification-store";

const iconMapping = {
  success: <CheckCircleIcon fontSize="inherit" />,
  error: <ErrorIcon fontSize="inherit" />,
  info: <InfoIcon fontSize="inherit" />,
  warning: <WarningIcon fontSize="inherit" />,
};

export default function NotificationSnackbar() {
  const { message, severity, clearNotification } = useNotificationStore();

  return (
    <Snackbar
      open={!!message}
      autoHideDuration={6000}
      onClose={clearNotification}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        onClose={clearNotification}
        severity={severity}
        iconMapping={iconMapping}
        sx={{
          width: "100%",
          border:
            severity === "success"
              ? "1px solid green"
              : severity === "error"
                ? "1px solid red"
                : severity === "warning"
                  ? "1px solid orange"
                  : "1px solid blue",
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
