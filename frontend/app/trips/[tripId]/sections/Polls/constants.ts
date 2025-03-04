export const pollStatusOptions = [
  { label: "All Polls", value: "all" },
  { label: "Active Polls", value: "active" },
  { label: "Past Polls", value: "expired" },
];

export const fakePolls = [
  {
    id: 1,
    question: "Where should we go for dinner?",
    options: [
      { id: 1, text: "Italian", votes: 3 },
      { id: 2, text: "Mexican", votes: 5 },
      { id: 3, text: "Indian", votes: 2 },
    ],
    createdAt: "2025-03-01",
    expiresAt: "2025-03-10",
    tripId: 123,
    createdBy: "user@example.com",
    status: "active",
  },
  {
    id: 2,
    question: "What activity should we do tomorrow?",
    options: [
      { id: 1, text: "Hiking", votes: 7 },
      { id: 2, text: "Beach", votes: 3 },
      { id: 3, text: "Shopping", votes: 4 },
    ],
    createdAt: "2025-02-20",
    expiresAt: "2025-02-25",
    tripId: 123,
    createdBy: "user@example.com",
    status: "expired",
  },
];
