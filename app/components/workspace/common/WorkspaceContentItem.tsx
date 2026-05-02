import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { TChat } from '@/models/chat.model';
import { AlertCircle, CheckIcon, Copy, Download, Loader2, RotateCcw, RotateCw, Trash2 } from 'lucide-react';
import { formatDate } from '@/utils';
import { toast } from 'react-toastify';
import DialogViewMedia from '@/components/preview/common/DialogViewMedia';
import type { TMediaResource } from '@/store/media-resource.store';
import { useGenerationFailureStore } from '@/store/generation-failure.store';

const CHAT_MEDIA_PREVIEW_LIMIT = 2;

interface WorkspaceContentItemProps {
  item: TChat;
  handleDelete: (itemId: string) => void;
  handleReusePrompt: (text: string) => void;
  isLoading?: boolean;
  isDeleting?: boolean;
}

export default function WorkspaceContentItem({
  item,
  handleDelete,
  handleReusePrompt,
  isLoading = false,
  isDeleting = false
}: WorkspaceContentItemProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const copyResetTimerRef = useRef<number | null>(null);
  const resultUrls = useMemo(() => item.resultResourceUrls ?? [], [item.resultResourceUrls]);
  const previewUrl = useMemo(
    () => resultUrls[0] ?? item.referenceResourceUrls?.[0] ?? '',
    [item.referenceResourceUrls, resultUrls]
  );

  const hasResult = resultUrls.length > 0;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenUrl, setFullscreenUrl] = useState<string>('');

  const parsedConfig = useMemo<Record<string, unknown> | null>(() => {
    if (!item.config) return null;
    try {
      return typeof item.config === 'string' ? JSON.parse(item.config) : (item.config as Record<string, unknown>);
    } catch {
      return null;
    }
  }, [item.config]);

  const isVideo = useMemo(() => {
    if (!parsedConfig) return false;
    return 'EnableTranslation' in parsedConfig;
  }, [parsedConfig]);

  const expectedResultCount = useMemo<number>(() => {
    if (!parsedConfig) return 1;
    const raw = (parsedConfig.ExpectedResultCount ?? parsedConfig.expectedResultCount) as unknown;
    const n = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
  }, [parsedConfig]);

  const correlationId = useMemo<string | null>(() => {
    if (!parsedConfig) return null;
    const raw = (parsedConfig.CorrelationId ?? parsedConfig.correlationId) as unknown;
    return typeof raw === 'string' && raw ? raw : null;
  }, [parsedConfig]);

  const failedVariants = useGenerationFailureStore((s) => (correlationId ? (s.failedByParent[correlationId] ?? 0) : 0));

  const pendingCount = Math.max(0, expectedResultCount - resultUrls.length - failedVariants);

  // Treat chat as failed if BE marked it OR all variants failed with nothing to show.
  const isFailed = item.status === 'Failed' || (!hasResult && pendingCount === 0 && failedVariants > 0);
  const isGenerating = !hasResult && !isFailed && pendingCount > 0;

  // Build the lightbox payload once (all resultUrls as TMediaResource rows) so the viewer
  // can swipe through every result — the inline grid only surfaces the first 2 tiles.
  const lightboxItems = useMemo<TMediaResource[]>(
    () =>
      resultUrls.map((url, idx) => ({
        id: `${item.id}-media-${idx}`,
        name: `Generated ${idx + 1}`,
        type: isVideo ? 'video' : 'image',
        url,
        thumbnail_url: url
      })),
    [resultUrls, item.id, isVideo]
  );
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  }, []);

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

  const showMultiGrid = !isVideo && expectedResultCount > 1;

  const openFullscreen = (url: string) => {
    setFullscreenUrl(url);
    setIsFullscreen(true);
  };

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${showMultiGrid ? '' : 'max-h-100'} border-zinc-800 bg-zinc-950 hover:border-zinc-700`}
    >
      <div className='grid gap-5 md:grid-cols-4'>
        <div className={`col-span-2 rounded-xl overflow-hidden ${showMultiGrid ? 'w-full' : 'w-90 h-90 bg-zinc-900'}`}>
          {showMultiGrid ? (
            <div className='grid grid-cols-2 gap-2 w-full'>
              {resultUrls.slice(0, CHAT_MEDIA_PREVIEW_LIMIT).map((url, idx) => {
                const isLastVisible = idx === CHAT_MEDIA_PREVIEW_LIMIT - 1;
                const overflowCount = resultUrls.length - CHAT_MEDIA_PREVIEW_LIMIT;
                const showOverflow = isLastVisible && overflowCount > 0;
                return (
                  <button
                    key={`${url}-${idx}`}
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(idx);
                    }}
                    className='relative aspect-square overflow-hidden rounded-lg bg-zinc-900 cursor-zoom-in'
                  >
                    <img
                      src={url}
                      loading='lazy'
                      alt={`Generated item ${idx + 1}`}
                      className='w-full h-full object-contain'
                    />
                    {showOverflow ? (
                      <span className='absolute inset-0 flex items-center justify-center bg-black/60 text-xl font-semibold text-white'>
                        +{overflowCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
              {resultUrls.length < CHAT_MEDIA_PREVIEW_LIMIT
                ? Array.from({ length: Math.min(pendingCount, CHAT_MEDIA_PREVIEW_LIMIT - resultUrls.length) }).map(
                    (_, idx) => (
                      <div
                        key={`pending-${idx}`}
                        className='relative aspect-square overflow-hidden rounded-lg bg-zinc-900 flex flex-col items-center justify-center gap-2'
                      >
                        {isFailed ? (
                          <>
                            <AlertCircle className='h-6 w-6 text-red-400' />
                            <span className='text-[10px] text-red-400'>Failed</span>
                          </>
                        ) : (
                          <>
                            <Loader2 className='h-6 w-6 animate-spin text-violet-400' />
                            <span className='text-[10px] text-zinc-400'>Generating...</span>
                          </>
                        )}
                      </div>
                    )
                  )
                : null}
            </div>
          ) : previewUrl ? (
            isVideo ? (
              <video src={previewUrl} controls muted playsInline className='w-full h-full object-contain' />
            ) : (
              <img
                src={previewUrl}
                loading='lazy'
                alt='Generated item'
                className='w-full h-full object-contain cursor-zoom-in'
                onClick={(e) => {
                  e.stopPropagation();
                  openFullscreen(previewUrl);
                }}
              />
            )
          ) : isFailed ? (
            <div className='flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center'>
              <AlertCircle className='h-8 w-8 text-red-400' />
              <span className='text-xs font-medium text-red-400'>Generation failed</span>
              {item.errorMessage && <span className='text-[10px] text-zinc-500 line-clamp-3'>{item.errorMessage}</span>}
            </div>
          ) : isGenerating ? (
            <div className='flex h-full w-full flex-col items-center justify-center gap-3'>
              <Loader2 className='h-8 w-8 animate-spin text-violet-400' />
              <span className='text-xs text-zinc-400'>Generating...</span>
            </div>
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

      {isFullscreen && fullscreenUrl && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm'
          onClick={() => setIsFullscreen(false)}
        >
          <img
            src={fullscreenUrl}
            alt='Generated item'
            className='max-h-[90vh] max-w-[90vw] object-contain rounded-lg'
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <DialogViewMedia
        isOpen={isLightboxOpen}
        items={lightboxItems}
        activeIndex={lightboxIndex}
        setActiveIndex={(next) =>
          setLightboxIndex((prev) => {
            const resolved = typeof next === 'function' ? next(prev) : next;
            return Math.max(0, Math.min(resolved, Math.max(lightboxItems.length - 1, 0)));
          })
        }
        onClose={() => setIsLightboxOpen(false)}
        label='Generated media'
      />
    </div>
  );
}
