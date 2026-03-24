import type { TProfile } from '@/models/profile.model';
import { localStorage } from '@/utils';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type UserStore = {
  user: TProfile | null;
  isHydrated: boolean;
  setUser: (user: TProfile | null) => void;
  clearUser: () => void;
  setHydrated: () => void;
};

const initialState = {
  user: null,
  isHydrated: false,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      ...initialState,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
