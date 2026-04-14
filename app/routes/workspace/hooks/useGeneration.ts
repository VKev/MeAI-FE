import { useCallback, useState } from 'react';
import { AI_MODELS } from '@/routes/workspace/config';
import type { ImageGenerationConfig, VideoGenerationConfig } from '@/routes/workspace/type';

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
