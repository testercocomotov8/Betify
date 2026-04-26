import { create } from 'zustand';
import type { Bet, BetSlipItem } from '../types';

interface BetStore {
  slip: BetSlipItem | null;
  openBets: Bet[];
  settledBets: Bet[];
  setSlip: (item: BetSlipItem | null) => void;
  updateSlipStake: (stake: number) => void;
  addOpenBet: (bet: Bet) => void;
  updateBet: (id: string, updates: Partial<Bet>) => void;
  setOpenBets: (bets: Bet[]) => void;
  setSettledBets: (bets: Bet[]) => void;
  clearSlip: () => void;
}

export const useBetStore = create<BetStore>((set) => ({
  slip: null,
  openBets: [],
  settledBets: [],
  setSlip: (item) => set({ slip: item }),
  updateSlipStake: (stake) => set((s) => ({
    slip: s.slip ? { ...s.slip, stake } : null
  })),
  addOpenBet: (bet) => set((s) => ({ openBets: [bet, ...s.openBets] })),
  updateBet: (id, updates) => set((s) => ({
    openBets: s.openBets.map((b) => b.id === id ? { ...b, ...updates } : b)
  })),
  setOpenBets: (bets) => set({ openBets: bets }),
  setSettledBets: (bets) => set({ settledBets: bets }),
  clearSlip: () => set({ slip: null }),
}));