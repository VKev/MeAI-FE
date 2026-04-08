import type { AI_MODELS, ALL_RATIOS, IMAGE_QUALITY, OUTPUT_FORMAT, VIDEO_DIMENSIONS } from "@/routes/workspace/config";

export type GenerationMode = 'image' | 'video';

export type ImageGenerationConfig = {
  ratio: (typeof ALL_RATIOS)[number];
  imageQuality: (typeof IMAGE_QUALITY)[number];
  outputFormat: (typeof OUTPUT_FORMAT)[number];
  model: (typeof AI_MODELS)[number];
};

export type VideoGenerationConfig = {
  dimension: (typeof VIDEO_DIMENSIONS)[number];
  watermark: string;
  seed: string;
  model: (typeof AI_MODELS)[number];
};
