import PostMediaSurface, {
  toPostMediaDisplayItems,
  type PostMediaSurfaceItem
} from '@/components/product/PostMediaSurface';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Post } from '@/models/post.model';
import { ExternalLink, Globe2, ImageIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Props {
  post: Post | null;
  contentValue?: string;
  onContentChange?: (value: string) => void;
  onAddMedia?: () => void;
  onRemoveMedia?: (resourceId: string) => void;
  isMediaUpdating?: boolean;
  isLoading?: boolean;
}

export default function AIRecommendedPostPanel({
  post,
  contentValue,
  onContentChange,
  onAddMedia,
  onRemoveMedia,
  isMediaUpdating,
  isLoading
}: Props) {
  const [previewMedia, setPreviewMedia] = useState<PostMediaSurfaceItem | null>(null);

  const initialCombined = useMemo(
    () => [post?.content?.content || '', post?.content?.hashtag || ''].filter(Boolean).join('\n\n'),
    [post]
  );
  const mediaItems = useMemo(() => toPostMediaDisplayItems(post?.media ?? []), [post?.media]);

  const [localCombinedContent, setLocalCombinedContent] = useState<string>(initialCombined);
  const combinedContent = contentValue ?? localCombinedContent;

  useEffect(() => {
    if (contentValue === undefined) {
      setLocalCombinedContent(initialCombined);
    }
  }, [contentValue, initialCombined]);

  const handleContentChange = (value: string) => {
    if (contentValue === undefined) {
      setLocalCombinedContent(value);
    }

    onContentChange?.(value);
  };

  if (isLoading || !post) {
    return (
      <section className='overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.96)_100%)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]'>
        <div className='border-b border-white/8 px-6 py-5'>
          <div className='space-y-2'>
            <div className='h-6 w-32 animate-pulse rounded-full bg-white/5' />
            <div className='h-8 w-64 animate-pulse rounded-xl bg-white/5' />
            <div className='h-4 w-80 max-w-full animate-pulse rounded-lg bg-white/5' />
          </div>
        </div>

        <div className='grid items-stretch gap-5 px-6 py-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)]'>
          <div className='min-h-[420px] rounded-3xl border border-white/8 bg-white/3 p-5'>
            <div className='mb-4 h-4 w-28 animate-pulse rounded bg-white/5' />
            <div className='h-[320px] w-full animate-pulse rounded-xl bg-white/5' />
          </div>
          <div className='min-h-[420px] rounded-3xl border border-white/8 bg-white/3 p-5'>
            <div className='mb-4 h-4 w-32 animate-pulse rounded bg-white/5' />
            <div className='aspect-[4/3] w-full animate-pulse rounded-2xl bg-white/5' />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className='overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.96)_100%)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]'>
      <div className='border-b border-white/8 px-6 py-5'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div className='min-w-0 space-y-2'>
            <div className='inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300'>
              AI Recommended
            </div>

            <div className='min-w-0'>
              <h2 className='truncate text-2xl font-semibold tracking-tight text-white'>{post.title}</h2>
              <p className='mt-1 text-sm text-slate-400'>Review the generated copy and media before publishing.</p>
            </div>
          </div>
        </div>
      </div>

      <div className='grid items-stretch gap-5 px-6 py-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.82fr)]'>
        <div className='flex min-h-[520px] min-w-0 flex-col rounded-3xl border border-white/8 bg-white/3 p-5'>
          <div className='mb-4 flex items-center gap-2'>
            <Globe2 className='h-4 w-4 text-slate-400' />
            <h3 className='text-sm font-semibold text-white'>Post Content</h3>
          </div>

          <textarea
            value={combinedContent}
            onChange={(event) => handleContentChange(event.target.value)}
            placeholder='Write your post content here. You can include hashtags too.'
            className='min-h-0 w-full flex-1 resize-none rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,20,0.82)_0%,rgba(8,10,16,0.9)_100%)] p-4 text-sm leading-7 text-slate-200 placeholder-slate-500 transition-colors focus:border-white/30 focus:bg-white/5 focus:outline-none'
          />
        </div>

        <div className='flex min-h-[520px] min-w-0 flex-col rounded-3xl border border-white/8 bg-white/3 p-5'>
          <div className='mb-4 flex items-center justify-between gap-3'>
            <div className='flex items-center gap-2'>
              <ImageIcon className='h-4 w-4 text-slate-400' />
              <h3 className='text-sm font-semibold text-white'>Media Resources</h3>
            </div>
            {isMediaUpdating ? <span className='text-xs text-violet-200'>Updating...</span> : null}
          </div>

          <div className='min-h-0 flex-1'>
            <PostMediaSurface
              items={mediaItems}
              tone='improved'
              emptyTitle='No media attached'
              emptyDescription='Add image or video media before publishing this recommendation.'
              addLabel='Add Media'
              onAddMedia={onAddMedia}
              onOpenMedia={setPreviewMedia}
              onRemoveMedia={
                onRemoveMedia
                  ? (item) => {
                      if (item.resourceId) {
                        onRemoveMedia(item.resourceId);
                      }
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </div>

      <Dialog
        open={Boolean(previewMedia)}
        onOpenChange={(open) => {
          if (!open) setPreviewMedia(null);
        }}
      >
        <DialogContent className='flex h-[96vh] w-[98vw] max-w-none flex-col overflow-hidden border border-white/15 bg-[#060912] p-0'>
          {previewMedia && (
            <>
              <div className='flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5'>
                <p className='truncate text-sm font-medium text-white'>Media Preview</p>
                <a
                  href={previewMedia.url}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/6 px-2.5 py-1.5 text-xs text-white hover:bg-white/12'
                >
                  <ExternalLink className='h-3.5 w-3.5' />
                  New tab
                </a>
              </div>

              <div className='relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black/40 p-3 sm:p-5'>
                {previewMedia.isVideo ? (
                  <video
                    src={previewMedia.url}
                    controls
                    playsInline
                    preload='metadata'
                    className='max-h-full max-w-full rounded-md object-contain'
                  />
                ) : (
                  <img
                    src={previewMedia.url}
                    alt='Preview'
                    className='max-h-full max-w-full rounded-md object-contain'
                  />
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
