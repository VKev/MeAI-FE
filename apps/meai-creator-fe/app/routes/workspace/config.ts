export const ALL_RATIOS = ['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'] as const;

export type Ratio = string;

export const VIDEO_DIMENSIONS = ['9:16', '16:9', 'auto'] as const;
export type VideoDimension = string;

export const IMAGE_QUALITY = ['1K', '2K', '4K'] as const;
export const SIDEBAR_RATIOS = ['2:3', '1:1', '16:9', 'Custom'] as const;

export type AiGenerationModel = {
  id: string;
  name: string;
  description: string;
  supportedRatios: readonly Ratio[];
  supportedQualities: readonly string[];
  supportsResolution: boolean;
};

// Fallback catalog used while the backend catalog is loading or unavailable.
const NANO_BANANA_RATIOS: readonly Ratio[] = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
const FLUX_RATIOS: readonly Ratio[] = ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3'];
const GROK_RATIOS: readonly Ratio[] = ['2:3', '3:2', '1:1', '16:9', '9:16'];
const IDEOGRAM_RATIOS: readonly Ratio[] = ['1:1', '4:3', '3:4', '16:9', '9:16'];
const VEO_DIMENSIONS: readonly VideoDimension[] = ['16:9', '9:16', 'auto'];
const GROK_15_VIDEO_DIMENSIONS: readonly VideoDimension[] = ['auto', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'];
const SEEDANCE_2_DIMENSIONS: readonly VideoDimension[] = ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'];

export const AI_IMAGE_MODELS: readonly AiGenerationModel[] = [
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    description: 'Google Gemini 3 Pro - consistency & infographics',
    supportedRatios: NANO_BANANA_RATIOS,
    supportedQualities: IMAGE_QUALITY,
    supportsResolution: true
  },
  {
    id: 'grok-imagine/text-to-image',
    name: 'Grok Imagine',
    description: 'xAI - photorealistic images',
    supportedRatios: GROK_RATIOS,
    supportedQualities: [],
    supportsResolution: false
  },
  {
    id: 'ideogram/v3-text-to-image',
    name: 'Ideogram V3',
    description: 'Creative generation with character consistency',
    supportedRatios: IDEOGRAM_RATIOS,
    supportedQualities: [],
    supportsResolution: false
  },
  {
    id: 'flux-2/pro-text-to-image',
    name: 'Flux 2 Pro',
    description: 'Advanced text-to-image generation',
    supportedRatios: FLUX_RATIOS,
    supportedQualities: IMAGE_QUALITY,
    supportsResolution: true
  }
] as const;

export const AI_VIDEO_MODELS: readonly AiGenerationModel[] = [
  {
    id: 'gemini-omni-video',
    name: 'Gemini Omni Video',
    description: 'Google multimodal video generation',
    supportedRatios: ['16:9', '9:16'],
    supportedQualities: ['720p', '1080p', '4k'],
    supportsResolution: true
  },
  {
    id: 'grok-imagine-video-1-5-preview',
    name: 'Grok Imagine Video 1.5 Preview',
    description: 'xAI video generation with optional image guidance',
    supportedRatios: GROK_15_VIDEO_DIMENSIONS,
    supportedQualities: ['480p', '720p'],
    supportsResolution: true
  },
  {
    id: 'veo-3-1',
    name: 'Veo 3.1',
    description: 'Google Veo 3.1 video generation with Lite, Fast, and Quality tiers',
    supportedRatios: VEO_DIMENSIONS,
    supportedQualities: ['lite', 'fast', 'quality'],
    supportsResolution: true
  },
  {
    id: 'bytedance/seedance-2',
    name: 'Seedance 2.0',
    description: 'ByteDance Seedance 2 multimodal video generation',
    supportedRatios: SEEDANCE_2_DIMENSIONS,
    supportedQualities: ['480p', '720p', '1080p'],
    supportsResolution: true
  }
] as const;

export type VideoGenerationType = 'FIRST_AND_LAST_FRAMES_2_VIDEO' | 'REFERENCE_2_VIDEO';

export type VideoReferenceInputOption = {
  generationType: VideoGenerationType;
  label: string;
  description: string;
  maxSelected: number;
  minSelected?: number;
  itemLabels?: readonly string[];
  itemLabelPrefix?: string;
};

export type VideoModelSettings = {
  generationType: VideoGenerationType;
  resolution: string;
  duration: number;
  generateAudio: boolean;
  returnLastFrame: boolean;
  webSearch: boolean;
};

const REFERENCE_IMAGES: VideoReferenceInputOption = {
  generationType: 'REFERENCE_2_VIDEO',
  label: 'Reference images',
  description: 'Add images that guide the visual style and subject consistency.',
  maxSelected: 3,
  itemLabelPrefix: 'Reference'
};

const VIDEO_REFERENCE_OPTIONS: Record<string, readonly VideoReferenceInputOption[]> = {
  'gemini-omni-video': [
    {
      ...REFERENCE_IMAGES,
      description: 'Add up to 7 visual references for Gemini Omni Video.',
      maxSelected: 7
    }
  ],
  'grok-imagine-video-1-5-preview': [
    {
      generationType: 'REFERENCE_2_VIDEO',
      label: 'Source image',
      description: 'Grok Imagine Video 1.5 animates one source image.',
      minSelected: 1,
      maxSelected: 1,
      itemLabels: ['Source']
    }
  ],
  'veo-3-1': [
    {
      generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO',
      label: 'Start & end frames',
      description: 'Use one start frame or add an end frame for an exact transition.',
      maxSelected: 2,
      itemLabels: ['Start', 'End']
    },
    {
      ...REFERENCE_IMAGES,
      description: 'Use up to 3 material images. Veo automatically uses the Fast tier for this mode.'
    }
  ],
  'bytedance/seedance-2': [
    {
      generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO',
      label: 'Start & end frames',
      description: 'Use one start frame or two exact frames for a controlled transition.',
      maxSelected: 2,
      itemLabels: ['Start', 'End']
    },
    {
      ...REFERENCE_IMAGES,
      description: 'Use up to 9 multimodal reference images. This cannot be mixed with exact frames.',
      maxSelected: 9
    }
  ]
};

export function getVideoReferenceOptions(modelId: string) {
  return VIDEO_REFERENCE_OPTIONS[modelId] ?? [REFERENCE_IMAGES];
}

export function getVideoReferenceOption(modelId: string, generationType: string) {
  const options = getVideoReferenceOptions(modelId);
  return options.find((option) => option.generationType === generationType) ?? options[0];
}

export function getDefaultVideoModelSettings(modelId: string): VideoModelSettings {
  const generationType = getVideoReferenceOptions(modelId)[0].generationType;

  if (modelId === 'grok-imagine-video-1-5-preview') {
    return { generationType, resolution: '480p', duration: 8, generateAudio: true, returnLastFrame: false, webSearch: false };
  }

  if (modelId === 'bytedance/seedance-2') {
    return { generationType, resolution: '720p', duration: 5, generateAudio: false, returnLastFrame: false, webSearch: false };
  }

  return { generationType, resolution: '720p', duration: 4, generateAudio: false, returnLastFrame: false, webSearch: false };
}

export function getVideoResolutionOptions(modelId: string) {
  if (modelId === 'gemini-omni-video') return ['720p', '1080p', '4k'] as const;
  if (modelId === 'grok-imagine-video-1-5-preview') return ['480p', '720p'] as const;
  if (modelId === 'bytedance/seedance-2') return ['480p', '720p', '1080p'] as const;
  return [] as const;
}

export function getVideoDurationOptions(modelId: string) {
  if (modelId === 'gemini-omni-video') return [4, 6, 8, 10] as const;
  return [] as const;
}

export function getVideoDurationRange(modelId: string) {
  if (modelId === 'grok-imagine-video-1-5-preview') return { min: 1, max: 15 };
  if (modelId === 'bytedance/seedance-2') return { min: 4, max: 15 };
  return null;
}

export function getVideoPricingInput(modelId: string, variant: string, resolution: string, duration: number) {
  if (modelId === 'gemini-omni-video') {
    return { variant: `${resolution}:${duration}s`, quantity: 1 };
  }

  if (modelId === 'grok-imagine-video-1-5-preview') {
    return { variant: `${resolution}:${duration}s`, quantity: 1 };
  }

  if (modelId === 'bytedance/seedance-2') {
    return { variant: resolution, quantity: duration };
  }

  return { variant: variant || null, quantity: 1 };
}

export const AI_MODELS = AI_IMAGE_MODELS;

export type SocialPlatform = string;
export type SocialContentType = string;

export type SocialPlatformSpec = {
  label: string;
  types: Array<{ type: SocialContentType; label: string; supportedRatios: readonly Ratio[]; default: Ratio }>;
};

export const SOCIAL_PLATFORM_SPECS: Record<SocialPlatform, SocialPlatformSpec> = {
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
