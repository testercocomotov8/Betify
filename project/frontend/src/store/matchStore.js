import { create } from 'zustand';

const useMatchStore = create((set) => ({
  scores: {},
  odds: {},
  prevOdds: {},
  events: {},
  setScore: (matchId, score) => set((s) => ({ scores: { ...s.scores, [matchId]: score } })),
  setOdds: (matchId, odds) => set((s) => ({
    prevOdds: { ...s.prevOdds, [matchId]: s.odds[matchId] || {} },
    odds: { ...s.odds, [matchId]: odds }
  })),
  setEvent: (matchId, event) => set((s) => ({ events: { ...s.events, [matchId]: event } })),
}));

export default useMatchStore;