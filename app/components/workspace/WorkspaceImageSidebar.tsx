import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const RATIOS = ['2:3', '1:1', '16:9', 'Custom'] as const;

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

export function WorkspaceImageSidebar() {
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]>('2:3');
  const [imageQuality, setImageQuality] = useState<'1K' | '2K' | '4K'>('1K');
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpg'>('png');
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0]);
  const [open, setOpen] = useState(false);

  return (
    <aside className='flex flex-col h-full w-80 p-4 overflow-hidden border-t-0 border-r border border-zinc-900 bg-zinc-950'>
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
            {RATIOS.map((item) => {
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
                      item === '2:3'
                        ? 'h-7 w-5'
                        : item === '1:1'
                          ? 'h-6 w-6'
                          : item === '16:9'
                            ? 'h-4 w-7'
                            : 'h-7 w-5 border-dashed'
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
            {(['1K', '2K', '4K'] as const).map((quality) => {
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
            {(['png', 'jpg'] as const).map((format) => {
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
