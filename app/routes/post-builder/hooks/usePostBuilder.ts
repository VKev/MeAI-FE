import { create } from 'zustand';

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
  selectedMediaIds: Partial<Record<PostBuilderMode, string[]>>;
  currentMediaIndex: Partial<Record<PostBuilderMode, number>>;
}

type PostBuilderStore = {
  content: string;
  activePlatform: PostBuilderPlatform;
  platformModes: Record<PostBuilderPlatform, PostBuilderMode>;
  platformContents: Record<PostBuilderPlatform, PlatformContent>;
  previewStates: Record<PostBuilderPlatform, PreviewState>;
  reset: () => void;
  setRawContent: (payload: ContentPayload) => void;
  setActivePlatform: (platform: PostBuilderPlatform) => void;
  setPlatformMode: (platform: PostBuilderPlatform, mode: PostBuilderMode) => void;
  setPreviewMode: (platform: PostBuilderPlatform, mode: PostBuilderMode) => void;
  setSelectedMediaIds: (platform: PostBuilderPlatform, mode: PostBuilderMode, ids: Updater<string[]>) => void;
  setCurrentMediaIndex: (platform: PostBuilderPlatform, mode: PostBuilderMode, index: Updater<number>) => void;
  canPublish: () => boolean;
};

const RECOMMENDED_SHORT_FORM_CHARS = 150;
const MAX_SHORT_FORM_CHARS = 300;

const createInitialModes = (): Record<PostBuilderPlatform, PostBuilderMode> => ({
  tiktok: 'video',
  facebook: 'post',
  instagram: 'post',
  thread: 'post'
});

const createInitialPlatformContents = (): Record<PostBuilderPlatform, PlatformContent> => ({
  tiktok: { text: '', html: '' },
  facebook: { text: '', html: '' },
  instagram: { text: '', html: '' },
  thread: { text: '', html: '' }
});

const createModeMap = <T>(modes: PostBuilderMode[], createValue: () => T): Partial<Record<PostBuilderMode, T>> =>
  modes.reduce<Partial<Record<PostBuilderMode, T>>>((acc, mode) => {
    acc[mode] = createValue();
    return acc;
  }, {});

const createPreviewState = (modes: PostBuilderMode[]): PreviewState => ({
  selectedMediaIds: createModeMap(modes, () => [] as string[]),
  currentMediaIndex: createModeMap(modes, () => 0)
});

const createInitialPreviewStates = (): Record<PostBuilderPlatform, PreviewState> => ({
  tiktok: createPreviewState(['video', 'image']),
  facebook: createPreviewState(['post', 'reel']),
  instagram: createPreviewState(['post', 'reel']),
  thread: createPreviewState(['post'])
});

export function getPreviewContentState({
  content,
  context
}: {
  content: string;
  context: PreviewContext;
}): PreviewContentState {
  const normalized = content.trim();
  const charCount = normalized.length;
  const shouldShowAlert = context.platform === 'tiktok' || context.mode === 'reel';

  if (!shouldShowAlert) {
    return {
      previewText: normalized,
      charCount,
      inlineAlert: null,
      isBlocked: false
    };
  }

  let inlineAlert: InlineContentAlert | null = null;
  if (charCount > MAX_SHORT_FORM_CHARS) {
    inlineAlert = {
      severity: 'warn',
      message: `Content exceeds ${MAX_SHORT_FORM_CHARS} characters. Consider shortening for reel/video format.`
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
    isBlocked: false
  };
}

const resolveUpdater = <T>(current: T, next: Updater<T>): T =>
  typeof next === 'function' ? (next as (prev: T) => T)(current) : next;

const areArraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const createInitialState = () => ({
  content: '',
  activePlatform: 'tiktok' as const,
  platformModes: createInitialModes(),
  platformContents: createInitialPlatformContents(),
  previewStates: createInitialPreviewStates()
});

const usePostBuilder = create<PostBuilderStore>()((set, get) => ({
  ...createInitialState(),

  reset: () => {
    set(createInitialState());
  },

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
    set((state) => ({
      platformModes: {
        ...state.platformModes,
        [platform]: mode
      }
    }));
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

  canPublish: () => get().content.trim().length > 0
}));

export default usePostBuilder;
