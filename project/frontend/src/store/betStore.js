import { create } from 'zustand';

const useBetStore = create((set) => ({
  selections: {},
  betSlip: null,
  openBets: [],
  setSelection: (matchId, selectionId, data) => set((s) => ({
    selections: {
      ...s.selections,
      [matchId]: {
        ...(s.selections[matchId] || {}),
        [selectionId]: data
      }
    }
  })),
  setBetSlip: (slip) => set({ betSlip: slip }),
  clearBetSlip: () => set({ betSlip: null }),
  setOpenBets: (bets) => set({ openBets: bets }),
  addOpenBet: (bet) => set((s) => ({ openBets: [bet, ...s.openBets] })),
  removeOpenBet: (betId) => set((s) => ({
    openBets: s.openBets.filter((b) => b.id !== betId)
  })),
}));

export default useBetStore;