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

export type PlatformPublishStatus = 'published' | 'publishing' | 'unpublishing' | 'failed';

export interface PlatformPublishInfo {
  isPublished: boolean;
  status?: PlatformPublishStatus;
  externalContentId?: string | null;
  externalContentIdType?: string | null;
  destinationOwnerId?: string | null;
  socialMediaType?: string | null;
  // Needed by the analytics endpoint: `/api/Ai/posts/social/{socialMediaId}/platform-
  // posts/{platformPostId}/analytics`. Filled from the live PostPublication row that
  // recorded the successful publish.
  socialMediaId?: string | null;
  publishedAt?: string | null;
  externalUrl?: string | null;
}

export type PlatformPublishStateMap = Record<
  PostBuilderPlatform,
  Partial<Record<PostBuilderMode, PlatformPublishInfo>>
>;

export type PlatformContentsMap = Record<PostBuilderPlatform, Partial<Record<PostBuilderMode, PlatformContent>>>;

type PostBuilderStore = {
  content: string;
  activePlatform: PostBuilderPlatform;
  platformAvailability: Record<PostBuilderPlatform, boolean>;
  platformModes: Record<PostBuilderPlatform, PostBuilderMode>;
  platformContents: PlatformContentsMap;
  previewStates: Record<PostBuilderPlatform, PreviewState>;
  platformPublishStates: PlatformPublishStateMap;
  // True while a caption-generation request is in-flight. PostBuilderHeader uses this
  // to lock the Publish + Save Draft buttons, and ContentCreation's per-platform edit
  // controls gate on it too — generated text lands after the await resolves, so letting
  // the user publish mid-flight would publish stale content.
  isCaptionGenerating: boolean;
  reset: () => void;
  setRawContent: (payload: ContentPayload) => void;
  setPlatformContent: (platform: PostBuilderPlatform, mode: PostBuilderMode, payload: ContentPayload) => void;
  setActivePlatform: (platform: PostBuilderPlatform) => void;
  setPlatformAvailability: (platforms: PostBuilderPlatform[]) => void;
  setPlatformMode: (platform: PostBuilderPlatform, mode: PostBuilderMode) => void;
  setPreviewMode: (platform: PostBuilderPlatform, mode: PostBuilderMode) => void;
  setSelectedMediaIds: (platform: PostBuilderPlatform, mode: PostBuilderMode, ids: Updater<string[]>) => void;
  setCurrentMediaIndex: (platform: PostBuilderPlatform, mode: PostBuilderMode, index: Updater<number>) => void;
  setPlatformPublishStates: (states: Partial<PlatformPublishStateMap>) => void;
  setCaptionGenerating: (next: boolean) => void;
  isModePublished: (platform: PostBuilderPlatform, mode: PostBuilderMode) => boolean;
  canPublish: () => boolean;
};

const RECOMMENDED_SHORT_FORM_CHARS = 150;
const MAX_SHORT_FORM_CHARS = 300;

const createInitialModes = (): Record<PostBuilderPlatform, PostBuilderMode> => ({
  tiktok: 'image',
  facebook: 'post',
  instagram: 'post',
  thread: 'post'
});

const createInitialAvailability = (): Record<PostBuilderPlatform, boolean> => ({
  tiktok: true,
  facebook: true,
  instagram: true,
  thread: true
});

const emptyContent = (): PlatformContent => ({ text: '', html: '' });

const createInitialPlatformContents = (): PlatformContentsMap => ({
  tiktok: { video: emptyContent(), image: emptyContent() },
  facebook: { post: emptyContent(), reel: emptyContent() },
  instagram: { post: emptyContent(), reel: emptyContent() },
  thread: { post: emptyContent() }
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

const createInitialPublishStates = (): PlatformPublishStateMap => ({
  tiktok: {},
  facebook: {},
  instagram: {},
  thread: {}
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
  platformAvailability: createInitialAvailability(),
  platformModes: createInitialModes(),
  platformContents: createInitialPlatformContents(),
  previewStates: createInitialPreviewStates(),
  platformPublishStates: createInitialPublishStates(),
  isCaptionGenerating: false
});

const usePostBuilder = create<PostBuilderStore>()((set, get) => ({
  ...createInitialState(),

  reset: () => {
    set(createInitialState());
  },

  setRawContent: ({ content, htmlContent }: ContentPayload) => {
    set((state) => {
      const platform = state.activePlatform;
      const mode = state.platformModes[platform];
      return {
        content,
        platformContents: {
          ...state.platformContents,
          [platform]: {
            ...state.platformContents[platform],
            [mode]: { text: content, html: htmlContent }
          }
        }
      };
    });
  },

  setPlatformContent: (platform, mode, { content, htmlContent }) => {
    set((state) => {
      const isActive = state.activePlatform === platform && state.platformModes[platform] === mode;
      return {
        ...(isActive ? { content } : {}),
        platformContents: {
          ...state.platformContents,
          [platform]: {
            ...state.platformContents[platform],
            [mode]: { text: content, html: htmlContent }
          }
        }
      };
    });
  },

  setActivePlatform: (platform) => {
    set((state) => {
      const mode = state.platformModes[platform];
      return {
        activePlatform: platform,
        content: state.platformContents[platform]?.[mode]?.text ?? ''
      };
    });
  },

  setPlatformAvailability: (platforms) => {
    set((state) => {
      const next = { ...state.platformAvailability };
      const enabled = new Set(platforms);
      (Object.keys(next) as PostBuilderPlatform[]).forEach((platform) => {
        next[platform] = enabled.has(platform);
      });
      return { platformAvailability: next };
    });
  },

  setPlatformMode: (platform, mode) => {
    set((state) => {
      const isActive = state.activePlatform === platform;
      return {
        platformModes: {
          ...state.platformModes,
          [platform]: mode
        },
        ...(isActive ? { content: state.platformContents[platform]?.[mode]?.text ?? '' } : {})
      };
    });
  },

  setPreviewMode: (platform, mode) => {
    set((state) => {
      const isActive = state.activePlatform === platform;
      return {
        platformModes: {
          ...state.platformModes,
          [platform]: mode
        },
        ...(isActive ? { content: state.platformContents[platform]?.[mode]?.text ?? '' } : {})
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

  setPlatformPublishStates: (states) => {
    set((current) => {
      const next: PlatformPublishStateMap = { ...current.platformPublishStates };
      for (const key of Object.keys(states) as PostBuilderPlatform[]) {
        // REPLACE the mode sub-map entirely (not merge) so stale entries get cleared when
        // a platform's current truth is empty — e.g. an unpublish completing returns the
        // post to draft and we want the previously-stored "unpublishing" state to vanish.
        next[key] = states[key] ?? {};
      }
      return { platformPublishStates: next };
    });
  },

  setCaptionGenerating: (next) => set({ isCaptionGenerating: next }),

  isModePublished: (platform, mode) =>
    get().platformPublishStates[platform]?.[mode]?.isPublished === true,

  canPublish: () => {
    const state = get();
    if (state.content.trim().length === 0) return false;
    // Publish is available if at least one platform's currently-selected mode is still
    // free (not already published AND not currently publishing).
    const platforms: PostBuilderPlatform[] = ['tiktok', 'facebook', 'instagram', 'thread'];
    return platforms.some((p) => {
      const activeMode = state.platformModes[p];
      const info = state.platformPublishStates[p]?.[activeMode];
      return info?.status !== 'published' && info?.status !== 'publishing';
    });
  }
}));

export default usePostBuilder;
