import type { AiGenerationModel, Ratio, SocialTarget, VideoDimension } from '@/routes/workspace/config';

export type GenerationMode = 'image' | 'video';

export type ImageGenerationConfig = {
  ratio: Ratio;
  imageQuality: string;
  model: AiGenerationModel;
  socialTargets: SocialTarget[];
};

export type VideoGenerationConfig = {
  dimension: VideoDimension;
  watermark: string;
  model: AiGenerationModel;
};
