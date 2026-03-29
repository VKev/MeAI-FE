import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type PostBuilderPlatform = 'tiktok' | 'facebook' | 'instagram' | 'thread';
export type PostBuilderMode = 'post' | 'reel' | 'video' | 'image';
export type ContentAlertSeverity = 'recommend' | 'warn' | 'block';

export interface PreviewContext {
  platform: PostBuilderPlatform;
  mode: PostBuilderMode;
}

export interface InlineContentAlert {
  severity: ContentAlertSeverity;
  message: string;
}

export interface PreviewContentState {
  previewText: string;
  charCount: number;
  inlineAlert: InlineContentAlert | null;
  isBlocked: boolean;
}

interface PlatformContent {
  text: string;
  html: string;
}

interface ContentPayload {
  content: string;
  htmlContent: string;
}

type Updater<T> = T | ((prev: T) => T);

interface PreviewState {
  mode: PostBuilderMode;
  selectedMediaIds: Partial<Record<PostBuilderMode, string[]>>;
  currentMediaIndex: Partial<Record<PostBuilderMode, number>>;
  isModalOpen: Partial<Record<PostBuilderMode, boolean>>;
  isExpanded: Partial<Record<PostBuilderMode, boolean>>;
  isMuted: Partial<Record<PostBuilderMode, boolean>>;
}

type PostBuilderStore = {
  content: string;
  activePlatform: PostBuilderPlatform;
  platformModes: Record<PostBuilderPlatform, PostBuilderMode>;
  platformContents: Record<PostBuilderPlatform, PlatformContent>;
  previewStates: Record<PostBuilderPlatform, PreviewState>;
  setRawContent: (payload: ContentPayload) => void;
  setActivePlatform: (platform: PostBuilderPlatform) => void;
  setPlatformMode: (platform: PostBuilderPlatform, mode: PostBuilderMode) => void;
  setPreviewMode: (platform: PostBuilderPlatform, mode: PostBuilderMode) => void;
  setSelectedMediaIds: (platform: PostBuilderPlatform, mode: PostBuilderMode, ids: Updater<string[]>) => void;
  setCurrentMediaIndex: (platform: PostBuilderPlatform, mode: PostBuilderMode, index: Updater<number>) => void;
  setIsModalOpen: (platform: PostBuilderPlatform, mode: PostBuilderMode, isOpen: Updater<boolean>) => void;
  setIsExpanded: (platform: PostBuilderPlatform, mode: PostBuilderMode, isExpanded: Updater<boolean>) => void;
  setIsMuted: (platform: PostBuilderPlatform, mode: PostBuilderMode, isMuted: Updater<boolean>) => void;
  canPublish: () => boolean;
};

const RECOMMENDED_SHORT_FORM_CHARS = 150;
const MAX_SHORT_FORM_CHARS = 300;

const initialModes: Record<PostBuilderPlatform, PostBuilderMode> = {
  tiktok: 'video',
  facebook: 'post',
  instagram: 'post',
  thread: 'post'
};

const initialPlatformContents: Record<PostBuilderPlatform, PlatformContent> = {
  tiktok: { text: '', html: '' },
  facebook: { text: '', html: '' },
  instagram: { text: '', html: '' },
  thread: { text: '', html: '' }
};

const createModeMap = <T,>(
  modes: PostBuilderMode[],
  createValue: () => T
): Partial<Record<PostBuilderMode, T>> =>
  modes.reduce<Partial<Record<PostBuilderMode, T>>>((acc, mode) => {
    acc[mode] = createValue();
    return acc;
  }, {});

const createPreviewState = (
  mode: PostBuilderMode,
  modes: PostBuilderMode[],
  isMutedDefault: boolean
): PreviewState => ({
  mode,
  selectedMediaIds: createModeMap(modes, () => [] as string[]),
  currentMediaIndex: createModeMap(modes, () => 0),
  isModalOpen: createModeMap(modes, () => false),
  isExpanded: createModeMap(modes, () => false),
  isMuted: createModeMap(modes, () => isMutedDefault)
});

const initialPreviewStates: Record<PostBuilderPlatform, PreviewState> = {
  tiktok: createPreviewState('video', ['video', 'image'], true),
  facebook: createPreviewState('post', ['post', 'reel'], true),
  instagram: createPreviewState('post', ['post', 'reel'], true),
  thread: createPreviewState('post', ['post'], false)
};

export function getPreviewContentState({
  content,
}: {
  content: string;
  context: PreviewContext;
}): PreviewContentState {
  const normalized = content.trim();
  const charCount = normalized.length;

  let inlineAlert: InlineContentAlert | null = null;
  if (charCount > MAX_SHORT_FORM_CHARS) {
    inlineAlert = {
      severity: 'block',
      message: `Content exceeds ${MAX_SHORT_FORM_CHARS} characters for reel/video format.`
    };
  } else if (charCount > RECOMMENDED_SHORT_FORM_CHARS) {
    inlineAlert = {
      severity: 'warn',
      message: `Content is long (${charCount} characters). Should keep <= ${RECOMMENDED_SHORT_FORM_CHARS} characters for platform compatibility.`
    };
  } else if (charCount > 0) {
    inlineAlert = {
      severity: 'recommend',
      message: `Content is suitable. Recommended to keep <= ${RECOMMENDED_SHORT_FORM_CHARS} characters.`
    };
  }

  return {
    previewText: normalized,
    charCount,
    inlineAlert,
    isBlocked: charCount > MAX_SHORT_FORM_CHARS
  };
}

const storage = typeof window === 'undefined' ? undefined : createJSONStorage(() => localStorage);

const resolveUpdater = <T,>(current: T, next: Updater<T>): T =>
  typeof next === 'function' ? (next as (prev: T) => T)(current) : next;

const areArraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const usePostBuilder = create<PostBuilderStore>()(
  persist(
    (set, get) => ({
      content: '',
      activePlatform: 'tiktok',
      platformModes: initialModes,
      platformContents: initialPlatformContents,
      previewStates: initialPreviewStates,

      setRawContent: ({ content, htmlContent }: ContentPayload) => {
        const activePlatform = get().activePlatform;
        set((state) => ({
          content,
          platformContents: {
            ...state.platformContents,
            [activePlatform]: { text: content, html: htmlContent }
          }
        }));
      },

      setActivePlatform: (platform) => {
        set((state) => ({
          activePlatform: platform,
          content: state.platformContents[platform].text
        }));
      },

      setPlatformMode: (platform, mode) => {
        set((state) => ({
          platformModes: {
            ...state.platformModes,
            [platform]: mode
          }
        }));
      },

      setPreviewMode: (platform, mode) => {
        set((state) => {
          if (state.previewStates[platform].mode === mode) {
            return state;
          }

          return {
            platformModes: {
              ...state.platformModes,
              [platform]: mode
            },
            previewStates: {
              ...state.previewStates,
              [platform]: {
                ...state.previewStates[platform],
                mode
              }
            }
          };
        });
      },

      setSelectedMediaIds: (platform, mode, ids) => {
        set((state) => {
          const currentIds = state.previewStates[platform].selectedMediaIds[mode] ?? [];
          const nextIds = resolveUpdater(currentIds, ids);

          if (areArraysEqual(currentIds, nextIds)) {
            return state;
          }

          return {
            previewStates: {
              ...state.previewStates,
              [platform]: {
                ...state.previewStates[platform],
                selectedMediaIds: {
                  ...state.previewStates[platform].selectedMediaIds,
                  [mode]: nextIds
                }
              }
            }
          };
        });
      },

      setCurrentMediaIndex: (platform, mode, index) => {
        set((state) => {
          const currentIndex = state.previewStates[platform].currentMediaIndex[mode] ?? 0;
          const nextIndex = resolveUpdater(currentIndex, index);

          if (currentIndex === nextIndex) {
            return state;
          }

          return {
            previewStates: {
              ...state.previewStates,
              [platform]: {
                ...state.previewStates[platform],
                currentMediaIndex: {
                  ...state.previewStates[platform].currentMediaIndex,
                  [mode]: nextIndex
                }
              }
            }
          };
        });
      },

      setIsModalOpen: (platform, mode, isOpen) => {
        set((state) => {
          const currentOpen = state.previewStates[platform].isModalOpen[mode] ?? false;
          const nextOpen = resolveUpdater(currentOpen, isOpen);

          if (currentOpen === nextOpen) {
            return state;
          }

          return {
            previewStates: {
              ...state.previewStates,
              [platform]: {
                ...state.previewStates[platform],
                isModalOpen: {
                  ...state.previewStates[platform].isModalOpen,
                  [mode]: nextOpen
                }
              }
            }
          };
        });
      },

      setIsExpanded: (platform, mode, isExpanded) => {
        set((state) => {
          const currentExpanded = state.previewStates[platform].isExpanded[mode] ?? false;
          const nextExpanded = resolveUpdater(currentExpanded, isExpanded);

          if (currentExpanded === nextExpanded) {
            return state;
          }

          return {
            previewStates: {
              ...state.previewStates,
              [platform]: {
                ...state.previewStates[platform],
                isExpanded: {
                  ...state.previewStates[platform].isExpanded,
                  [mode]: nextExpanded
                }
              }
            }
          };
        });
      },

      setIsMuted: (platform, mode, isMuted) => {
        set((state) => {
          const currentMuted = state.previewStates[platform].isMuted[mode] ?? false;
          const nextMuted = resolveUpdater(currentMuted, isMuted);

          if (currentMuted === nextMuted) {
            return state;
          }

          return {
            previewStates: {
              ...state.previewStates,
              [platform]: {
                ...state.previewStates[platform],
                isMuted: {
                  ...state.previewStates[platform].isMuted,
                  [mode]: nextMuted
                }
              }
            }
          };
        });
      },

      canPublish: () => get().content.trim().length > 0
    }),
    {
      name: 'post-builder',
      storage,
      partialize: (state) => ({
        content: state.content,
        activePlatform: state.activePlatform,
        platformModes: state.platformModes,
        platformContents: state.platformContents,
        previewStates: state.previewStates
      })
    }
  )
);

export default usePostBuilder;
