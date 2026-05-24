import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ALL_RATIOS, type Ratio } from '@/routes/workspace/config';

interface TImageRatioSelectionProps {
  ratio: Ratio;
  isCustomActive: boolean;
  onChange: (ratio: Ratio) => void;
  supportedRatios?: readonly Ratio[];
}

const getRatioParts = (value: Ratio) => {
  const [width, height] = value.split(':').map(Number);
  return { width, height };
};

const ALL_RATIO_SET = new Set<string>(ALL_RATIOS);

const getRatioBoxStyle = (value: Ratio) => {
  const { width, height } = getRatioParts(value);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { width: '40px', height: '40px' };
  }

  const maxSize = 64;
  const scale = width >= height ? maxSize / width : maxSize / height;

  return {
    width: `${Math.round(width * scale)}px`,
    height: `${Math.round(height * scale)}px`
  };
};

export default function ImageRatioSelection({ ratio, isCustomActive, onChange, supportedRatios }: TImageRatioSelectionProps) {
  const [open, setOpen] = useState(false);
  const availableRatios = useMemo(
    () => (supportedRatios ?? ALL_RATIOS).filter((r) => ALL_RATIO_SET.has(r)),
    [supportedRatios]
  );
  const ratioIndex = Math.max(0, availableRatios.indexOf(ratio));

  const SOCIAL_PRESETS = [
    { label: 'TikTok', value: '9:16' as Ratio },
    { label: 'Facebook', value: '16:9' as Ratio },
    { label: 'Instagram', value: '4:5' as Ratio },
    { label: 'Threads', value: '1:1' as Ratio }
  ].filter((p) => availableRatios.includes(p.value));

  const DEVICE_PRESETS = [
    { label: 'Desktop', value: '16:9' as Ratio },
    { label: 'Square', value: '1:1' as Ratio }
  ].filter((p) => availableRatios.includes(p.value));

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
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
          <span>Custom</span>
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
                onClick={() => setOpen(false)}
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
              max={Math.max(0, availableRatios.length - 1)}
              step={1}
              value={ratioIndex}
              onChange={(event) => {
                const next = availableRatios[Number(event.target.value)];
                if (next) onChange(next);
              }}
              className='h-2 w-full cursor-pointer accent-purple-500'
            />
          </div>

          {SOCIAL_PRESETS.length > 0 && (
            <div className='space-y-2'>
              <span className='text-xs font-medium text-gray-400'>Socials</span>
              <div className='grid grid-cols-2 gap-2'>
                {SOCIAL_PRESETS.map((item) => {
                  const isActive = ratio === item.value;

                  return (
                    <button
                      key={item.label}
                      type='button'
                      onClick={() => onChange(item.value)}
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

          {DEVICE_PRESETS.length > 0 && (
            <div className='space-y-2'>
              <span className='text-xs font-medium text-gray-400'>Devices</span>
              <div className='grid grid-cols-2 gap-2'>
                {DEVICE_PRESETS.map((item) => {
                  const isActive = ratio === item.value;

                  return (
                    <button
                      key={item.label}
                      type='button'
                      onClick={() => onChange(item.value)}
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
