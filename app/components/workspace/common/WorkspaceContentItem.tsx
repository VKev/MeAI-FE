import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { TWorkspaceItem } from '@/components/workspace/WorkspaceBuilderContent';
import { CheckIcon, Copy, Download, RotateCcw, Trash2 } from 'lucide-react';

interface WorkspaceContentItemProps {
  item: TWorkspaceItem;
  handleDelete: (item: any) => void;
  handleDownload: (item: any) => void;
  handleReusePrompt: (text: string) => void;
}

export default function WorkspaceContentItem({
  item,
  handleDelete,
  handleDownload,
  handleReusePrompt
}: WorkspaceContentItemProps) {
  const [copied, setCopied] = useState(false);
  const copyResetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  const handleCopyPrompt = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }

      copyResetTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        copyResetTimerRef.current = null;
      }, 1500);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  };

  return (
    <div className='rounded-2xl border border-zinc-800 bg-zinc-950 p-4 max-h-100'>
      <div className='grid gap-5 md:grid-cols-4'>
        <div className='col-span-2 rounded-2xl'>
          <img src={item.imageUrl} alt='Generated item' className='max-w-full max-h-90 object-cover rounded-lg' />
        </div>

        <div className='bg-transparent' />

        <div className='space-y-4'>
          <div className='space-y-3'>
            <div className='flex justify-between items-center gap-2'>
              {item.createdAt ? <span className='text-xs text-zinc-400'>{item.createdAt}</span> : null}
              <div className='flex justify-center items-center gap-2'>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => handleCopyPrompt(item.prompt)}
                  className='h-7 w-7 rounded-full p-0'
                  aria-label='Copy prompt'
                  title='Copy prompt'
                >
                  {copied ? <CheckIcon className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
                </Button>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => handleReusePrompt(item.prompt)}
                  className='h-7 w-7 rounded-full p-0'
                  aria-label='Reuse prompt'
                  title='Reuse prompt'
                >
                  <RotateCcw className='h-3.5 w-3.5' />
                </Button>
              </div>
            </div>
            <p className='text-sm leading-relaxed text-zinc-200'>{item.prompt}</p>
          </div>

          <div className='flex justify-end items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleDownload(item)}
              className='h-8 w-8 border-zinc-700 p-0 bg-zinc-900 hover:bg-zinc-800'
              aria-label='Download'
              title='Download'
            >
              <Download className='h-4 w-4 text-zinc-100' />
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={() => handleDelete(item)}
              className='h-8 w-8 p-0'
              aria-label='Delete'
              title='Delete'
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
