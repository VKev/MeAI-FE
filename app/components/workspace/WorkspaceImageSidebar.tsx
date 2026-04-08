import ModelSelection from '@/components/workspace/common/ModelSelection';
import WorkspaceTooltip from './common/WorkspaceTooltip';
import ImageRatioSelection from '@/components/workspace/common/ImageRatioSelection';
import { AI_MODELS, ALL_RATIOS, IMAGE_QUALITY, OUTPUT_FORMAT, SIDEBAR_RATIOS } from '@/routes/workspace/config';
import type { ImageGenerationConfig } from '@/routes/workspace/type';

interface WorkspaceImageSidebarProps {
  config: ImageGenerationConfig;
  onConfigChange: (next: Partial<ImageGenerationConfig>) => void;
}

type Ratio = (typeof ALL_RATIOS)[number];

export function WorkspaceImageSidebar({ config, onConfigChange }: WorkspaceImageSidebarProps) {
  const isCustomActive = !['2:3', '1:1', '16:9'].includes(config.ratio);

  return (
    <aside className='h-full w-80 p-4 overflow-hidden border-t-0 border-r border border-zinc-900 bg-zinc-950'>
      <ModelSelection
        models={AI_MODELS}
        selectedModel={config.model}
        onSelectModel={(model) => onConfigChange({ model })}
      />

      {/* content  */}
      <div className='mb-2 flex flex-col gap-6 rounded-b-lg border border-t-0 border-slate-800 bg-slate-950 p-4 pt-6'>
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <label className='text-xs font-medium text-white'>Image Dimensions</label>
            <WorkspaceTooltip tooltipContent={<p>Determines the aspect ratio of the generated image</p>} />
          </div>

          <div className='grid grid-cols-4 gap-2'>
            {SIDEBAR_RATIOS.map((item) => {
              if (item === 'Custom') {
                return (
                  <ImageRatioSelection
                    key={item}
                    ratio={config.ratio}
                    isCustomActive={isCustomActive}
                    onChange={(next) => onConfigChange({ ratio: next })}
                  />
                );
              }

              const isActive = config.ratio === item;

              return (
                <button
                  key={item}
                  type='button'
                  onClick={() => onConfigChange({ ratio: item as Ratio })}
                  className={`cursor-pointer flex flex-col items-center justify-center gap-2 rounded-md border px-2 py-3 text-xs font-medium transition ${
                    isActive
                      ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                      : 'border-gray-800 bg-gray-950/40 text-gray-300 hover:border-gray-700'
                  }`}
                >
                  <span
                    className={`block rounded-xs border ${
                      item === '2:3' ? 'h-7 w-5' : item === '1:1' ? 'h-6 w-6' : 'h-4 w-7'
                    } ${isActive ? 'border-purple-400' : 'border-gray-600'}`}
                  />
                  <span>{item}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <label className='text-xs font-medium text-white'>Image Quality</label>
            <WorkspaceTooltip tooltipContent={<p>Resolution of the generated image</p>} />
          </div>

          <div className='grid grid-cols-3 gap-2'>
            {IMAGE_QUALITY.map((quality) => {
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

        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <label className='text-xs font-medium text-white'>Image Output Format</label>
            <WorkspaceTooltip tooltipContent={<p>Format of the output image</p>} />
          </div>

          <div className='grid grid-cols-2 gap-2'>
            {OUTPUT_FORMAT.map((format) => {
              const isActive = config.outputFormat === format;

              return (
                <button
                  key={format}
                  type='button'
                  onClick={() => onConfigChange({ outputFormat: format })}
                  className={`cursor-pointer flex h-9 py-3 w-full items-center justify-center rounded-md border text-xs font-medium uppercase transition ${
                    isActive
                      ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                      : 'border-gray-800 bg-gray-950/40 text-gray-300 hover:border-gray-700'
                  }`}
                >
                  {format}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
