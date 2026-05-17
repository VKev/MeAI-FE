import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AI_IMAGE_MODELS, AI_VIDEO_MODELS } from '@/routes/workspace/config';
import type { ImageGenerationConfig, VideoGenerationConfig } from '@/routes/workspace/type';
import { fetchAiConfig } from '@/services/client/config.client';

function findImageModel(modelId: string | null | undefined) {
  if (!modelId) return null;
  return AI_IMAGE_MODELS.find((m) => m.id === modelId) ?? null;
}

function findVideoModel(modelId: string | null | undefined) {
  if (!modelId) return null;
  return AI_VIDEO_MODELS.find((m) => m.id === modelId) ?? null;
}

function isValidRatio(ratio: string | null | undefined): ratio is ImageGenerationConfig['ratio'] {
  if (!ratio) return false;
  return ['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'].includes(ratio);
}

function isValidDimension(dim: string | null | undefined): dim is VideoGenerationConfig['dimension'] {
  if (!dim) return false;
  return ['9:16', '16:9', 'auto'].includes(dim);
}

export function useGeneration() {
  const [prompt, setPrompt] = useState('');
  const [imageConfig, setImageConfig] = useState<ImageGenerationConfig>({
    ratio: '1:1',
    imageQuality: '1K',
    model: AI_IMAGE_MODELS[0],
    socialTargets: []
  });
  const [videoConfig, setVideoConfig] = useState<VideoGenerationConfig>({
    dimension: '16:9',
    watermark: '',
    model: AI_VIDEO_MODELS[0]
  });

  const { data: configData } = useQuery({
    queryKey: ['ai-config'],
    queryFn: fetchAiConfig,
    staleTime: 5 * 60_000
  });

  const [configApplied, setConfigApplied] = useState(false);
  useEffect(() => {
    if (configApplied || !configData?.isSuccess || !configData.value) return;

    const beConfig = configData.value;
    const beImageModel = findImageModel(beConfig.chatModel);
    const beVideoModel = findVideoModel(beConfig.chatModel);

    setImageConfig((prev) => ({
      ...prev,
      ...(isValidRatio(beConfig.mediaAspectRatio) ? { ratio: beConfig.mediaAspectRatio } : {}),
      ...(beImageModel ? { model: beImageModel } : {})
    }));

    setVideoConfig((prev) => ({
      ...prev,
      ...(isValidDimension(beConfig.mediaAspectRatio) ? { dimension: beConfig.mediaAspectRatio } : {}),
      ...(beVideoModel ? { model: beVideoModel } : {})
    }));

    setConfigApplied(true);
  }, [configData, configApplied]);

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
