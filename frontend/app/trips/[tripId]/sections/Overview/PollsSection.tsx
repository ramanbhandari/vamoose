"use client";

import { Grid, Typography, Box, useTheme, Paper } from "@mui/material";
import PollIcon from "@mui/icons-material/Poll";
import { motion } from "framer-motion";
import { SectionContainer } from "./styled";
import { Poll } from "@/app/trips/[tripId]/sections/Polls/types";

interface PollsSectionProps {
  polls: Poll[];
  onSectionChange: (sectionId: string) => void;
}

interface PollProps {
  id: number;
  question: string;
  votes: number;
  onClick?: () => void;
}

function PollPreviewCard({ question, votes, onClick }: PollProps) {
  return (
    <motion.div whileHover={{ y: -5 }}>
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          transition: "all 0.3s ease",
          cursor: "pointer",
          backgroundColor: "background.default",
          "&:hover": {
            boxShadow: 6,
          },
        }}
        onClick={onClick}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <PollIcon color="primary" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {question}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {votes} votes received
            </Typography>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
}

export default function PollsSection({
  polls,
  onSectionChange,
}: PollsSectionProps) {
  const theme = useTheme();
  return (
    <SectionContainer theme={theme}>
      <Box mb={3}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <PollIcon fontSize="large" />
          Active Polls
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {polls.length} ongoing decisions
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {polls.map((poll, index) => (
          <Grid item xs={12} md={6} key={index}>
            <PollPreviewCard
              id={poll.id}
              question={poll.question}
              votes={poll.totalVotes}
              onClick={() => onSectionChange("polls")}
            />
          </Grid>
        ))}
      </Grid>
    </SectionContainer>
  );
}
