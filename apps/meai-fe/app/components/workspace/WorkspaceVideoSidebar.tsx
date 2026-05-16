import { useEffect } from 'react';
import { Droplet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AI_VIDEO_MODELS } from '@/routes/workspace/config';
import type { VideoDimension } from '@/routes/workspace/config';
import ModelSelection from '@/components/workspace/common/ModelSelection';
import WorkspaceTooltip from './common/WorkspaceTooltip';
import type { VideoGenerationConfig } from '@/routes/workspace/type';

interface WorkspaceVideoSidebarProps {
  config: VideoGenerationConfig;
  onConfigChange: (next: Partial<VideoGenerationConfig>) => void;
}

const SOCIAL_PRESETS: { label: string; value: VideoDimension }[] = [
  { label: 'TikTok', value: '9:16' },
  { label: 'Facebook', value: '16:9' },
  { label: 'Instagram', value: '9:16' },
  { label: 'Threads', value: '9:16' }
];

export function WorkspaceVideoSidebar({ config, onConfigChange }: WorkspaceVideoSidebarProps) {
  const supportedDimensions = config.model.supportedDimensions;

  // Auto-correct dimension if current one isn't supported by selected model
  useEffect(() => {
    if (!supportedDimensions.includes(config.dimension)) {
      onConfigChange({ dimension: supportedDimensions[0] });
    }
  }, [config.model.id, config.dimension, supportedDimensions, onConfigChange]);

  const visibleSocialPresets = SOCIAL_PRESETS.filter((p) => supportedDimensions.includes(p.value));
  return (
    <aside className='h-full w-80 p-4 overflow-hidden border-t-0 border-r border border-zinc-900 bg-zinc-950'>
      <ModelSelection
        models={AI_VIDEO_MODELS}
        selectedModel={config.model}
        onSelectModel={(model) => onConfigChange({ model })}
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
                  {dimension}
                </button>
              );
            })}
          </div>

          {visibleSocialPresets.length > 0 && (
            <div className='space-y-2'>
              <span className='text-xs font-medium text-gray-400'>Socials</span>
              <div className='grid grid-cols-2 gap-2'>
                {visibleSocialPresets.map((item) => {
                  const isActive = config.dimension === item.value;

                  return (
                    <button
                      key={item.label}
                      type='button'
                      onClick={() => onConfigChange({ dimension: item.value })}
                      className={`flex h-9 w-full items-center justify-center rounded-md border px-2 text-xs font-medium transition ${
                        isActive
                          ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                          : 'border-gray-800 bg-gray-950/40 text-gray-300 hover:border-gray-700'
                      }`}
                    >
                      {item.label} ({item.value})
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

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
