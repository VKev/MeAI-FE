import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { TChat } from '@/models/chat.model';
import { CheckIcon, Copy, Download, RotateCcw, RotateCw, Trash2 } from 'lucide-react';
import { formatDate } from '@/utils';
import { toast } from 'react-toastify';

interface WorkspaceContentItemProps {
  item: TChat;
  isSelected: boolean;
  onToggleSelect: (item: TChat) => void;
  handleDelete: (itemId: string) => void;
  handleReusePrompt: (text: string) => void;
  isLoading?: boolean;
  isDeleting?: boolean;
}

export default function WorkspaceContentItem({
  item,
  isSelected,
  onToggleSelect,
  handleDelete,
  handleReusePrompt,
  isLoading = false,
  isDeleting = false
}: WorkspaceContentItemProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const copyResetTimerRef = useRef<number | null>(null);
  const previewUrl = useMemo(
    () => item.resultResourceUrls?.[0] ?? item.referenceResourceUrls?.[0] ?? '',
    [item.referenceResourceUrls, item.resultResourceUrls]
  );

  const handleDownload = async (url: string) => {
    try {
      setIsDownloading(true);
      const res = await fetch(url);
      const blob = await res.blob();

      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${item.id}.png` || 'image.jpg';
      a.click();
    } catch (error) {
      console.error('Failed to download image:', error);
      toast.error('Failed to download image. Please try again.');
      return;
    } finally {
      setIsDownloading(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className='rounded-2xl border border-zinc-800 bg-zinc-950 p-4'>
        <div className='grid gap-5 md:grid-cols-4'>
          <div className='col-span-2 h-90 w-90 overflow-hidden rounded-xl bg-white/5'>
            <div className='h-full w-full animate-pulse bg-white/10' />
          </div>
          <div className='bg-transparent visible' />
          <div className='space-y-4'>
            <div className='space-y-3'>
              <div className='h-3 w-1/3 animate-pulse rounded bg-white/10' />
              <div className='h-4 w-3/4 animate-pulse rounded bg-white/10' />
              <div className='h-4 w-2/3 animate-pulse rounded bg-white/10' />
            </div>
            <div className='flex justify-end gap-2'>
              <div className='h-8 w-8 animate-pulse rounded-md bg-white/10' />
              <div className='h-8 w-8 animate-pulse rounded-md bg-white/10' />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-4 max-h-100 cursor-pointer transition-colors ${
        isSelected
          ? 'border-violet-500 bg-violet-950/20 ring-1 ring-violet-500/40'
          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
      }`}
      onClick={() => onToggleSelect(item)}
    >
      <div className='grid gap-5 md:grid-cols-4'>
        <div className='col-span-2 rounded-xl w-90 h-90 overflow-hidden bg-zinc-900'>
          {previewUrl ? (
            <img src={previewUrl} loading='lazy' alt='Generated item' className='w-full h-full object-contain' />
          ) : (
            <div className='flex h-full w-full items-center justify-center text-xs text-zinc-500'>No preview</div>
          )}
        </div>

        <div className='bg-transparent visible' />

        <div className='space-y-4'>
          <div className='space-y-3'>
            <div className='flex justify-between items-center gap-2'>
              {item.createdAt ? <span className='text-xs text-zinc-400'>{formatDate(item.createdAt)}</span> : null}
              <div className='flex justify-center items-center gap-2'>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyPrompt(item.prompt);
                  }}
                  className='h-7 w-7 rounded-full p-0'
                  aria-label='Copy prompt'
                  title='Copy prompt'
                >
                  {copied ? <CheckIcon className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
                </Button>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReusePrompt(item.prompt);
                  }}
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
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(previewUrl);
              }}
              className='h-8 w-8 border-zinc-700 p-0 bg-zinc-900 hover:bg-zinc-800'
              aria-label='Download'
              title='Download'
              disabled={!previewUrl || isDownloading || isDeleting}
            >
              {isDownloading ? (
                <RotateCw className='h-4 w-4 text-zinc-100 animate-spin' />
              ) : (
                <Download className='h-4 w-4 text-zinc-100' />
              )}
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item.id);
              }}
              className='h-8 w-8 p-0'
              aria-label='Delete'
              title='Delete'
              disabled={isDownloading || isDeleting}
            >
              {isDeleting ? <RotateCw className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
