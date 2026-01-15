import { createStore } from 'zustand/vanilla';
import type { TProfile } from '@/models/profile.model';

export type UserStateType = {
  user: TProfile | null;
  setUser: (user: TProfile | null) => void;
  clearUser: () => void;
};

export function createUserStore(
  initialUser: TProfile | null
) {
  return createStore<UserStateType>((set) => ({
    user: initialUser,

    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null }),
  }));
}