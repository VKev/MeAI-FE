import type { Post } from '@/models/post.model';
import { CheckCircle2, Globe2, ImageIcon, ExternalLink, Maximize2, Play } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MenuBar } from '@/components/rich-text-editor/MenuBar';

interface Props {
  post: Post;
  contentValue?: string;
  onContentChange?: (value: string) => void;
}

type PreviewMedia = {
  resourceId: string;
  presignedUrl: string;
  contentType: string | null;
  resourceType: string | null;
};

export default function AIRecommendedPostPanel({ post, contentValue, onContentChange }: Props) {
  const [previewMedia, setPreviewMedia] = useState<PreviewMedia | null>(null);

  const isPreviewImage =
    previewMedia?.resourceType?.toLowerCase() === 'image' || previewMedia?.contentType?.startsWith('image/');
  const isPreviewVideo =
    previewMedia?.resourceType?.toLowerCase() === 'video' || previewMedia?.contentType?.startsWith('video/');

  const initialCombined = useMemo(
    () => [post.content?.content || '', post.content?.hashtag || ''].filter(Boolean).join('\n\n'),
    [post]
  );

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

  const isImage =
    !!previewMedia &&
    (previewMedia.resourceType?.toLowerCase() === 'image' || previewMedia.contentType?.startsWith('image/'));
  const isVideo =
    !!previewMedia &&
    (previewMedia.resourceType?.toLowerCase() === 'video' || previewMedia.contentType?.startsWith('video/'));

  return (
    <section className='overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.96)_100%)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]'>
      <div className='border-b border-white/8 px-6 py-5'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <div className='rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300'>
                AI Recommended
              </div>
            </div>

            <div>
              <h2 className='text-2xl font-semibold tracking-tight text-white'>{post.title}</h2>
              <p className='mt-1 text-sm text-slate-400'>AI-generated recommendation ready for publishing workflow.</p>
            </div>
          </div>
        </div>
      </div>

      <div className='space-y-6 px-6 py-6'>
        {/* Content */}
        <div className='rounded-3xl border border-white/8 bg-white/3 p-5'>
          <div className='mb-4 flex items-center gap-2'>
            <Globe2 className='h-4 w-4 text-slate-400' />
            <h3 className='text-sm font-semibold text-white'>Post Content</h3>
          </div>

          <div className='mb-6 space-y-2'>
            <textarea
              value={combinedContent}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder='Write your post content here. You can include hashtags too.'
              className='min-h-48 w-full resize-none rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,20,0.82)_0%,rgba(8,10,16,0.9)_100%)] p-4 text-sm text-slate-200 placeholder-slate-500 transition-colors focus:border-white/30 focus:bg-white/5 focus:outline-none'
            />
          </div>
        </div>

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <div className='rounded-3xl border border-white/8 bg-white/3 p-5'>
            <div className='mb-4 flex items-center gap-2'>
              <ImageIcon className='h-4 w-4 text-slate-400' />
              <h3 className='text-sm font-semibold text-white'>Media Resources</h3>
            </div>

            <div className={`grid gap-3 grid-cols-3`}>
              {post.media.map((item, i) => (
                <button
                  key={i}
                  type='button'
                  onClick={() => setPreviewMedia(item)}
                  className='group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black transition-all hover:border-white/30 hover:shadow-lg cursor-zoom-in'
                >
                  {item.resourceType?.toLowerCase() === 'video' ? (
                    <video
                      src={item.presignedUrl}
                      className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-110'
                      muted
                      preload='metadata'
                    />
                  ) : (
                    <img
                      src={item.presignedUrl}
                      alt=''
                      className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-110'
                    />
                  )}

                  <div className='absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20 flex items-center justify-center'>
                    <div className='opacity-0 transition-opacity group-hover:opacity-100'>
                      {item.resourceType?.toLowerCase() === 'video' || item.contentType?.startsWith('video/') ? (
                        <Play className='h-8 w-8 text-white' />
                      ) : (
                        <Maximize2 className='h-8 w-8 text-white' />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview dialog */}
      <Dialog
        open={Boolean(previewMedia)}
        onOpenChange={(open) => {
          if (!open) setPreviewMedia(null);
        }}
      >
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
    </section>
  );
}
