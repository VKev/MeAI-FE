import { useEffect } from 'react';
import ModelSelection from '@/components/workspace/common/ModelSelection';
import WorkspaceTooltip from './common/WorkspaceTooltip';
import { SocialTargetPicker } from '@/components/workspace/common/SocialTargetPicker';
import type { AiGenerationModel, Ratio, SocialPlatformSpec } from '@/routes/workspace/config';
import type { ImageGenerationConfig } from '@/routes/workspace/type';

interface WorkspaceImageSidebarProps {
  config: ImageGenerationConfig;
  models: readonly AiGenerationModel[];
  socialSpecs: Record<string, SocialPlatformSpec>;
  onConfigChange: (next: Partial<ImageGenerationConfig>) => void;
}

function getRatioBoxStyle(value: Ratio) {
  const [w, h] = value.split(':').map(Number);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return { width: '22px', height: '14px' };
  }

  const maxSize = 22;
  const scale = w >= h ? maxSize / w : maxSize / h;
  return {
    width: `${Math.round(w * scale)}px`,
    height: `${Math.round(h * scale)}px`
  };
}

export function WorkspaceImageSidebar({ config, models, socialSpecs, onConfigChange }: WorkspaceImageSidebarProps) {
  const supportedRatios = config.model.supportedRatios;
  const qualityOptions = config.model.supportedQualities;
  const hasSocialTargets = config.socialTargets.length > 0;

  useEffect(() => {
    if (models.length > 0 && !models.some((model) => model.id === config.model.id)) {
      const nextModel = models[0];
      onConfigChange({
        model: nextModel,
        ratio: nextModel.supportedRatios[0] ?? config.ratio,
        imageQuality: nextModel.supportedQualities[0] ?? config.imageQuality
      });
    }
  }, [config.imageQuality, config.model.id, config.ratio, models, onConfigChange]);

  // Auto-correct ratio if current one isn't supported by the selected model
  useEffect(() => {
    if (supportedRatios.length > 0 && !supportedRatios.includes(config.ratio)) {
      onConfigChange({ ratio: supportedRatios[0] });
    }
  }, [config.model.id, config.ratio, supportedRatios, onConfigChange]);

  useEffect(() => {
    if (
      config.model.supportsResolution &&
      qualityOptions.length > 0 &&
      !qualityOptions.includes(config.imageQuality)
    ) {
      onConfigChange({ imageQuality: qualityOptions[0] });
    }
  }, [config.imageQuality, config.model.id, config.model.supportsResolution, onConfigChange, qualityOptions]);

  return (
    <aside className='h-full w-80 p-4 overflow-hidden border-t-0 border-r border border-zinc-900 bg-zinc-950 overflow-y-auto'>
      <ModelSelection
        models={models}
        selectedModel={config.model}
        onSelectModel={(model) =>
          onConfigChange({
            model,
            ratio: model.supportedRatios.includes(config.ratio) ? config.ratio : (model.supportedRatios[0] ?? config.ratio),
            imageQuality:
              model.supportsResolution && model.supportedQualities.length > 0
                ? model.supportedQualities[0]
                : config.imageQuality
          })
        }
      />

      <div className='mb-2 flex flex-col gap-6 rounded-b-lg border border-t-0 border-slate-800 bg-slate-950 p-4 pt-6'>
        {/* Manual Dimension (disabled when social targets selected) */}
        <div className={`space-y-3 ${hasSocialTargets ? 'opacity-40 pointer-events-none' : ''}`}>
          <div className='flex items-center gap-2'>
            <label className='text-xs font-medium text-white'>Image Dimensions</label>
            <WorkspaceTooltip
              tooltipContent={<p>Aspect ratio of the source image. Disabled when social targets are selected.</p>}
            />
          </div>

          <div className='grid grid-cols-3 gap-2'>
            {supportedRatios.map((item) => {
              const isActive = config.ratio === item;

              return (
                <button
                  key={item}
                  type='button'
                  onClick={() => onConfigChange({ ratio: item })}
                  className={`cursor-pointer flex flex-col items-center justify-center gap-1.5 rounded-md border px-2 py-2.5 text-xs font-medium transition ${
                    isActive
                      ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                      : 'border-gray-800 bg-gray-950/40 text-gray-300 hover:border-gray-700'
                  }`}
                >
                  <span
                    className={`block rounded-xs border ${isActive ? 'border-purple-400' : 'border-gray-600'}`}
                    style={getRatioBoxStyle(item)}
                  />
                  <span>{item}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Social Targets (disables manual dimension when active) */}
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <label className='text-xs font-medium text-white'>Socials</label>
            <WorkspaceTooltip
              tooltipContent={
                <p>
                  Generate for multiple platforms at once. Source image is generated, then reframed via Ideogram V3 to
                  each target dimension.
                </p>
              }
            />
          </div>

          <SocialTargetPicker
            specs={socialSpecs}
            targets={config.socialTargets}
            onChange={(socialTargets) => onConfigChange({ socialTargets })}
          />
        </div>

        {config.model.supportsResolution && qualityOptions.length > 0 && (
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <label className='text-xs font-medium text-white'>Image Quality</label>
              <WorkspaceTooltip tooltipContent={<p>Resolution of the generated image</p>} />
            </div>

            <div className='grid grid-cols-3 gap-2'>
              {qualityOptions.map((quality) => {
                const isActive = config.imageQuality === quality;

                return (
                  <button
                    key={quality}
                    type='button'
                    onClick={() => onConfigChange({ imageQuality: quality })}
                    className={`cursor-pointer flex h-9 py-3 w-full items-center justify-center rounded-md border text-xs font-medium transition ${
                      isActive
                        ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                        : 'border-gray-800 bg-gray-950/40 text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    {quality}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
