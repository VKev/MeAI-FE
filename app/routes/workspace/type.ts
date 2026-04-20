import type { AI_IMAGE_MODELS, AI_VIDEO_MODELS, ALL_RATIOS, IMAGE_QUALITY, SocialTarget, VIDEO_DIMENSIONS } from '@/routes/workspace/config';

export type GenerationMode = 'image' | 'video';

export type ImageGenerationConfig = {
  ratio: (typeof ALL_RATIOS)[number];
  imageQuality: (typeof IMAGE_QUALITY)[number];
  model: (typeof AI_IMAGE_MODELS)[number];
  socialTargets: SocialTarget[];
};

export type VideoGenerationConfig = {
  dimension: (typeof VIDEO_DIMENSIONS)[number];
  watermark: string;
  model: (typeof AI_VIDEO_MODELS)[number];
};
