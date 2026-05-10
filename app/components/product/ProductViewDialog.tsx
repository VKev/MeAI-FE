import type { Post } from '@/models/post.model';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Calendar, Clock3, ExternalLink, FileText, Hash, Maximize2, Paperclip, Play, Share2 } from 'lucide-react';
import { useState } from 'react';

interface ProductViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Post | null;
  onEdit: (product: Post) => void;
}

type PreviewMedia = {
  resourceId: string;
  presignedUrl: string;
  contentType: string | null;
  resourceType: string | null;
};

function formatDate(value: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

function formatDateOnly(value: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
}

function formatTimeOnly(value: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ProductViewDialog({ open, onOpenChange, product, onEdit }: ProductViewDialogProps) {
  if (!product) return null;

  const [previewMedia, setPreviewMedia] = useState<PreviewMedia | null>(null);
  const mediaCount = product.media?.length || 0;
  const schedule = product.schedule;
  const isPreviewImage =
    previewMedia?.resourceType?.toLowerCase() === 'image' || previewMedia?.contentType?.startsWith('image/');
  const isPreviewVideo =
    previewMedia?.resourceType?.toLowerCase() === 'video' || previewMedia?.contentType?.startsWith('video/');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-h-[90vh] min-w-[50vw] max-w-[90vw] overflow-hidden border border-white/15 bg-[#060912] p-0 text-white'>
          <div className='flex h-full flex-col'>
            <DialogHeader className='border-b border-white/10 px-6 py-5 text-left sm:px-8'>
              <div className='flex flex-wrap items-start justify-between gap-4'>
                <div className='min-w-0 space-y-2'>
                  <DialogTitle className='line-clamp-1 text-2xl'>Product Details: {product.id}</DialogTitle>
                  <DialogDescription className='text-slate-400'>View full product details.</DialogDescription>
                </div>

                <div className='flex flex-wrap items-center gap-2'>
                  <div className='rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-slate-300'>
                    {product.status || 'unknown'}
                  </div>
                  <div className='rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs uppercase tracking-wide text-violet-200'>
                    {product.publications?.[0]?.socialMediaType || 'unknown'}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className='min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8'>
              <div
                className={`grid gap-6 ${schedule ? 'grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]' : 'grid-cols-1'}`}
              >
                <div className='space-y-6'>
                  <div className='rounded-2xl border border-white/10 bg-white/3 p-5'>
                    <div className='flex items-center gap-2 text-sm font-semibold text-white'>
                      <FileText className='h-4 w-4 text-slate-400' />
                      Content
                    </div>
                    <p className='mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200'>
                      {product.content?.content || 'No content'}
                    </p>

                    {product.content?.hashtag && (
                      <div className='pt-4'>
                        <div className='mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400'>
                          <Hash className='h-3.5 w-3.5' />
                          Hashtags
                        </div>
                        <p className='text-sm text-violet-300'>{product.content.hashtag}</p>
                      </div>
                    )}
                  </div>

                  {product.media && product.media.length > 0 && (
                    <div className='space-y-3 rounded-2xl border border-white/10 bg-white/3 p-5'>
                      <div className='flex items-center gap-2 text-sm font-semibold text-white'>
                        <Paperclip className='h-4 w-4 text-slate-400' />
                        Media
                      </div>
                      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
                        {product.media.map((m) => {
                          const isVideo = m.resourceType === 'video' || m.contentType?.startsWith('video/');
                          return (
                            <button
                              key={m.resourceId}
                              type='button'
                              onClick={() => setPreviewMedia(m)}
                              className='group relative overflow-hidden rounded-xl border border-white/10 bg-black transition-all hover:border-white/30 hover:shadow-lg hover:shadow-white/10 cursor-zoom-in'
                            >
                              {isVideo ? (
                                <video src={m.presignedUrl} className='aspect-video h-full w-full object-cover' muted />
                              ) : (
                                <img src={m.presignedUrl} className='aspect-video h-full w-full object-cover' />
                              )}
                              <div className='absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20'>
                                <div className='opacity-0 transition-opacity group-hover:opacity-100'>
                                  {isVideo ? (
                                    <Play className='h-8 w-8 text-white fill-white' />
                                  ) : (
                                    <Maximize2 className='h-8 w-8 text-white' />
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {schedule && (
                  <div className='rounded-2xl h-fit border border-white/10 bg-white/3 p-5'>
                    <div className='flex items-center gap-2 text-sm font-semibold text-white'>
                      <Clock3 className='h-4 w-4 text-slate-400' />
                      Schedule
                    </div>

                    {schedule ? (
                      <div className='mt-4 space-y-3 text-sm'>
                        <div className='rounded-xl border border-white/10 bg-black/20 p-3'>
                          <p className='text-slate-400'>Scheduled At</p>
                          <p className='mt-1 text-white'>{formatDate(schedule.scheduledAtUtc)}</p>
                        </div>
                        <div className='rounded-xl border border-white/10 bg-black/20 p-3'>
                          <p className='text-slate-400'>Timezone</p>
                          <p className='mt-1 text-white'>{schedule.timezone || 'N/A'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className='mt-4 rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-slate-400'>
                        No schedule attached to this product.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className='border-t border-white/10 px-6 py-5 sm:px-8'>
              <Button
                variant='outline'
                onClick={() => onOpenChange(false)}
                className='border-white/15 bg-white/5 text-white hover:bg-white/10'
              >
                Close
              </Button>

              <Button onClick={() => onEdit(product)} className='bg-violet-600 text-white hover:bg-violet-500'>
                Edit Product
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(previewMedia)} onOpenChange={(previewOpen) => !previewOpen && setPreviewMedia(null)}>
        <DialogContent className='flex flex-col h-[96vh] w-[98vw] max-w-none overflow-hidden border border-white/15 bg-[#060912] p-0'>
          {previewMedia && (
            <>
              <div className='flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5'>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium text-white'>Media Preview</p>
                </div>
                <a
                  href={previewMedia.presignedUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/6 px-2.5 py-1.5 text-xs text-white hover:bg-white/12'
                >
                  <ExternalLink className='h-3.5 w-3.5' />
                  New tab
                </a>
              </div>

              <div className='relative flex min-h-0 flex-1 items-center justify-center bg-black/40 p-3 sm:p-5 overflow-hidden'>
                {isPreviewImage ? (
                  <img
                    src={previewMedia.presignedUrl}
                    alt='Preview'
                    className='max-h-full max-w-full rounded-md object-contain'
                  />
                ) : isPreviewVideo ? (
                  <video
                    src={previewMedia.presignedUrl}
                    controls
                    playsInline
                    preload='metadata'
                    className='max-h-full max-w-full rounded-md object-contain'
                  />
                ) : null}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
