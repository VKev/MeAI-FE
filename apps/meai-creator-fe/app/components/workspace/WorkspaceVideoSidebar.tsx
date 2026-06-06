import { useEffect } from 'react';
import { Droplet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  getDefaultVideoModelSettings,
  getVideoDurationOptions,
  getVideoResolutionOptions,
  type AiGenerationModel
} from '@/routes/workspace/config';
import ModelSelection from '@/components/workspace/common/ModelSelection';
import WorkspaceTooltip from './common/WorkspaceTooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { GenerationSocialPreset } from '@/models/generation-options.model';
import type { VideoGenerationConfig } from '@/routes/workspace/type';

interface WorkspaceVideoSidebarProps {
  config: VideoGenerationConfig;
  models: readonly AiGenerationModel[];
  socialPresets: GenerationSocialPreset[];
  onConfigChange: (next: Partial<VideoGenerationConfig>) => void;
}

const getDefaultTier = (model: AiGenerationModel) =>
  model.id === 'veo-3-1'
    ? model.supportedQualities.includes('fast')
      ? 'fast'
      : (model.supportedQualities[0] ?? '')
    : '';

export function WorkspaceVideoSidebar({ config, models, socialPresets, onConfigChange }: WorkspaceVideoSidebarProps) {
  const supportedDimensions = config.model.supportedRatios;
  const tierOptions = config.model.id === 'veo-3-1' ? config.model.supportedQualities : [];
  const resolutionOptions = getVideoResolutionOptions(config.model.id);
  const durationOptions = getVideoDurationOptions(config.model.id);
  const isSeedance2 = config.model.id === 'bytedance/seedance-2';
  const fixedDuration = config.model.id === 'veo-3-1' ? 8 : null;

  useEffect(() => {
    if (models.length > 0 && !models.some((model) => model.id === config.model.id)) {
      const nextModel = models[0];
      onConfigChange({
        model: nextModel,
        dimension: nextModel.supportedRatios[0] ?? config.dimension,
        variant: getDefaultTier(nextModel),
        ...getDefaultVideoModelSettings(nextModel.id)
      });
    }
  }, [config.dimension, config.model.id, models, onConfigChange]);

  // Auto-correct dimension if current one isn't supported by selected model
  useEffect(() => {
    if (supportedDimensions.length > 0 && !supportedDimensions.includes(config.dimension)) {
      onConfigChange({ dimension: supportedDimensions[0] });
    }
  }, [config.model.id, config.dimension, supportedDimensions, onConfigChange]);

  useEffect(() => {
    if (tierOptions.length > 0 && !tierOptions.includes(config.variant)) {
      onConfigChange({ variant: getDefaultTier(config.model) });
    }
  }, [config.model, config.variant, onConfigChange, tierOptions]);

  const visibleSocialPresets = socialPresets.filter((preset) => supportedDimensions.includes(preset.defaultRatio));
  return (
    <aside className='h-full w-80 shrink-0 overflow-x-hidden overflow-y-auto border border-r border-t-0 border-zinc-900 bg-zinc-950 p-4'>
      <ModelSelection
        models={models}
        selectedModel={config.model}
        onSelectModel={(model) =>
          onConfigChange({
            model,
            dimension: model.supportedRatios.includes(config.dimension)
              ? config.dimension
              : (model.supportedRatios[0] ?? config.dimension),
            variant: getDefaultTier(model),
            ...getDefaultVideoModelSettings(model.id)
          })
        }
      />

      <div className='mb-2 flex flex-col gap-6 rounded-b-lg border border-t-0 border-slate-800 bg-slate-950 p-4 pt-6'>
        {/* Video Dimension */}
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <label className='text-xs font-medium text-white'>Video Dimension</label>
            <WorkspaceTooltip tooltipContent={<p>Determines the aspect ratio of the generated video</p>} />
          </div>

          <div className='grid grid-cols-3 gap-2'>
            {supportedDimensions.map((dimension) => {
              const isActive = config.dimension === dimension;

              return (
                <button
                  key={dimension}
                  type='button'
                  onClick={() => onConfigChange({ dimension })}
                  className={`cursor-pointer flex h-9 w-full items-center justify-center rounded-md border text-xs font-medium transition ${
                    isActive
                      ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                      : 'border-gray-800 bg-gray-950/40 text-gray-300 hover:border-gray-700'
                  }`}
                >
                  {dimension === 'auto' ? 'Auto' : dimension}
                </button>
              );
            })}
          </div>

          {visibleSocialPresets.length > 0 && (
            <div className='space-y-2'>
              <span className='text-xs font-medium text-gray-400'>Socials</span>
              <div className='grid grid-cols-2 gap-2'>
                {visibleSocialPresets.map((item) => {
                  const isActive = config.dimension === item.defaultRatio;

                  return (
                    <button
                      key={`${item.platform}-${item.contentType}-${item.defaultRatio}`}
                      type='button'
                      onClick={() => onConfigChange({ dimension: item.defaultRatio })}
                      className={`flex h-9 w-full items-center justify-center rounded-md border px-2 text-xs font-medium transition ${
                        isActive
                          ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                          : 'border-gray-800 bg-gray-950/40 text-gray-300 hover:border-gray-700'
                      }`}
                    >
                      {item.label} ({item.defaultRatio})
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {tierOptions.length > 0 && (
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <label className='text-xs font-medium text-white'>Veo Tier</label>
              <WorkspaceTooltip tooltipContent={<p>Controls Veo 3.1 generation cost and output fidelity</p>} />
            </div>

            <div className='grid grid-cols-3 gap-2'>
              {tierOptions.map((tier) => {
                const isActive = config.variant === tier;

                return (
                  <button
                    key={tier}
                    type='button'
                    onClick={() =>
                      onConfigChange({
                        variant: tier,
                        ...(tier !== 'fast' && config.generationType === 'REFERENCE_2_VIDEO'
                          ? { generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO' as const }
                          : {})
                      })
                    }
                    className={`cursor-pointer flex h-9 w-full items-center justify-center rounded-md border text-xs font-medium capitalize transition ${
                      isActive
                        ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                        : 'border-gray-800 bg-gray-950/40 text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    {tier}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {resolutionOptions.length > 0 && (
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <label className='text-xs font-medium text-white'>Resolution</label>
              <WorkspaceTooltip tooltipContent={<p>Changes output resolution and estimated generation cost.</p>} />
            </div>

            <div className={`grid gap-2 ${resolutionOptions.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {resolutionOptions.map((resolution) => (
                <button
                  key={resolution}
                  type='button'
                  onClick={() => onConfigChange({ resolution })}
                  className={`cursor-pointer flex h-9 w-full items-center justify-center rounded-md border text-xs font-medium transition ${
                    config.resolution === resolution
                      ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                      : 'border-gray-800 bg-gray-950/40 text-gray-300 hover:border-gray-700'
                  }`}
                >
                  {resolution}
                </button>
              ))}
            </div>
          </div>
        )}

        {durationOptions.length > 4 && (
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <label className='text-xs font-medium text-white'>Duration</label>
              <WorkspaceTooltip tooltipContent={<p>Video duration in seconds. Longer clips cost more.</p>} />
            </div>

            <Select
              value={String(config.duration)}
              onValueChange={(value) => onConfigChange({ duration: Number(value) })}
            >
              <SelectTrigger className='h-9 w-full border-gray-800 bg-gray-950/40 text-xs text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30'>
                <SelectValue placeholder='Select duration' />
              </SelectTrigger>
              <SelectContent position='popper' side='bottom' sideOffset={4} className='max-h-60 border-gray-800 bg-gray-950 text-white'>
                {durationOptions.map((duration) => (
                  <SelectItem key={duration} value={String(duration)} className='text-xs focus:bg-purple-500/20 focus:text-purple-300'>
                    {duration} {duration === 1 ? 'second' : 'seconds'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {durationOptions.length > 0 && durationOptions.length <= 4 && (
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <label className='text-xs font-medium text-white'>Duration</label>
              <WorkspaceTooltip tooltipContent={<p>Select the generated video duration.</p>} />
            </div>

            <div className='grid grid-cols-4 gap-2'>
              {durationOptions.map((duration) => (
                <button
                  key={duration}
                  type='button'
                  onClick={() => onConfigChange({ duration })}
                  className={`cursor-pointer flex h-9 w-full items-center justify-center rounded-md border text-xs font-medium transition ${
                    config.duration === duration
                      ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                      : 'border-gray-800 bg-gray-950/40 text-gray-300 hover:border-gray-700'
                  }`}
                >
                  {duration}s
                </button>
              ))}
            </div>
          </div>
        )}

        {fixedDuration != null && (
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <label className='text-xs font-medium text-white'>Duration</label>
              <WorkspaceTooltip tooltipContent={<p>Veo 3.1 generates a fixed-duration clip.</p>} />
            </div>
            <div className='rounded-md border border-gray-800 bg-gray-950/40 px-3 py-2 text-sm text-gray-300'>
              {fixedDuration} seconds
            </div>
          </div>
        )}

        {isSeedance2 && (
          <div className='space-y-3'>
            <label className='text-xs font-medium text-white'>Seedance Options</label>
            <VideoToggle
              label='Generate audio'
              checked={config.generateAudio}
              onChange={(generateAudio) => onConfigChange({ generateAudio })}
            />
            <VideoToggle
              label='Return last frame'
              checked={config.returnLastFrame}
              onChange={(returnLastFrame) => onConfigChange({ returnLastFrame })}
            />
            <VideoToggle
              label='Use web search'
              checked={config.webSearch}
              onChange={(webSearch) => onConfigChange({ webSearch })}
            />
          </div>
        )}

        {/* Watermark */}
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <label className='text-xs font-medium text-white'>Watermark</label>
            <WorkspaceTooltip
              tooltipContent={
                <>
                  <p className='text-sm'>(Optional) Watermark text.</p>
                  <p className='text-xs text-gray-700 mt-2'>
                    Optional parameter. If provided, a watermark will be added to the generated video.
                  </p>
                </>
              }
            />
          </div>

          <div className='flex items-center gap-2 rounded-md border border-gray-800 bg-gray-950/40 px-3 py-2'>
            <Droplet className='h-4 w-4 text-gray-400 shrink-0' />
            <Input
              type='text'
              placeholder='Enter watermark text'
              value={config.watermark}
              onChange={(e) => onConfigChange({ watermark: e.target.value })}
              className='border-0 bg-transparent p-2 text-sm placeholder-gray-500 focus:ring-0 text-white'
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

function VideoToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className='flex items-center justify-between gap-3 text-xs text-gray-300'>
      {label}
      <input
        type='checkbox'
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className='h-4 w-4 accent-purple-600'
      />
    </label>
  );
}
