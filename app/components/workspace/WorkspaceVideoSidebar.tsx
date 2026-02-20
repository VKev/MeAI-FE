import { useState } from 'react';
import { ChevronDown, ChevronUp, X, Droplet } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

const VIDEO_DIMENSIONS = ['9:16', '16:9', 'auto'] as const;

const AI_MODELS = [
  {
    id: 'auto',
    name: 'Auto',
    description: 'An intelligent Preset that selects the best model for your prompt',
    image: 'https://cdn.leonardo.ai/static/images/video/models/auto_preset.webp'
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    description: 'Consistency & infographics (Gemini 3 Pro)',
    image: 'https://cdn.leonardo.ai/preset_assets/thumbnails/af3189d3-4619-477d-a3e5-4f076a86e2eb/thumbnail-5c39.webp'
  },
  {
    id: 'gpt-image-1-5',
    name: 'GPT Image-1.5',
    description: 'Superior editing control, image integrity and detail preservation.',
    image: 'https://cdn.leonardo.ai/preset_assets/thumbnails/cfd12969-ad0a-440a-9803-5b52d8c7d223/thumbnail-cc00.webp'
  }
] as const;

type AIModel = (typeof AI_MODELS)[number];
type VideoDimension = (typeof VIDEO_DIMENSIONS)[number];

export function WorkspaceVideoSidebar() {
  const [videoDimension, setVideoDimension] = useState<VideoDimension>('16:9');
  const [watermark, setWatermark] = useState<string>('');
  const [seed, setSeed] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0]);
  const [open, setOpen] = useState(false);

  const validateSeed = (value: string) => {
    if (!value) return true;
    const num = parseInt(value);
    return !isNaN(num) && num >= 10000 && num <= 99999;
  };

  const handleSeedChange = (value: string) => {
    if (value === '' || validateSeed(value)) {
      setSeed(value);
    }
  };

  return (
    <TooltipProvider>
      <aside className='h-full w-80 p-4 overflow-hidden border-t-0 border-r border border-zinc-900 bg-zinc-950'>
        {/* Header – Model */}
        <div className='relative grid min-h-20 w-full place-items-center overflow-hidden px-4 py-3'>
          <img
            alt={selectedModel.name}
            loading='lazy'
            width='200'
            height='200'
            decoding='async'
            className='pointer-events-none absolute top-0 h-full w-full rounded-t-lg object-cover'
            src={selectedModel.image}
            style={{ color: 'transparent' }}
          />

          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <button className='bg-gray-900 relative flex h-16 w-full items-center justify-between gap-2 rounded-lg px-4'>
                <div className='flex flex-col items-start'>
                  <span className='bg-slate-800 text-fuchsia-600 rounded px-2 text-xs font-medium'>Model</span>
                  <span className='text-white text-sm'>{selectedModel.name}</span>
                </div>

                {open ? <ChevronUp className='h-4 w-4 text-white' /> : <ChevronDown className='h-4 w-4 text-white' />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side='right'
              align='start'
              className='w-96 rounded-2xl bg-gray-950 border border-gray-800 p-3'
              sideOffset={35}
              alignOffset={-14}
            >
              {AI_MODELS.map((model) => {
                const isSelected = selectedModel.id === model.id;
                return (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className={`cursor-pointer p-0 mb-2 last:mb-0 rounded-xl overflow-hidden focus:bg-transparent hover:bg-transparent ${
                      isSelected ? 'ring-1 ring-purple-500' : 'ring-1 ring-gray-800'
                    }`}
                  >
                    <div
                      className={`w-full flex items-start gap-3 p-3 transition ${
                        isSelected ? 'bg-gray-900' : 'hover:bg-gray-900'
                      }`}
                    >
                      <img src={model.image} alt={model.name} className='h-16 w-16 rounded-lg object-cover shrink-0' />
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <span className='text-sm font-medium text-white'>{model.name}</span>
                        </div>
                        <p className='text-xs text-gray-500 mb-2 line-clamp-2'>{model.description}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className='mb-2 flex flex-col gap-6 rounded-b-lg border border-t-0 border-slate-800 bg-slate-950 p-4 pt-6'>
          {/* Video Dimension */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <label className='text-xs font-medium text-white'>Video Dimension</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className='flex h-4 w-4 items-center justify-center rounded-full border border-gray-600 text-xs text-gray-400 hover:border-gray-500'>
                    ?
                  </button>
                </TooltipTrigger>
                <TooltipContent side='right' className='max-w-xs bg-white text-black'>
                  <p>Determines the aspect ratio of the generated video</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className='grid grid-cols-3 gap-2'>
              {VIDEO_DIMENSIONS.map((dimension) => {
                const isActive = videoDimension === dimension;

                return (
                  <button
                    key={dimension}
                    type='button'
                    onClick={() => setVideoDimension(dimension)}
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className='flex h-4 w-4 items-center justify-center rounded-full border border-gray-600 text-xs text-gray-400 hover:border-gray-500'>
                      ?
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='right' className='max-w-xs bg-white text-black'>
                    <p className='text-sm'>Watermark text.</p>
                    <p className='text-xs text-gray-700 mt-2'>
                      Optional parameter. If provided, a watermark will be added to the generated video.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className='flex items-center gap-2 rounded-md border border-gray-800 bg-gray-950/40 px-3 py-2'>
                <Droplet className='h-4 w-4 text-gray-400 flex-shrink-0' />
                <Input
                  type='text'
                  placeholder='Enter watermark text'
                  value={watermark}
                  onChange={(e) => setWatermark(e.target.value)}
                  className='border-0 bg-transparent p-2 text-sm placeholder-gray-500 focus:ring-0 text-white'
                />
              </div>
            </div>

            {/* Seed */}
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <label className='text-xs font-medium text-white'>Seed</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className='flex h-4 w-4 items-center justify-center rounded-full border border-gray-600 text-xs text-gray-400 hover:border-gray-500'>
                      ?
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='right' className='max-w-xs bg-white text-black'>
                    <p className='text-sm'>
                      (Optional) Random seed parameter to control the randomness of the generated content.
                    </p>
                    <p className='text-xs text-gray-700 mt-2'>Value range: 10000-99999</p>
                    <p className='text-xs text-gray-700 mt-2'>
                      The same seed will generate similar video content, different seeds will generate different
                      content. If not provided, the system will assign one automatically.
                    </p>
                    <p className='text-xs text-gray-700 mt-2'>Example: 12345</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className='flex items-center gap-2 rounded-md border border-gray-800 bg-gray-950/40 px-3 py-2'>
                <span className='text-gray-400 text-xs font-medium'>#</span>
                <Input
                  type='text'
                  placeholder='10000 - 99999'
                  value={seed}
                  onChange={(e) => handleSeedChange(e.target.value)}
                  className='border-0 bg-transparent p-2 text-sm placeholder-gray-500 focus:ring-0 text-white'
                />
              </div>
              {seed && !validateSeed(seed) && (
                <p className='text-xs text-red-500'>Seed must be between 10000 and 99999</p>
              )}
            </div>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
