"use client";

import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  IconButton,
  Paper,
  Theme,
  Typography,
  useTheme,
} from "@mui/material";

import {
  Flight,
  Hotel,
  GroupAdd,
  Explore,
  DateRange,
  Luggage,
  FlightTakeoff,
  FlightLand,
  Poll as PollIcon,
  Work,
  Group,
  ArrowForward,
} from "@mui/icons-material";
import { motion, useTransform, useScroll } from "framer-motion";
import styled from "@emotion/styled";

interface TripData {
  name: string;
  status: "upcoming" | "in-progress" | "completed";
  from: string;
  to: string;
  start: string;
  end: string;
  members: string[];
  budget: number;
}

interface AdventureCardProps {
  icon: React.ReactNode;
  title: string;
  status: string;
  onClick?: () => void;
}

interface Poll {
  id: string;
  question: string;
  votes: number;
}

const GradientHeader = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  padding: "3rem 2rem",
  color: "white",
  borderRadius: "0 0 80px 80px",
  position: "relative",
  overflow: "hidden",
  "&:before": {
    content: '""',
    position: "absolute",
    // top: -50,
    // right: -50,
    // width: 200,
    // height: 200,
    background: "rgba(255,255,255,0.1)",
    borderRadius: "50%",
  },
}));

const HeaderGrid = styled(Grid)(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    // gap: "2rem",
    // textAlign: "center",
  },
}));

const SectionContainer = styled(Paper)(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 3,
  boxShadow: theme.shadows[4],
  marginBottom: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
}));

const LocationPill = ({
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
}) => (
  <motion.div whileHover={{ y: -3 }}>
    <Chip
      label={label}
      sx={{
        background: color,
        color: "text.primary",
        px: 3,
        py: 1.5,
        fontSize: "1.1rem",
        fontWeight: 600,
      }}
    />
  </motion.div>
);

const MemberAvatar = ({ member }: { member: string }) => (
  <motion.div
    whileHover={{ scale: 1.1 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <Avatar
      sx={{
        width: 72,
        height: 72,
        // bgcolor: `hsl(${index * 70}, 70%, 50%)`,
        fontSize: "1.5rem",
        fontWeight: 700,
        boxShadow: 3,
        border: "2px solid white",
      }}
    >
      {member}
    </Avatar>
  </motion.div>
);

const AdventureCard = ({
  icon,
  title,
  status,
  onClick,
}: AdventureCardProps) => (
  <motion.div whileHover={{ y: -5 }}>
    <Paper
      sx={{
        p: 3,
        borderRadius: 4,
        height: "100%",
        transition: "all 0.3s ease",
        cursor: "pointer",
        backgroundColor: "background.default",
        "&:hover": {
          boxShadow: 6,
        },
      }}
      onClick={onClick}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <IconButton
          sx={{
            mb: 2,
            fontSize: "2.5rem",
            color: "primary.main",
            bgcolor: "action.hover",
            borderRadius: 3,
          }}
        >
          {icon}
        </IconButton>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Chip
          label={status}
          color="secondary"
          size="medium"
          sx={{
            fontWeight: 600,
            px: 2,
            borderRadius: 2,
          }}
        />
      </Box>
    </Paper>
  </motion.div>
);

const PollPreviewCard = ({ poll }: { poll: Poll }) => (
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
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <PollIcon color="primary" />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {poll.question}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {poll.votes} votes received
          </Typography>
        </Box>
      </Box>
    </Paper>
  </motion.div>
);

function TripHeader({ trip }: { trip: TripData }) {
  const theme = useTheme();

  const BudgetRing = styled(motion.div)({
    position: "relative",
    width: 140,
    height: 140,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))",
    background: theme.palette.primary.main,
  });

  return (
    <GradientHeader theme={theme}>
      <Container sx={{ maxHeight: "100vh" }}>
        <HeaderGrid container alignItems="center">
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "2.5rem", md: "3.5rem" },
                  fontWeight: 900,
                  lineHeight: 1.2,
                  letterSpacing: "-1.5px",
                  mb: 2,
                }}
              >
                {trip.name}
              </Typography>
              <Chip
                label={trip.status.toUpperCase()}
                color="secondary"
                sx={{
                  borderRadius: 2,
                  //   py: 1,
                  //   px: 2.5,
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              />
            </Box>

            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <DateRange sx={{ fontSize: "2rem" }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                      Departure Date
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {trip.start}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <FlightTakeoff sx={{ fontSize: "2rem" }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                      Return Date
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {trip.end}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Box
              sx={{
                mt: 4,
                display: "flex",
                alignItems: "center",
                gap: 3,
                [theme.breakpoints.down("md")]: {
                  justifyContent: "center",
                },
              }}
            >
              <LocationPill
                icon={<Flight sx={{ fontSize: "1.2rem" }} />}
                label={trip.from}
                color={theme.palette.background.paper}
              />
              {/* <Box
                sx={{
                  width: 40,
                  height: 2,
                  background: theme.palette.background.default,
                }}
              /> */}
              <ArrowForward />
              <LocationPill
                icon={<FlightLand sx={{ fontSize: "1.2rem" }} />}
                label={trip.to}
                color={theme.palette.background.paper}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={4} order={{ xs: 1, md: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: { xs: "center", md: "flex-end" },
                // mb: { xs: 0, md: 0 },
                mt: { xs: 2, md: 0 },
              }}
            >
              <BudgetRing>
                <Box
                  sx={{
                    background: theme.palette.background.paper,
                    borderRadius: "50%",
                    width: "80%",
                    height: "80%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    // boxShadow: theme.shadows[4],
                  }}
                >
                  <Box textAlign="center">
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      color={theme.palette.text.primary}
                      sx={{ fontSize: { xs: "1.5rem", md: "2rem" } }}
                    >
                      ${trip.budget.toLocaleString()}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.8rem", md: "1rem" } }}
                    >
                      Total Budget
                    </Typography>
                  </Box>
                </Box>
              </BudgetRing>
            </Box>
          </Grid>
        </HeaderGrid>
      </Container>
    </GradientHeader>
  );
}

export default function TripOverview() {
  const theme = useTheme();
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.9]);
  const [activeSection, setActiveSection] = useState("overview");

  console.log(activeSection);
  const [trip] = useState<TripData>({
    name: "Asian Adventure 2024",
    status: "upcoming",
    from: "New York",
    to: "Tokyo",
    start: "Mar 15, 2024",
    end: "Apr 2, 2024",
    members: ["JD", "AR", "SP", "MG", "TP"],
    budget: 5000,
  });

  const [polls] = useState<Poll[]>([
    { id: "1", question: "Which activities should we prioritize?", votes: 3 },
    { id: "2", question: "Preferred departure time?", votes: 5 },
  ]);

  return (
    <motion.div style={{ scale }}>
      <Container maxWidth="xl" disableGutters>
        <TripHeader trip={trip} />

        <Container sx={{ pt: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
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
                    <Work fontSize="large" />
                    Journey Essentials
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Key components of your upcoming adventure
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  {[
                    {
                      id: "stays",
                      icon: <Hotel />,
                      title: "Stays",
                      status: "3 Booked",
                    },
                    {
                      id: "activities",
                      icon: <Explore />,
                      title: "Activities",
                      status: "5 Planned",
                    },
                    {
                      id: "packing",
                      icon: <Luggage />,
                      title: "Packing List",
                      status: "In Progress",
                    },
                    {
                      id: "itinerary",
                      icon: <DateRange />,
                      title: "Itinerary",
                      status: "Draft",
                    },
                  ].map((item, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <AdventureCard
                        {...item}
                        onClick={() => setActiveSection(item.id)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </SectionContainer>
            </Grid>
            <Grid item xs={12} md={6}>
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
                    <Group fontSize="large" />
                    Travel Squad
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {trip.members.length} adventurers joining the journey
                  </Typography>
                </Box>

                <Box display="flex" flexWrap="wrap" gap={3} mb={3}>
                  {trip.members.map((member, index) => (
                    <MemberAvatar key={index} member={member} />
                  ))}
                </Box>

                <motion.div whileHover={{ scale: 1.05 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    startIcon={<GroupAdd />}
                    sx={{
                      borderRadius: 3,
                      py: 1.5,
                      fontSize: "1.1rem",
                    }}
                  >
                    Invite More Explorers
                  </Button>
                </motion.div>
              </SectionContainer>
            </Grid>
          </Grid>

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
                  <PollPreviewCard poll={poll} />
                </Grid>
              ))}
            </Grid>
          </SectionContainer>

          <Typography
            variant="body1"
            sx={{
              fontStyle: "italic",
              color: "text.secondary",
              textAlign: "center",
              maxWidth: 600,
              mx: "auto",
              lineHeight: 1.6,
              "&:before, &:after": {
                content: '"✈️"',
                mx: 1,
              },
            }}
          >
            {'"The journey of a thousand miles begins with a single step"'}
          </Typography>
        </Container>
      </Container>
    </motion.div>
  );
}
