import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TMediaResource = {
  id: string;
  name: string;
  type: string;
  url?: string;
  thumbnail_url: string;
  format?: string;
};

type MediaResourceStore = {
  mediaResources: TMediaResource[];
};

type MediaResourceAction = {
  setMediaResources: (resources: TMediaResource[]) => void;
  clearMediaResources: () => void;
};

const initialState = {
  mediaResources: [] as TMediaResource[]
};

const useMediaResourceStore = create<MediaResourceStore & MediaResourceAction>()(
  persist(
    (set) => ({
      ...initialState,
      setMediaResources: (resources) => set({ mediaResources: resources }),
      clearMediaResources: () => set({ mediaResources: [] })
    }),
    {
      name: 'media-resource-storage',
      storage: createJSONStorage(() => window.localStorage)
    }
  )
);

export default useMediaResourceStore;
