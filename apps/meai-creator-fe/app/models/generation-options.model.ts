import type { AiGenerationModel, SocialPlatformSpec } from '@/routes/workspace/config';

export type GenerationModeOption = 'image' | 'video';

export type GenerationModelOption = {
  id: string;
  mode: GenerationModeOption;
  modelId: string;
  name: string;
  description: string | null;
  supportedRatios: string[];
  supportedQualities: string[];
  supportsResolution: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string | null;
};

export type ProviderGenerationModelOption = {
  provider: string;
  mode: GenerationModeOption;
  modelId: string;
  name: string;
  description: string;
  supportedRatios: string[];
  supportedQualities: string[];
  supportsResolution: boolean;
  sortOrder: number;
};

export type GenerationSocialPreset = {
  id: string;
  mode: GenerationModeOption;
  platform: string;
  label: string;
  contentType: string;
  contentLabel: string;
  supportedRatios: string[];
  defaultRatio: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string | null;
};

export type GenerationOptions = {
  models: GenerationModelOption[];
  socialPresets: GenerationSocialPreset[];
};

export type GenerationOptionsResponse = {
  value: GenerationOptions;
  isSuccess: boolean;
  isFailure: boolean;
  error: { code: string; description: string } | null;
};

export type GenerationModelOptionResponse = {
  value: GenerationModelOption;
  isSuccess: boolean;
  isFailure: boolean;
  error: { code: string; description: string } | null;
};

export type ProviderGenerationModelsResponse = {
  value: ProviderGenerationModelOption[];
  isSuccess: boolean;
  isFailure: boolean;
  error: { code: string; description: string } | null;
};

export type GenerationSocialPresetResponse = {
  value: GenerationSocialPreset;
  isSuccess: boolean;
  isFailure: boolean;
  error: { code: string; description: string } | null;
};

export type UpsertGenerationModelOptionPayload = {
  mode: GenerationModeOption;
  modelId: string;
  name: string;
  description?: string | null;
  supportedRatios: string[];
  supportedQualities: string[];
  supportsResolution: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type UpsertGenerationSocialPresetPayload = {
  mode: GenerationModeOption;
  platform: string;
  label: string;
  contentType: string;
  contentLabel: string;
  supportedRatios: string[];
  defaultRatio: string;
  isActive: boolean;
  sortOrder: number;
};

export function toAiGenerationModel(option: GenerationModelOption): AiGenerationModel {
  return {
    id: option.modelId,
    name: option.name,
    description: option.description ?? '',
    supportedRatios: option.supportedRatios,
    supportedQualities: option.supportedQualities,
    supportsResolution: option.supportsResolution
  };
}

export function socialPresetsToSpecs(presets: GenerationSocialPreset[]): Record<string, SocialPlatformSpec> {
  return presets.reduce<Record<string, SocialPlatformSpec>>((acc, preset) => {
    const current = acc[preset.platform] ?? { label: preset.label, types: [] };
    current.label = preset.label || current.label;
    current.types.push({
      type: preset.contentType,
      label: preset.contentLabel,
      supportedRatios: preset.supportedRatios,
      default: preset.defaultRatio
    });
    acc[preset.platform] = current;
    return acc;
  }, {});
}
