import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  return (
    <Dialog open={open} onClose={onClose} sx={{
      "& .MuiDialog-paper": {
        borderRadius: 2,
        border: 2,
        backgroundColor: 'background.paper',
        borderColor: 'error.main',
      },
    }}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onConfirm} color="error">
          Yes
        </Button>
        <Button onClick={onClose}>No</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;