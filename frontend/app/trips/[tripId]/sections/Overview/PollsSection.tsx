"use client";

import {
  Grid,
  Typography,
  Box,
  useTheme,
  Paper,
  Button,
  useMediaQuery,
} from "@mui/material";
import PollIcon from "@mui/icons-material/Poll";
import { motion } from "framer-motion";
import { SectionContainer } from "./styled";
import { Poll } from "@/app/trips/[tripId]/sections/Polls/types";
import Masonry from "@mui/lab/Masonry";

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
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                wordBreak: "break-word",
                overflowWrap: "break-word",
                whiteSpace: "pre-line",
              }}
            >
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
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const MAX_ACTIVE_POLLS = 6;

  return (
    <SectionContainer theme={theme}>
      <Box
        mb={3}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Box>
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
            {polls.length} ongoing decision(s)
          </Typography>
        </Box>

        {!isMobile && (
          <Box>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  fontSize: "1.1rem",
                }}
                onClick={() => onSectionChange("polls")}
              >
                View All Polls
              </Button>
            </motion.div>
          </Box>
        )}
      </Box>

      <Masonry columns={isMobile ? 1 : 2} spacing={2}>
        {polls.slice(0, MAX_ACTIVE_POLLS).map((poll) => (
          <PollPreviewCard
            key={poll.id}
            id={poll.id}
            question={poll.question}
            votes={poll.totalVotes}
            onClick={() => onSectionChange("polls")}
          />
        ))}
      </Masonry>

      {isMobile && (
        <Box
          sx={{
            mt: 3,
            mx: "auto",
          }}
        >
          <motion.div whileHover={{ scale: 1.05 }}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              sx={{
                borderRadius: 3,
                py: 1.5,
                fontSize: "1.1rem",
              }}
              onClick={() => onSectionChange("polls")}
            >
              {polls.length > 0 ? "View All Polls" : "Go to Polls"}
            </Button>
          </motion.div>
        </Box>
      )}
    </SectionContainer>
  );
}
