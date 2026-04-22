import { ChevronDownIcon, LockIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PostBuilderPlatform } from '@/routes/post-builder/hooks/usePostBuilder';
import { ALL_PLATFORMS, PLATFORM_LABELS } from './caption-utils';

type PlatformPickerProps = {
  selectedPlatforms: Set<PostBuilderPlatform>;
  isOpen: boolean;
  onToggleOpen: () => void;
  onTogglePlatform: (platform: PostBuilderPlatform) => void;
  disabledPlatforms?: Set<PostBuilderPlatform>;
  // Subset of `disabledPlatforms` whose disabled reason is "no media picked" instead of
  // "already published / in-flight". Used only to swap the tooltip — visual style stays
  // the same so the user reads a single state.
  platformsWithoutMedia?: Set<PostBuilderPlatform>;
};

export function PlatformPicker({
  selectedPlatforms,
  isOpen,
  onToggleOpen,
  onTogglePlatform,
  disabledPlatforms,
  platformsWithoutMedia
}: PlatformPickerProps) {
  const label =
    selectedPlatforms.size === ALL_PLATFORMS.length
      ? 'All platforms'
      : `${selectedPlatforms.size} platform${selectedPlatforms.size !== 1 ? 's' : ''}`;

  return (
    <div className='relative'>
      <button
        type='button'
        onClick={onToggleOpen}
        className='flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors'
      >
        <span>Generate for: {label}</span>
        <ChevronDownIcon className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className='mt-2 flex flex-wrap gap-2'>
          {ALL_PLATFORMS.map((platform) => {
            const isChecked = selectedPlatforms.has(platform);
            const isDisabled = disabledPlatforms?.has(platform) ?? false;
            return (
              <label
                key={platform}
                className={cn(
                  'flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors',
                  isDisabled
                    ? 'cursor-not-allowed border-zinc-800 bg-zinc-900/40 text-zinc-600'
                    : 'cursor-pointer',
                  !isDisabled && isChecked && 'border-purple-500/60 bg-purple-500/10 text-white',
                  !isDisabled && !isChecked && 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                )}
                title={
                  isDisabled
                    ? platformsWithoutMedia?.has(platform)
                      ? 'Select an image or video for this platform first'
                      : 'Already published — cannot regenerate caption'
                    : undefined
                }
              >
                <input
                  type='checkbox'
                  disabled={isDisabled}
                  checked={isChecked && !isDisabled}
                  onChange={() => !isDisabled && onTogglePlatform(platform)}
                  className='h-3 w-3 accent-purple-600 disabled:accent-zinc-700'
                />
                {isDisabled && <LockIcon className='size-3' />}
                {PLATFORM_LABELS[platform]}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
