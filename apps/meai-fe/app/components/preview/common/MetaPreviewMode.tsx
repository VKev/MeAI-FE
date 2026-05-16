import { cn } from '@/lib/utils';

type MetaPreviewModeProps = {
  previewMode: 'post' | 'reel';
  setPreviewMode: (mode: 'post' | 'reel') => void;
};

function MetaPreviewMode({ previewMode, setPreviewMode }: MetaPreviewModeProps) {
  return (
    <>
      <div className='mb-3 text-md font-semibold text-white'>Preview Mode</div>
      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={() => setPreviewMode('post')}
          className={cn(
            'rounded-full px-3 py-2 text-sm font-medium transition',
            previewMode === 'post'
              ? 'bg-purple-500/25 text-purple-100 ring-1 ring-purple-300/40'
              : 'bg-white/5 text-zinc-300 hover:bg-white/10'
          )}
        >
          Post mode
        </button>

        <button
          type='button'
          onClick={() => setPreviewMode('reel')}
          className={cn(
            'rounded-full px-3 py-2 text-sm font-medium transition',
            previewMode === 'reel'
              ? 'bg-purple-500/25 text-purple-100 ring-1 ring-purple-300/40'
              : 'bg-white/5 text-zinc-300 hover:bg-white/10'
          )}
        >
          Reel mode
        </button>
      </div>
    </>
  );
}

export default MetaPreviewMode;
