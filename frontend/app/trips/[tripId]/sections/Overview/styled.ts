import styled from "@emotion/styled";
import { Box, Grid, Paper, Theme } from "@mui/material";

// The big gradient top header
export const GradientHeader = styled(Box)<{ theme: Theme }>(({}) => ({
  padding: "3rem 2rem",
  color: "white",
  borderRadius: "0 0 80px 80px",
  position: "relative",
  overflow: "hidden",
  "&:before": {
    content: '""',
    position: "absolute",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "50%",
  },
}));

export const HeaderGrid = styled(Grid)(({ theme }: { theme: Theme }) => ({
  marginTop: theme.spacing(4),
}));

export const SectionContainer = styled(Paper)(
  ({ theme }: { theme: Theme }) => ({
    padding: theme.spacing(4),
    borderRadius: theme.shape.borderRadius * 3,
    boxShadow: theme.shadows[4],
    marginBottom: theme.spacing(4),
    backgroundColor: theme.palette.background.paper,
  })
);

export const TwoColSectionContainer = styled(Paper)(
  ({ theme }: { theme: Theme }) => ({
    padding: theme.spacing(4),
    borderRadius: theme.shape.borderRadius * 3,
    boxShadow: theme.shadows[4],
    marginBottom: theme.spacing(4),
    backgroundColor: theme.palette.background.paper,
    minHeight: 352,
    [theme.breakpoints.down("sm")]: {
      minHeight: 0,
    },
  })
);
