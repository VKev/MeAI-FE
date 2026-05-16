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
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PlatformStack } from '@/components/ui/platform-stack';

interface EditPublishedPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Post | null;
  isLoading?: boolean;
  onSave: (postId: string, content: string, hashtag: string | null) => void;
}

export default function EditPublishedPostDialog({
  open,
  onOpenChange,
  product,
  isLoading = false,
  onSave
}: EditPublishedPostDialogProps) {
  if (!product) return null;

  const [combinedContent, setCombinedContent] = useState<string>(
    [product.content?.content || '', product.content?.hashtag || ''].filter(Boolean).join('\n\n')
  );

  const initialCombined = useMemo(
    () => [product.content?.content || '', product.content?.hashtag || ''].filter(Boolean).join('\n\n'),
    [product]
  );

  const [hasChange, setHasChange] = useState<boolean>(false);

  useEffect(() => {
    setCombinedContent(initialCombined);
    setHasChange(false);
  }, [product, open, initialCombined]);

  const handleSave = useCallback(() => {
    // send combined content in the `content` field; hashtag will be null
    onSave(product.id, combinedContent, null);
  }, [combinedContent, product.id, onSave]);

  useEffect(() => {
    setHasChange(combinedContent !== initialCombined);
  }, [combinedContent, initialCombined]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] min-w-[50vw] max-w-[90vw] overflow-hidden border border-white/15 bg-[#060912] p-0 text-white'>
        <div className='flex h-full flex-col'>
          <DialogHeader className='border-b border-white/10 px-6 py-5 text-left sm:px-8'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div className='min-w-0 space-y-2'>
                <DialogTitle className='text-2xl'>Edit Published Post</DialogTitle>
                <DialogDescription className='text-slate-400'>
                  Update content and hashtags for your published post.
                </DialogDescription>
              </div>

              <div className='flex flex-wrap items-center gap-2'>
                <div className='rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-wide text-emerald-200'>
                  {product.status || 'unknown'}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className='min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8'>
            <div className='space-y-6'>
              {/* Content Editor */}
              <div className='space-y-3'>
                <label className='block text-sm font-semibold text-white'>Content</label>

                <textarea
                  value={combinedContent}
                  onChange={(e) => setCombinedContent(e.target.value)}
                  placeholder='Write your post content here. You can include hashtags too.'
                  className='min-h-48 w-full resize-none rounded-2xl border border-white/10 bg-white/3 p-4 text-sm text-slate-200 placeholder-slate-500 transition-colors focus:border-white/30 focus:bg-white/5 focus:outline-none'
                />
              </div>

              {/* Publications Info */}
              {product.publications && product.publications.length > 0 && (
                <div className='space-y-3'>
                  <div className='flex flex-wrap gap-2'>
                    <PlatformStack publications={product.publications} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className='border-t border-white/10 px-6 py-5 sm:px-8'>
            <Button
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className='border-white/10 hover:bg-white/5'
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChange || isLoading}
              className='gap-2 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/30 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed'
            >
              {isLoading && <Loader2 className='h-4 w-4 animate-spin' />}
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
