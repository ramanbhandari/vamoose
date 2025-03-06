import { Poll } from "./types";

export const pollStatusOptions = [
  { label: "All Polls", value: "all" },
  { label: "Active Polls", value: "active" },
  { label: "Past Polls", value: "expired" },
];

export const fakePolls: Poll[] = [
  {
    id: 1,
    question: "Where should we go for dinner?",
    options: [
      {
        id: 1,
        option: "Italian",
        voteCount: 3,
        percentage: 50,
        voters: ["Me", "You"],
      },
      {
        id: 2,
        option: "Mexican",
        voteCount: 5,
        percentage: 70,
        voters: ["Me", "You"],
      },
      {
        id: 3,
        option: "Indian",
        voteCount: 2,
        percentage: 30,
        voters: ["Me", "You"],
      },
    ],
    createdAt: "2025-03-01",
    expiresAt: "2025-03-10",

    createdBy: {
      id: "",
      email: "user@example.com",
      fullName: "Raman Bhandari",
    },
    status: "ACTIVE",
    winner: null,
    completedAt: "",
    totalVotes: 7,
  },
  {
    id: 3,
    question: "Where should we go for dinner?",
    options: [
      {
        id: 1,
        option: "Italian",
        voteCount: 3,
        percentage: 50,
        voters: ["Me", "You"],
      },
      {
        id: 2,
        option: "Mexican",
        voteCount: 5,
        percentage: 50,
        voters: ["Me", "You"],
      },
      {
        id: 3,
        option: "Indian",
        voteCount: 2,
        percentage: 50,
        voters: ["Me", "You"],
      },
    ],
    createdAt: "2025-03-01",
    expiresAt: "2025-03-10",

    createdBy: {
      id: "",
      email: "user@example.com",
      fullName: "Raman Bhandari",
    },
    status: "ACTIVE",
    winner: null,
    completedAt: "",
    totalVotes: 7,
  },

  {
    id: 4,
    question: "Where should we go for dinner?",
    options: [
      {
        id: 1,
        option: "Italian",
        voteCount: 3,
        percentage: 50,
        voters: ["Me", "You"],
      },
      {
        id: 2,
        option: "Mexican",
        voteCount: 5,
        percentage: 50,
        voters: ["Me", "You"],
      },
      {
        id: 3,
        option: "Indian",
        voteCount: 2,
        percentage: 50,
        voters: ["Me", "You"],
      },
    ],
    createdAt: "2025-03-01",
    expiresAt: "2025-03-10",

    createdBy: {
      id: "",
      email: "user@example.com",
      fullName: "Raman Bhandari",
    },

    status: "ACTIVE",
    winner: null,
    completedAt: "",
    totalVotes: 7,
  },
];

export const fakePollsExpired: Poll[] = [
  {
    id: 2,
    question: "What activity should we do tomorrow?",
    options: [
      {
        id: 1,
        option: "Hiking",
        voteCount: 7,
        percentage: 50,
        voters: ["Me", "You"],
      },
      {
        id: 2,
        option: "Beach",
        voteCount: 3,
        percentage: 50,
        voters: ["Me", "You"],
      },
      {
        id: 3,
        option: "Shopping",
        voteCount: 4,
        percentage: 50,
        voters: ["Me", "You"],
      },
    ],
    winner: {
      id: 1,
      option: "Hiking",
      voteCount: 7,
      percentage: 50,
      voters: ["Me", "You"],
    },
    createdAt: "2025-02-20",
    expiresAt: "2025-02-25",

    createdBy: {
      id: "",
      email: "user@example.com",
      fullName: "Raman Bhandari",
    },

    status: "COMPLETED",
    completedAt: "",
    totalVotes: 7,
  },
  {
    id: 5,
    question: "What activity should we do tomorrow?",
    options: [
      {
        id: 1,
        option: "Hiking",
        voteCount: 7,
        percentage: 50,
        voters: ["Me", "You"],
      },
      {
        id: 2,
        option: "Beach",
        voteCount: 3,
        percentage: 50,
        voters: ["Me", "You"],
      },
      {
        id: 3,
        option: "Shopping",
        voteCount: 4,
        percentage: 50,
        voters: ["Me", "You"],
      },
    ],
    winner: {
      id: 1,
      option: "Hiking",
      voteCount: 7,
      percentage: 50,
      voters: ["Me", "You"],
    },
    createdAt: "2025-02-20",
    expiresAt: "2025-02-25",

    createdBy: {
      id: "",
      email: "user@example.com",
      fullName: "Raman Bhandari",
    },

    status: "COMPLETED",
    completedAt: "",
    totalVotes: 7,
  },
];
