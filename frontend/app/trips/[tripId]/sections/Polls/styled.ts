import styled from "@emotion/styled";
import { Paper, Theme } from "@mui/material";

export const PollCard = styled(Paper)(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: theme.shadows[6],
  },
}));
