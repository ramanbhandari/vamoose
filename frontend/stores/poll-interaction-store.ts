import { Poll } from "@/app/trips/[tripId]/sections/Polls/types";
import { create } from "zustand";

interface PollInteractionState {
  activePollId: number | null;
  selectedOptionId: number | null;
  userVotes: Record<number, number>; // { [pollId]: optionId }
  initializeUserVotes: (polls: Poll[], userId: string) => void;
  setUserVote: (pollId: number, optionId: number) => void;
  setActivePoll: (pollId: number | null, optionId: number | null) => void;
  clearSelection: () => void;
}

export const usePollInteractionStore = create<PollInteractionState>((set) => ({
  activePollId: null,
  selectedOptionId: null,
  userVotes: {},

  // set the vote options this user has saved for all polls earlier, call it when Polls are fetched
  initializeUserVotes: async (polls, userId) => {
    const userVotes = polls.reduce(
      (acc, poll) => {
        const userVote = poll.options.find((option) =>
          option.voters.some((voter) => voter.id === userId)
        );
        if (userVote) {
          acc[poll.id] = userVote.id;
        }
        return acc;
      },
      {} as Record<number, number>
    );

    set({ userVotes });
  },
  setUserVote: (pollId, optionId) =>
    set((state) => ({ userVotes: { ...state.userVotes, [pollId]: optionId } })),
  setActivePoll: (pollId, optionId) =>
    set({ activePollId: pollId, selectedOptionId: optionId }),
  clearSelection: () => set({ activePollId: null, selectedOptionId: null }),
}));
