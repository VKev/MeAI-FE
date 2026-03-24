import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type TMediaResource = {
  id: string;
  name: string;
  type: string;
  url?: string;
  thumbnail_url: string;
}

type MediaResourceStore = {
  mediaResources: TMediaResource[];
};

type MediaResourceAction = {
  setMediaResources: (resources: TMediaResource[]) => void;
  clearMediaResources: () => void;
}

const demoData = [
  {
    id: "1",
    name: "Image 1",
    type: "image",
    thumbnail_url: "https://cdn.leonardo.ai/users/61b12163-b5db-448c-9fc7-816eba537f81/generations/17fe4c94-9560-4e79-8468-f70f08e95b10/segments/1:1:1/Lucid_Origin_bmw_530i_with_sleek_red_metal_color_featuring_a_p_0.jpg"
  },
  {
    id: "2",
    name: "Video 1",
    type: "video",
    url: "https://github.com/codedamn-classrooms/tiktok-react-material/raw/main/v1.mp4",
    thumbnail_url: "https://cdn.leonardo.ai/users/61b12163-b5db-448c-9fc7-816eba537f81/generations/17fe4c94-9560-4e79-8468-f70f08e95b10/segments/1:1:1/Lucid_Origin_bmw_530i_with_sleek_red_metal_color_featuring_a_p_0.jpg"
  },
  {
    id: "3",
    name: "Audio 1",
    type: "image",
    thumbnail_url: "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "5",
    name: "Audio 1",
    type: "image",
    thumbnail_url: "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "4",
    name: "Video 3",
    type: "video",
    url: "https://github.com/codedamn-classrooms/tiktok-react-material/raw/main/v1.mp4",
    thumbnail_url: "https://cdn.leonardo.ai/users/61b12163-b5db-448c-9fc7-816eba537f81/generations/17fe4c94-9560-4e79-8468-f70f08e95b10/segments/1:1:1/Lucid_Origin_bmw_530i_with_sleek_red_metal_color_featuring_a_p_0.jpg"
  },
]

const initialState = {
  mediaResources: demoData // Start with demo data for easier testing, can be set to [] in production
};

const useMediaResourceStore = create<MediaResourceStore & MediaResourceAction>()(
  persist(
    (set) => ({
      ...initialState,
      setMediaResources: (resources) => set({ mediaResources: resources }),
      clearMediaResources: () => set({ mediaResources: [] }),
    }),
    {
      name: "media-resource-storage",
      storage: createJSONStorage(() => window.localStorage),
    }
  )
)

export default useMediaResourceStore;
