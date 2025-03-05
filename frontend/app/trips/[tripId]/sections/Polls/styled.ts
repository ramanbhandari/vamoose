import { styled } from "@mui/material/styles";
import { Button, Dialog, Paper, Theme } from "@mui/material";

export const PollCard = styled(Paper)(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: theme.shadows[6],
  },
}));

export const HeaderButton = styled(Button)(({ theme }) => ({
  backdropFilter: "blur(10px)",
  backgroundColor: "rgba(255, 255, 255, 0.05)",
  border: `1px solid ${theme.palette.common.white}`,
  color: theme.palette.common.white,
  "&:hover": {
    backgroundColor: theme.palette.primary.main,
  },
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    marginTop: theme.spacing(2),
  },
}));

export const FloatingDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: 16,
    width: "100%",
    maxWidth: "600px",
    maxHeight: "80vh",
    boxShadow: theme.shadows[10],
    overflow: "hidden",
  },
  "& .MuiBackdrop-root": {
    backdropFilter: "blur(8px)",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
}));
