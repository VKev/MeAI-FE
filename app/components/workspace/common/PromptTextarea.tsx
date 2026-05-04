import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ImagePlusIcon, Loader2Icon, SparklesIcon } from 'lucide-react';

interface PromptTextareaProps {
  prompt: string;
  onPromptChange: (text: string) => void;
  maxLength: number;
  selectedCount: number;
  onOpenMediaModal: () => void;
  onGenerate: () => void;
  isGenerateDisabled: boolean;
  isMediaDisabled: boolean;
  isGenerating: boolean;
  costCoins?: number;
}

export default function PromptTextarea({
  prompt,
  onPromptChange,
  maxLength,
  selectedCount,
  onOpenMediaModal,
  onGenerate,
  isGenerateDisabled,
  isMediaDisabled,
  isGenerating,
  costCoins
}: PromptTextareaProps) {
  const hasSelectedImages = selectedCount > 0;
  const isSubmitDisabled = isGenerateDisabled || isGenerating;

  return (
    <>
      <Textarea
        value={prompt}
        onChange={(e) => {
          onPromptChange(e.target.value);
        }}
        maxLength={maxLength}
        placeholder='Type a prompt...'
        className={cn(
          'w-full rounded-xl! bg-slate-950! border! border-slate-800! text-white placeholder:text-gray-500 shadow-none focus-visible:shadow-none focus:border-purple-600 focus-visible:border-purple-600 focus:ring-0 focus-visible:ring-0 pr-31 pl-15 resize-none wrap-break-words whitespace-pre-wrap overflow-hidden',
          hasSelectedImages ? 'min-h-44 pb-24' : 'min-h-13 pb-10'
        )}
      />

      <Button
        type='button'
        variant='outline'
        size='icon-lg'
        onClick={onOpenMediaModal}
        disabled={isMediaDisabled}
        className='absolute left-2 top-3 border-gray-700 bg-zinc-900 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50'
        aria-label='Open image selector'
      >
        <ImagePlusIcon className='w-5 h-5 text-white' />
      </Button>
      <div className='absolute right-2 bottom-2 flex flex-col items-end gap-1'>
        <div className='text-xs text-gray-400'>
          {prompt.length} / {maxLength}
        </div>
        <Button
          variant='default'
          onClick={onGenerate}
          disabled={isSubmitDisabled}
          className='cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isGenerating ? (
            <Loader2Icon className='w-4 h-4 mr-2 animate-spin' />
          ) : (
            <SparklesIcon className='w-4 h-4 mr-2' />
          )}
          {isGenerating
            ? 'Generating...'
            : costCoins != null && costCoins > 0
              ? `Generate · ${costCoins} coins`
              : 'Generate'}
        </Button>
      </div>
    </>
  );
}
