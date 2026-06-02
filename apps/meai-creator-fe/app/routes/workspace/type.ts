import type { AiGenerationModel, Ratio, SocialTarget, VideoDimension, VideoGenerationType } from '@/routes/workspace/config';

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
  variant: string;
  generationType: VideoGenerationType;
  resolution: string;
  duration: number;
  generateAudio: boolean;
  returnLastFrame: boolean;
  webSearch: boolean;
};
