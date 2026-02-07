import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const SIDEBAR_RATIOS = ['2:3', '1:1', '16:9', 'Custom'] as const;
const ALL_RATIOS = ['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'] as const;

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

const IMAGE_QUALITY = ['1K', '2K', '4K'] as const;
const OUTPUT_FORMAT = ['png', 'jpg'] as const;

type AIModel = (typeof AI_MODELS)[number];
type Ratio = (typeof ALL_RATIOS)[number];

const getRatioParts = (value: Ratio) => {
  const [width, height] = value.split(':').map(Number);
  return { width, height };
};

const getRatioBoxStyle = (value: Ratio) => {
  const { width, height } = getRatioParts(value);
  const maxSize = 64;
  const scale = width >= height ? maxSize / width : maxSize / height;

  return {
    width: `${Math.round(width * scale)}px`,
    height: `${Math.round(height * scale)}px`
  };
};

export function WorkspaceVideoSidebar() {
  const [ratio, setRatio] = useState<Ratio>('2:3');
  const [imageQuality, setImageQuality] = useState<(typeof IMAGE_QUALITY)[number]>('1K');
  const [outputFormat, setOutputFormat] = useState<(typeof OUTPUT_FORMAT)[number]>('png');
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0]);
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);

  const ratioIndex = Math.max(0, ALL_RATIOS.indexOf(ratio));
  const isCustomActive = !['2:3', '1:1', '16:9'].includes(ratio);

  return (
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

      {/* content  */}
      <div className='mb-2 flex flex-col gap-6 rounded-b-lg border border-t-0 border-slate-800 bg-slate-950 p-4 pt-6'>
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <label className='text-xs font-medium text-white'>Image Dimensions</label>
          </div>

          <div className='grid grid-cols-4 gap-2'>
            {SIDEBAR_RATIOS.map((item) => {
              if (item === 'Custom') {
                return (
                  <DropdownMenu key={item} open={customOpen} onOpenChange={setCustomOpen}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type='button'
                        className={`cursor-pointer flex flex-col items-center justify-center gap-2 rounded-md border px-2 py-3 text-xs font-medium transition ${
                          isCustomActive
                            ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                            : 'border-gray-800 bg-gray-950/40 text-gray-300 hover:border-gray-700'
                        }`}
                      >
                        <span
                          className={`block h-7 w-5 rounded-xs border border-dashed ${
                            isCustomActive ? 'border-purple-400' : 'border-gray-600'
                          }`}
                        />
                        <span>{item}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side='right'
                      align='start'
                      className='w-80 rounded-2xl border border-gray-800 bg-gray-950 p-4'
                      sideOffset={35}
                      alignOffset={0}
                    >
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <span className='text-xs font-medium text-white'>Aspect Ratio</span>
                          <div className='flex items-center gap-2'>
                            <span className='text-xs text-gray-400'>{ratio}</span>
                            <button
                              type='button'
                              onClick={() => setCustomOpen(false)}
                              className='flex h-6 w-6 items-center justify-center rounded-md border border-gray-800 text-gray-400 transition hover:border-gray-700 hover:text-gray-200'
                              aria-label='Close'
                            >
                              <X className='h-3 w-3' />
                            </button>
                          </div>
                        </div>

                        <div className='flex items-center justify-center rounded-xl border border-gray-800 bg-gray-900/40 p-4'>
                          <div className='relative flex h-20 w-20 items-center justify-center'>
                            <span className='absolute h-12 w-12 rounded-xs border border-dashed border-gray-700' />
                            <span
                              className={`relative bg-gray-900 block rounded-xs border ${
                                isCustomActive ? 'border-purple-400' : 'border-gray-600'
                              }`}
                              style={getRatioBoxStyle(ratio)}
                            />
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <div className='flex items-center justify-between text-xs text-gray-400'>
                            <span>Wide</span>
                            <span>Tall</span>
                          </div>
                          <input
                            type='range'
                            min={0}
                            max={ALL_RATIOS.length - 1}
                            step={1}
                            value={ratioIndex}
                            onChange={(event) => {
                              const next = ALL_RATIOS[Number(event.target.value)];
                              setRatio(next);
                            }}
                            className='h-2 w-full cursor-pointer accent-fuchsia-500'
                          />
                        </div>

                        <div className='space-y-2'>
                          <span className='text-xs font-medium text-gray-400'>Socials</span>
                          <div className='grid grid-cols-2 gap-2'>
                            {(
                              [
                                { label: 'Twitter / X', value: '4:3' },
                                { label: 'Instagram', value: '4:5' },
                                { label: 'TikTok', value: '9:16' }
                              ] as const
                            ).map((item) => {
                              const isActive = ratio === item.value;

                              return (
                                <button
                                  key={item.label}
                                  type='button'
                                  onClick={() => setRatio(item.value)}
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

                        <div className='space-y-2'>
                          <span className='text-xs font-medium text-gray-400'>Devices</span>
                          <div className='grid grid-cols-2 gap-2'>
                            {(
                              [
                                { label: 'Desktop', value: '16:9' },
                                { label: 'Square', value: '1:1' }
                              ] as const
                            ).map((item) => {
                              const isActive = ratio === item.value;

                              return (
                                <button
                                  key={item.label}
                                  type='button'
                                  onClick={() => setRatio(item.value)}
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
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              const isActive = ratio === item;

              return (
                <button
                  key={item}
                  type='button'
                  onClick={() => setRatio(item)}
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
          </div>

          <div className='grid grid-cols-3 gap-2'>
            {IMAGE_QUALITY.map((quality) => {
              const isActive = imageQuality === quality;

              return (
                <button
                  key={quality}
                  type='button'
                  onClick={() => setImageQuality(quality)}
                  className={`cursor-pointer flex h-9 py-8 w-full items-center justify-center rounded-md border text-xs font-medium transition ${
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
          </div>

          <div className='grid grid-cols-2 gap-2'>
            {OUTPUT_FORMAT.map((format) => {
              const isActive = outputFormat === format;

              return (
                <button
                  key={format}
                  type='button'
                  onClick={() => setOutputFormat(format)}
                  className={`cursor-pointer flex h-9 py-8 w-full items-center justify-center rounded-md border text-xs font-medium uppercase transition ${
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
