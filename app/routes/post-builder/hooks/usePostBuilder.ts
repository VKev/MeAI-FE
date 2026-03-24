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
  lineClampClass: 'line-clamp-4' | 'line-clamp-3' | '';
  shouldShowSeeMore: boolean;
  inlineAlert: InlineContentAlert | null;
  isBlocked: boolean;
}

type PostBuilderStore = {
  rawContent: string;
  content: string;
  activePlatform: PostBuilderPlatform;
  platformModes: Record<PostBuilderPlatform, PostBuilderMode>;
  expandedContentKeys: Record<string, boolean>;
  setRawContentDebounced: (value: string) => void;
  setActivePlatform: (platform: PostBuilderPlatform) => void;
  setPlatformMode: (platform: PostBuilderPlatform, mode: PostBuilderMode) => void;
  toggleContentExpanded: (context: PreviewContext) => void;
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

export function getPreviewContextKey(context: PreviewContext) {
  return `${context.platform}:${context.mode}`;
}

function isShortFormContext(context: PreviewContext) {
  return context.platform === 'tiktok' || context.mode === 'reel' || context.mode === 'video';
}

export function getPreviewContentState({
  content,
  context,
  expanded
}: {
  content: string;
  context: PreviewContext;
  expanded: boolean;
}): PreviewContentState {
  const normalized = content.trim();
  const charCount = normalized.length;
  const shortForm = isShortFormContext(context);
  const previewText = shortForm ? normalized.slice(0, MAX_SHORT_FORM_CHARS) : normalized;

  let inlineAlert: InlineContentAlert | null = null;
  if (shortForm && charCount > MAX_SHORT_FORM_CHARS) {
    inlineAlert = {
      severity: 'block',
      message: `Content exceeds ${MAX_SHORT_FORM_CHARS} characters for reel/video format.`
    };
  } else if (shortForm && charCount > RECOMMENDED_SHORT_FORM_CHARS) {
    inlineAlert = {
      severity: 'warn',
      message: `Content is long (${charCount} characters). Should keep <= ${RECOMMENDED_SHORT_FORM_CHARS} characters for platform compatibility.`
    };
  } else if (shortForm && charCount > 0) {
    inlineAlert = {
      severity: 'recommend',
      message: `Content is suitable. Recommended to keep <= ${RECOMMENDED_SHORT_FORM_CHARS} characters.`
    };
  }

  const clampClass = shortForm ? 'line-clamp-3' : 'line-clamp-4';
  const collapsedThreshold = shortForm ? 120 : 220;
  const shouldShowSeeMore = previewText.length > collapsedThreshold;

  return {
    previewText,
    charCount,
    lineClampClass: expanded ? '' : clampClass,
    shouldShowSeeMore,
    inlineAlert,
    isBlocked: shortForm && charCount > MAX_SHORT_FORM_CHARS
  };
}

const usePostBuilder = create<PostBuilderStore>()((set, get) => ({
  rawContent: '',
  content: '',
  activePlatform: 'tiktok',
  platformModes: initialModes,
  expandedContentKeys: {},
  setRawContentDebounced: (value) => {
    set({ rawContent: value });
    set({ content: value });
  },
  setActivePlatform: (platform) => set({ activePlatform: platform }),
  setPlatformMode: (platform, mode) => {
    set((state) => ({
      platformModes: {
        ...state.platformModes,
        [platform]: mode
      }
    }));
  },
  toggleContentExpanded: (context) => {
    const key = getPreviewContextKey(context);

    set((state) => ({
      expandedContentKeys: {
        ...state.expandedContentKeys,
        [key]: !state.expandedContentKeys[key]
      }
    }));
  },
  canPublish: () => get().rawContent.trim().length > 0
}));

export default usePostBuilder;
