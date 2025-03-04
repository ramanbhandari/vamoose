"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from "@mui/material";

interface CreatePollDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (question: string) => void;
}

const CreatePollDialog: React.FC<CreatePollDialogProps> = ({
  open,
  onClose,
  onCreate,
}) => {
  const [question, setQuestion] = useState("");

  const handleCreate = () => {
    if (question.trim()) {
      onCreate(question);
      setQuestion("");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Create New Poll</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Poll Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate}>
          Create Poll
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePollDialog;
