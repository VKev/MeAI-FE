import type { Post } from '@/models/post.model';
import { CheckCircle2, Globe2, ImageIcon, ExternalLink, Maximize2, Play } from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useState } from 'react';
import { MenuBar } from '@/components/rich-text-editor/MenuBar';

interface Props {
  post: Post;
}

type PreviewMedia = {
  resourceId: string;
  presignedUrl: string;
  contentType: string | null;
  resourceType: string | null;
};

export default function AIRecommendedPostPanel({ post }: Props) {
  const [previewMedia, setPreviewMedia] = useState<PreviewMedia | null>(null);

  const contentWithHashtag =
    post.content?.content && post.content.hashtag
      ? `${post.content.content}\n\n\n<strong>${post.content.hashtag}</strong>`
      : post.content?.content || '';

  const editor = useEditor({
    extensions: [StarterKit],
    content: contentWithHashtag ? `<p>${contentWithHashtag.split('\n').join('</p><p>')}</p>` : '',
    immediatelyRender: false,
    editable: true
  });

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
            <MenuBar editor={editor} />
            <EditorContent
              editor={editor}
              onClick={() => {
                editor?.chain().focus().run();
              }}
              className='post-builder-editor text-slate-200 rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,20,0.82)_0%,rgba(8,10,16,0.9)_100%)]'
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

            <div
              className={`grid gap-3 ${
                post.media.length === 1
                  ? 'grid-cols-1'
                  : post.media.length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-2 xl:grid-cols-3'
              }`}
            >
              {post.media.map((item, i) => (
                <button
                  key={i}
                  type='button'
                  onClick={() => setPreviewMedia(item)}
                  className='group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black transition-all hover:border-white/30 hover:shadow-lg cursor-zoom-in h-50'
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
        <DialogContent className='h-[96vh] w-[98vw] max-w-none overflow-hidden border border-white/15 bg-[#060912] p-0'>
          {previewMedia && (
            <div className='flex h-full flex-col'>
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

              <div
                className={`relative flex min-h-0 flex-1 ${isVideo ? 'overflow-auto bg-black p-3' : 'items-center justify-center bg-black/40 p-3 sm:p-5'}`}
              >
                {isImage ? (
                  <img
                    src={previewMedia.presignedUrl}
                    alt='Preview'
                    className='max-h-[76vh] w-auto max-w-full rounded-md object-contain'
                  />
                ) : isVideo ? (
                  <video
                    src={previewMedia.presignedUrl}
                    controls
                    playsInline
                    preload='metadata'
                    className='block h-auto w-full max-w-full rounded-md'
                  />
                ) : null}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
