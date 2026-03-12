import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SparklesIcon } from 'lucide-react';

interface PromptInputProps {
  prompt: string;
  setPrompt: (text: string) => void;
  handleGenerate: () => void;
}

export default function PromptInput({ prompt, setPrompt, handleGenerate }: PromptInputProps) {
  return (
    <div className='relative'>
      <Textarea
        value={prompt}
        onChange={(e) => {
          setPrompt(e.target.value);
        }}
        maxLength={600}
        placeholder='Type a prompt...'
        className='w-full bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 shadow-none focus-visible:shadow-none focus:border-purple-600 focus-visible:border-purple-600 focus:ring-0 focus-visible:ring-0 min-h-13 pr-31 resize-none wrap-break-words whitespace-pre-wrap overflow-hidden'
      />
      <Button
        variant={'default'}
        onClick={handleGenerate}
        disabled={!prompt.trim()}
        className='absolute right-2 bottom-2 cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 disabled:opacity-50 disabled:cursor-not-allowed'
      >
        <SparklesIcon className='w-4 h-4 mr-2' />
        Generate
      </Button>
    </div>
  );
}
