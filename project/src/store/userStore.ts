import { create } from 'zustand';
import type { User } from '../types';

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setWallet: (wallet: { balance: number; exposure: number; available: number }) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setWallet: (wallet) => set((s) => ({
    user: s.user ? { ...s.user, ...wallet } : null
  })),
  logout: () => set({ user: null, isAuthenticated: false }),
}));