import { create } from 'zustand';

const useUserStore = create((set) => ({
  userId: null,
  username: null,
  balance: 0,
  exposure: 0,
  available: 0,
  role: 'user',
  setUser: (u) => set({
    userId: u.id,
    username: u.username,
    balance: u.balance,
    exposure: u.exposure,
    available: u.balance - u.exposure,
    role: u.role
  }),
  setWallet: (w) => set({
    balance: w.balance,
    exposure: w.exposure,
    available: w.available
  }),
}));

export default useUserStore;