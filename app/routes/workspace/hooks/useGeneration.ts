import { useCallback, useState } from 'react';
import { AI_MODELS, ALL_RATIOS, IMAGE_QUALITY, OUTPUT_FORMAT, VIDEO_DIMENSIONS } from '@/routes/workspace/config';

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

export function useGeneration() {
  const [prompt, setPrompt] = useState('');
  const [imageConfig, setImageConfig] = useState<ImageGenerationConfig>({
    ratio: '2:3',
    imageQuality: '1K',
    outputFormat: 'png',
    model: AI_MODELS[0]
  });
  const [videoConfig, setVideoConfig] = useState<VideoGenerationConfig>({
    dimension: '16:9',
    watermark: '',
    seed: '',
    model: AI_MODELS[0]
  });

  const updateImageConfig = useCallback((next: Partial<ImageGenerationConfig>) => {
    setImageConfig((prev) => ({ ...prev, ...next }));
  }, []);

  const updateVideoConfig = useCallback((next: Partial<VideoGenerationConfig>) => {
    setVideoConfig((prev) => ({ ...prev, ...next }));
  }, []);

  return {
    prompt,
    setPrompt,
    imageConfig,
    videoConfig,
    updateImageConfig,
    updateVideoConfig
  };
}
