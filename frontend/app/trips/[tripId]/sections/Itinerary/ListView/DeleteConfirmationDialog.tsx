/**
 * @file DeleteConfirmationDialog.tsx
 * @description A small floating confirmation modal used to confirm destructive actions like deleting an event.
 *
 */

import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useTheme,
} from "@mui/material";
import { FloatingDialogSmall } from "../../Polls/styled";
import { Close } from "@mui/icons-material";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title = "Delete Event",
  description = "Are you sure you want to delete this event?",
}) => {
  const theme = useTheme();
  return (
    <FloatingDialogSmall open={open} onClose={onClose}>
      <DialogTitle
        sx={{ p: 0, backgroundColor: theme.palette.background.default }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 3,
            pb: 2,
          }}
        >
          <Typography variant="h5" fontWeight={600} color="text.primary">
            {title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          px: 3,
          py: 0,
          pt: 2,
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Typography variant="body1">{description}</Typography>
      </DialogContent>
      <DialogActions
        sx={{
          p: 3,
          pt: 2,
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          sx={{ px: 3, borderRadius: "8px", fontWeight: 600 }}
        >
          Delete
        </Button>
      </DialogActions>
    </FloatingDialogSmall>
  );
};
export default DeleteConfirmationDialog;
