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

interface ContentPayload {
  content: string;
  htmlContent: string;
}

type PostBuilderStore = {
  rawHTMLContent: string;
  content: string;
  activePlatform: PostBuilderPlatform;
  platformModes: Record<PostBuilderPlatform, PostBuilderMode>;
  setRawContent: (payload: ContentPayload) => void;
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

const usePostBuilder = create<PostBuilderStore>()((set, get) => ({
  rawHTMLContent: '',
  content: '',
  activePlatform: 'tiktok',
  platformModes: initialModes,

  setRawContent: ({ content, htmlContent }: ContentPayload) => {
    set({ rawHTMLContent: htmlContent });
    set({ content: content });
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

  canPublish: () => get().content.trim().length > 0
}));

export default usePostBuilder;
