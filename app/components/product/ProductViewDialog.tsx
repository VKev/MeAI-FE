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
import { Calendar, FileText, Hash, Paperclip } from 'lucide-react';

interface ProductViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Post | null;
  onEdit: (product: Post) => void;
}

function formatDate(value: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

export default function ProductViewDialog({ open, onOpenChange, product, onEdit }: ProductViewDialogProps) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl border border-white/15 bg-[#060912] text-white'>
        <DialogHeader>
          <DialogTitle className='line-clamp-1'>{product.title || 'Untitled post'}</DialogTitle>
          <DialogDescription className='text-slate-400'>View full product details before editing.</DialogDescription>
        </DialogHeader>

        <div className='grid gap-6 md:grid-cols-2'>
          <div className='space-y-4 rounded-xl border border-white/10 bg-white/3 p-4'>
            <p className='text-xs uppercase tracking-wide text-slate-400'>General</p>
            <div className='space-y-2 text-sm'>
              <p>
                <span className='text-slate-400'>Status:</span>{' '}
                <span className='capitalize text-white'>{product.status || 'unknown'}</span>
              </p>
              <p>
                <span className='text-slate-400'>Platform:</span>{' '}
                <span className='capitalize text-white'>{product.publications?.[0]?.socialMediaType || 'unknown'}</span>
              </p>
              <p>
                <span className='text-slate-400'>Created:</span>{' '}
                <span className='text-white'>{formatDate(product.createdAt)}</span>
              </p>
              <p>
                <span className='text-slate-400'>Updated:</span>{' '}
                <span className='text-white'>{formatDate(product.updatedAt)}</span>
              </p>
            </div>
          </div>

          <div className='space-y-4 rounded-xl border border-white/10 bg-white/3 p-4'>
            <p className='text-xs uppercase tracking-wide text-slate-400'>Content Stats</p>
            <div className='grid grid-cols-2 gap-3 text-sm'>
              <div className='rounded-lg border border-white/10 bg-black/20 p-3'>
                <p className='text-slate-400'>Hashtags</p>
                <p className='mt-1 text-lg font-semibold text-white'>
                  {(product.content?.hashtag || '').split(' ').filter((h) => h.startsWith('#')).length}
                </p>
              </div>
              <div className='rounded-lg border border-white/10 bg-black/20 p-3'>
                <p className='text-slate-400'>Attachments</p>
                <p className='mt-1 text-lg font-semibold text-white'>{product.media?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className='space-y-4 rounded-xl border border-white/10 bg-white/3 p-4'>
          <div className='flex items-center gap-2 text-sm font-semibold text-white'>
            <FileText className='h-4 w-4 text-slate-400' />
            Content
          </div>
          <p className='whitespace-pre-wrap text-sm leading-6 text-slate-200'>
            {product.content?.content || 'No content'}
          </p>

          {product.content?.hashtag && (
            <div className='pt-2'>
              <div className='mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400'>
                <Hash className='h-3.5 w-3.5' />
                Hashtags
              </div>
              <p className='text-sm text-violet-300'>{product.content.hashtag}</p>
            </div>
          )}
        </div>

        {product.media && product.media.length > 0 && (
          <div className='space-y-3 rounded-xl border border-white/10 bg-white/3 p-4'>
            <div className='flex items-center gap-2 text-sm font-semibold text-white'>
              <Paperclip className='h-4 w-4 text-slate-400' />
              Media
            </div>
            <div className='grid gap-3 sm:grid-cols-2 md:grid-cols-3'>
              {product.media.map((m) => {
                const isVideo = m.resourceType === 'video' || m.contentType?.startsWith('video/');
                return (
                  <div key={m.resourceId} className='overflow-hidden rounded-lg border border-white/10 bg-black'>
                    {isVideo ? (
                      <video src={m.presignedUrl} className='h-32 w-full object-cover' muted />
                    ) : (
                      <img src={m.presignedUrl} alt='' className='h-32 w-full object-cover' />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            className='border-white/15 bg-white/5 text-white hover:bg-white/10'
          >
            Close
          </Button>
          {/* status draft thì mới show edit */}
          {product.status === 'draft' && (
            <Button onClick={() => onEdit(product)} className='bg-violet-600 text-white hover:bg-violet-500'>
              Edit Product
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
