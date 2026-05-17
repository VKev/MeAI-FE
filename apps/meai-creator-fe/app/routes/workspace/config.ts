export const ALL_RATIOS = ['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'] as const;

export type Ratio = (typeof ALL_RATIOS)[number];

export const VIDEO_DIMENSIONS = ['9:16', '16:9', 'auto'] as const;
export type VideoDimension = (typeof VIDEO_DIMENSIONS)[number];

export const IMAGE_QUALITY = ['1K', '2K', '4K'] as const;
export const SIDEBAR_RATIOS = ['2:3', '1:1', '16:9', 'Custom'] as const;

// Per-model supported aspect ratios (based on Kie API docs)
const NANO_BANANA_RATIOS: readonly Ratio[] = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
const FLUX_RATIOS: readonly Ratio[] = ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3'];
const GROK_RATIOS: readonly Ratio[] = ['2:3', '3:2', '1:1', '16:9', '9:16'];
const IDEOGRAM_RATIOS: readonly Ratio[] = ['1:1', '4:3', '3:4', '16:9', '9:16'];

// Veo models all support 16:9, 9:16, auto
const VEO_DIMENSIONS: readonly VideoDimension[] = ['16:9', '9:16', 'auto'];

export const AI_IMAGE_MODELS = [
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    description: 'Google Gemini 3 Pro — consistency & infographics',
    supportedRatios: NANO_BANANA_RATIOS,
    supportsResolution: true
  },
  {
    id: 'grok-imagine/text-to-image',
    name: 'Grok Imagine',
    description: 'xAI — photorealistic images',
    supportedRatios: GROK_RATIOS,
    supportsResolution: false
  },
  {
    id: 'ideogram/v3-text-to-image',
    name: 'Ideogram V3',
    description: 'Creative generation with character consistency',
    supportedRatios: IDEOGRAM_RATIOS,
    supportsResolution: false
  },
  {
    id: 'flux-2/pro-text-to-image',
    name: 'Flux 2 Pro',
    description: 'Advanced text-to-image generation',
    supportedRatios: FLUX_RATIOS,
    supportsResolution: true
  }
] as const;

export const AI_VIDEO_MODELS = [
  {
    id: 'veo3_fast',
    name: 'Veo 3.1 Fast',
    description: 'Google — fast video generation',
    supportedDimensions: VEO_DIMENSIONS
  },
  {
    id: 'veo3',
    name: 'Veo 3.1 Quality',
    description: 'Google — highest fidelity video',
    supportedDimensions: VEO_DIMENSIONS
  },
  {
    id: 'veo3_lite',
    name: 'Veo 3.1 Lite',
    description: 'Google — cost-effective for high volume',
    supportedDimensions: VEO_DIMENSIONS
  }
] as const;

// Legacy alias for backward compatibility
export const AI_MODELS = AI_IMAGE_MODELS;

// ---------------------------------------------------------------------------
// Social target config (for multi-platform image generation)
// ---------------------------------------------------------------------------

export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'threads';
export type SocialContentType = 'post' | 'reel';

// Per-platform supported content types and their allowed image dimensions
// Dimensions limited to Ideogram V3 Reframe outputs
export const SOCIAL_PLATFORM_SPECS: Record<
  SocialPlatform,
  {
    label: string;
    types: Array<{ type: SocialContentType; label: string; supportedRatios: readonly Ratio[]; default: Ratio }>;
  }
> = {
  facebook: {
    label: 'Facebook',
    types: [
      { type: 'post', label: 'Post', supportedRatios: ['1:1', '16:9'], default: '1:1' },
      { type: 'reel', label: 'Reel', supportedRatios: ['9:16'], default: '9:16' }
    ]
  },
  instagram: {
    label: 'Instagram',
    types: [
      { type: 'post', label: 'Post', supportedRatios: ['1:1', '4:5'], default: '1:1' },
      { type: 'reel', label: 'Reel', supportedRatios: ['9:16'], default: '9:16' }
    ]
  },
  tiktok: {
    label: 'TikTok',
    types: [{ type: 'reel', label: 'Reel', supportedRatios: ['9:16'], default: '9:16' }]
  },
  threads: {
    label: 'Threads',
    types: [{ type: 'post', label: 'Post', supportedRatios: ['1:1', '16:9'], default: '1:1' }]
  }
};

export type SocialTarget = {
  platform: SocialPlatform;
  type: SocialContentType;
  ratio: Ratio;
};
