import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AI_IMAGE_MODELS,
  AI_VIDEO_MODELS,
  SOCIAL_PLATFORM_SPECS,
  type AiGenerationModel
} from '@/routes/workspace/config';
import {
  socialPresetsToSpecs,
  toAiGenerationModel,
  type GenerationModelOption,
  type GenerationSocialPreset
} from '@/models/generation-options.model';
import type { ImageGenerationConfig, VideoGenerationConfig } from '@/routes/workspace/type';
import { fetchAiConfig } from '@/services/client/config.client';
import { fetchGenerationOptions } from '@/services/client/generation-options.client';

function findModel(models: readonly AiGenerationModel[], modelId: string | null | undefined) {
  if (!modelId) return null;
  return models.find((m) => m.id === modelId) ?? null;
}

function activeSortedOptions<T extends { isActive: boolean; sortOrder: number }>(items: T[] | undefined) {
  return [...(items ?? [])].filter((item) => item.isActive).sort((left, right) => left.sortOrder - right.sortOrder);
}

function getModels(
  options: GenerationModelOption[] | undefined,
  mode: 'image' | 'video',
  fallback: readonly AiGenerationModel[]
) {
  const models = activeSortedOptions(options?.filter((option) => option.mode === mode)).map(toAiGenerationModel);
  return models.length > 0 ? models : fallback;
}

function getSocialPresets(options: GenerationSocialPreset[] | undefined, mode: 'image' | 'video') {
  return activeSortedOptions(options?.filter((option) => option.mode === mode));
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

  const { data: configData, isError: isConfigError } = useQuery({
    queryKey: ['ai-config'],
    queryFn: fetchAiConfig,
    staleTime: 5 * 60_000
  });

  const {
    data: generationOptionsData,
    isError: isGenerationOptionsError
  } = useQuery({
    queryKey: ['generation-options'],
    queryFn: ({ signal }) => fetchGenerationOptions(signal),
    staleTime: 0
  });

  const imageModels = useMemo(
    () => getModels(generationOptionsData?.value?.models, 'image', AI_IMAGE_MODELS),
    [generationOptionsData]
  );

  const videoModels = useMemo(
    () => getModels(generationOptionsData?.value?.models, 'video', AI_VIDEO_MODELS),
    [generationOptionsData]
  );

  const imageSocialSpecs = useMemo(() => {
    const presets = getSocialPresets(generationOptionsData?.value?.socialPresets, 'image');
    return presets.length > 0 ? socialPresetsToSpecs(presets) : SOCIAL_PLATFORM_SPECS;
  }, [generationOptionsData]);

  const videoSocialPresets = useMemo(
    () => getSocialPresets(generationOptionsData?.value?.socialPresets, 'video'),
    [generationOptionsData]
  );

  const [configApplied, setConfigApplied] = useState(false);
  useEffect(() => {
    const configReady = configData !== undefined || isConfigError;
    const optionsReady = generationOptionsData !== undefined || isGenerationOptionsError;
    if (configApplied || !configReady || !optionsReady || imageModels.length === 0 || videoModels.length === 0) return;

    const beConfig = configData?.isSuccess ? configData.value : null;
    const beImageModel = findModel(imageModels, beConfig?.chatModel);
    const beVideoModel = findModel(videoModels, beConfig?.chatModel);

    setImageConfig((prev) => {
      const nextModel = beImageModel ?? imageModels[0] ?? prev.model;
      return {
        ...prev,
        ratio:
          beConfig?.mediaAspectRatio && nextModel.supportedRatios.includes(beConfig.mediaAspectRatio)
            ? beConfig.mediaAspectRatio
            : nextModel.supportedRatios[0] ?? prev.ratio,
        imageQuality:
          nextModel.supportsResolution && nextModel.supportedQualities.length > 0
            ? nextModel.supportedQualities[0]
            : prev.imageQuality,
        model: nextModel
      };
    });

    setVideoConfig((prev) => {
      const nextModel = beVideoModel ?? videoModels[0] ?? prev.model;
      return {
        ...prev,
        dimension:
          beConfig?.mediaAspectRatio && nextModel.supportedRatios.includes(beConfig.mediaAspectRatio)
            ? beConfig.mediaAspectRatio
            : nextModel.supportedRatios[0] ?? prev.dimension,
        model: nextModel
      };
    });

    setConfigApplied(true);
  }, [
    configData,
    configApplied,
    generationOptionsData,
    imageModels,
    isConfigError,
    isGenerationOptionsError,
    videoModels
  ]);

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
    imageModels,
    videoModels,
    imageSocialSpecs,
    videoSocialPresets,
    updateImageConfig,
    updateVideoConfig
  };
}
