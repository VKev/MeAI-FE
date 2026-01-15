import type { TProfile } from '@/models/profile.model';
import { create } from 'zustand';

export type UserStateType = {
  user: TProfile | null;
  setUser: (user: TProfile | null) => void;
  clearUser: () => void;
};


export const useUserStore = create<UserStateType>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
