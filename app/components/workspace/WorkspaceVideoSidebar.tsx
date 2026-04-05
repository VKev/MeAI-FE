import { Droplet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AI_MODELS, VIDEO_DIMENSIONS } from '@/routes/workspace/config';
import ModelSelection from '@/components/workspace/common/ModelSelection';
import WorkspaceTooltip from './common/WorkspaceTooltip';
import type { VideoGenerationConfig } from '@/routes/workspace/hooks/useGeneration';

interface WorkspaceVideoSidebarProps {
  config: VideoGenerationConfig;
  onConfigChange: (next: Partial<VideoGenerationConfig>) => void;
}

type VideoDimension = (typeof VIDEO_DIMENSIONS)[number];

export function WorkspaceVideoSidebar({ config, onConfigChange }: WorkspaceVideoSidebarProps) {
  const validateSeed = (value: string) => {
    if (!value) return true;
    const num = parseInt(value);
    return !isNaN(num) && num >= 10000 && num <= 99999;
  };

  const handleSeedChange = (value: string) => {
    if (value === '' || validateSeed(value)) {
      onConfigChange({ seed: value });
    }
  };

  return (
    <aside className='h-full w-80 p-4 overflow-hidden border-t-0 border-r border border-zinc-900 bg-zinc-950'>
      <ModelSelection
        models={AI_MODELS}
        selectedModel={config.model}
        onSelectModel={(model) => onConfigChange({ model })}
      />

      {/* Content */}
      <div className='mb-2 flex flex-col gap-6 rounded-b-lg border border-t-0 border-slate-800 bg-slate-950 p-4 pt-6'>
        {/* Video Dimension */}
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <label className='text-xs font-medium text-white'>Video Dimension</label>
            <WorkspaceTooltip tooltipContent={<p>Determines the aspect ratio of the generated video</p>} />
          </div>

          <div className='grid grid-cols-3 gap-2'>
            {VIDEO_DIMENSIONS.map((dimension) => {
              const isActive = config.dimension === dimension;

              return (
                <button
                  key={dimension}
                  type='button'
                  onClick={() => onConfigChange({ dimension: dimension as VideoDimension })}
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
        </div>

        {/* Others Section */}
        <div className='space-y-4'>
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

          {/* Seed */}
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <label className='text-xs font-medium text-white'>Seed</label>
              <WorkspaceTooltip
                tooltipContent={
                  <>
                    <p className='text-sm'>
                      (Optional) Random seed parameter to control the randomness of the generated content.
                    </p>
                    <p className='text-xs text-gray-700 mt-2'>Value range: 10000-99999</p>
                    <p className='text-xs text-gray-700 mt-2'>
                      The same seed will generate similar video content, different seeds will generate different
                      content. If not provided, the system will assign one automatically.
                    </p>
                    <p className='text-xs text-gray-700 mt-2'>Example: 12345</p>
                  </>
                }
              />
            </div>

            <div className='flex items-center gap-2 rounded-md border border-gray-800 bg-gray-950/40 px-3 py-2'>
              <span className='text-gray-400 text-xs font-medium'>#</span>
              <Input
                type='text'
                placeholder='10000 - 99999'
                value={config.seed}
                onChange={(e) => handleSeedChange(e.target.value)}
                className='border-0 bg-transparent p-2 text-sm placeholder-gray-500 focus:ring-0 text-white'
              />
            </div>
            {config.seed && !validateSeed(config.seed) && (
              <p className='text-xs text-red-500'>Seed must be between 10000 and 99999</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
