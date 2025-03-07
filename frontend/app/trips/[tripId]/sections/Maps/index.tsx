import { Box, Typography, useTheme, Container } from "@mui/material";
import { GradientHeader } from "../Overview/styled";
import InteractiveMap from "./InteractiveMap";

interface MapsProps {
  tripId: number;
  tripName: string;
  imageUrl?: string;
}

export default function Maps({ tripId, tripName, imageUrl }: MapsProps) {
  const theme = useTheme();
  return (
    <Box key={tripId}>
      <GradientHeader
        theme={theme}
        sx={{
          background: imageUrl
            ? "none"
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,

          "&::after": imageUrl
            ? {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: `url(${imageUrl}) center/cover no-repeat`,
                filter: "brightness(0.5) blur(4px)",
                zIndex: -2,
              }
            : "none",

          "& > *": {
            position: "relative",
            zIndex: 1,
          },
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <Typography variant="h4" fontWeight="bold">
              {tripName}
            </Typography>
          </Box>
        </Container>
      </GradientHeader>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <InteractiveMap />
      </Container>
    </Box>
  );
}
