import { createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import type { TProfile } from '@/models/profile.model';
import { createUserStore } from '@/store/user.store';

type UserStore = ReturnType<typeof createUserStore>;

const UserStoreContext = createContext<UserStore | null>(null);

type Props = {
  children: React.ReactNode;
  initialUser: TProfile | null;
};

export function UserStoreProvider({ children, initialUser }: Props) {
  const storeRef = useRef<UserStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = createUserStore(initialUser);
  }

  return <UserStoreContext.Provider value={storeRef.current}>{children}</UserStoreContext.Provider>;
}

/* ======================
   Hooks
   ====================== */

export function useCurrentUser() {
  const store = useContext(UserStoreContext);
  if (!store) {
    throw new Error('useCurrentUser must be used within UserStoreProvider');
  }

  return useStore(store, (s) => s.user);
}

export function useUserActions() {
  const store = useContext(UserStoreContext);
  if (!store) {
    throw new Error('useUserActions must be used within UserStoreProvider');
  }

  return {
    setUser: store.getState().setUser,
    clearUser: store.getState().clearUser
  };
}
