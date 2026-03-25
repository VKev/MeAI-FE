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

type PostBuilderStore = {
  rawContent: string;
  content: string;
  activePlatform: PostBuilderPlatform;
  platformModes: Record<PostBuilderPlatform, PostBuilderMode>;
  setRawContentDebounced: (value: string) => void;
  setActivePlatform: (platform: PostBuilderPlatform) => void;
  setPlatformMode: (platform: PostBuilderPlatform, mode: PostBuilderMode) => void;
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



function isShortFormContext(context: PreviewContext) {
  return context.platform === 'tiktok' || context.mode === 'reel' || context.mode === 'video';
}

export function getPreviewContentState({
  content,
  context
}: {
  content: string;
  context: PreviewContext;
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

  return {
    previewText,
    charCount,
    inlineAlert,
    isBlocked: shortForm && charCount > MAX_SHORT_FORM_CHARS
  };
}

const usePostBuilder = create<PostBuilderStore>()((set, get) => ({
  rawContent: '',
  content: '',
  activePlatform: 'tiktok',
  platformModes: initialModes,
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
  canPublish: () => get().rawContent.trim().length > 0
}));

export default usePostBuilder;
