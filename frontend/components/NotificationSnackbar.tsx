"use client";

import React, { useEffect } from "react";
import { Snackbar, Alert, SnackbarCloseReason } from "@mui/material";
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
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    if(!!message){
      setOpen(true)
    }
  }, [message]);

  if (severity === "close") {
    return <></>;
  }

  const handleClose = (
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
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
