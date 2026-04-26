import { create } from 'zustand';
import type { ScoreDisplay, LiveOdds } from '../types';

interface MatchStore {
  scores: Record<string, ScoreDisplay>;
  odds: Record<string, LiveOdds>;
  prevOdds: Record<string, LiveOdds>;
  events: Record<string, string>;
  setScore: (matchId: string, score: ScoreDisplay) => void;
  setOdds: (matchId: string, odds: LiveOdds) => void;
  setEvent: (matchId: string, event: string) => void;
}

export const useMatchStore = create<MatchStore>((set) => ({
  scores: {},
  odds: {},
  prevOdds: {},
  events: {},
  setScore: (matchId, score) => set((s) => ({ scores: { ...s.scores, [matchId]: score } })),
  setOdds: (matchId, odds) => set((s) => ({
    prevOdds: s.odds[matchId] ? { ...s.prevOdds, [matchId]: s.odds[matchId] } : s.prevOdds,
    odds: { ...s.odds, [matchId]: odds }
  })),
  setEvent: (matchId, event) => set((s) => ({ events: { ...s.events, [matchId]: event } })),
}));