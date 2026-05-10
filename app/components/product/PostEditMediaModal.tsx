import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MediaGallery from '@/components/workspace/common/MediaGallery';
import type { MediaItem } from '@/components/workspace/common/media-types';
import { Loader2, Upload } from 'lucide-react';

interface PostEditMediaModalProps {
  isOpen: boolean;
  userUploadItems: MediaItem[];
  aiGenerationItems: MediaItem[];
  activeTab: 'user' | 'ai';
  onTabChange: (tab: 'user' | 'ai') => void;
  selectedItems: MediaItem[];
  draftSelections: MediaItem[];
  canSelectMore: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectItem: (item: MediaItem) => void;
  onUploadClick: () => void;
  onClose: () => void;
  onConfirm: () => void;
  confirmDisabled: boolean;
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  isUploading?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
}

export default function PostEditMediaModal({
  isOpen,
  userUploadItems,
  aiGenerationItems,
  activeTab,
  onTabChange,
  selectedItems,
  draftSelections,
  canSelectMore,
  onOpenChange,
  onSelectItem,
  onUploadClick,
  onClose,
  onConfirm,
  confirmDisabled,
  isLoading,
  isFetchingNextPage,
  isUploading,
  hasNextPage,
  onLoadMore
}: PostEditMediaModalProps) {
  const draftCount = draftSelections.length;
  const totalAfterConfirm = selectedItems.length + draftCount;
  const items = activeTab === 'user' ? userUploadItems : aiGenerationItems;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='min-w-4xl max-w-[60vw] max-h-[95vh] border-white/15 bg-[#060912] p-0 text-white'>
        <DialogHeader className='border-b border-white/10 px-6 py-5'>
          <div className='flex items-center justify-between w-full'>
            <div className='space-y-2'>
              <DialogTitle className='text-2xl'>Import Media</DialogTitle>
              <p className='text-sm text-slate-400'>Choose images or videos to add to your post</p>
            </div>
            <span className='text-sm text-slate-400'>{totalAfterConfirm} selected</span>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className='flex border-b border-white/10 px-6'>
          <button
            onClick={() => onTabChange('user')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'user'
                ? 'border-violet-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Upload className='h-4 w-4' />
            User Uploads
          </button>
          <button
            onClick={() => onTabChange('ai')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'ai'
                ? 'border-violet-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            AI Generations
          </button>
        </div>

        <div className='overflow-y-auto h-[60vh] w-full bg-white/2 p-6'>
          {isLoading ? (
            <div className='flex items-center justify-center py-16'>
              <Loader2 className='h-6 w-6 animate-spin text-violet-500' />
              <span className='ml-3 text-slate-400'>Loading resources...</span>
            </div>
          ) : (
            <MediaGallery
              items={items}
              selectedItems={selectedItems}
              draftSelections={draftSelections}
              canSelectMore={canSelectMore}
              onSelectItem={onSelectItem}
              onUploadClick={onUploadClick}
              isLoading={isLoading}
              isUploading={isUploading}
              hasMore={hasNextPage}
              onLoadMore={onLoadMore}
              isFetchingNextPage={isFetchingNextPage}
              showUploadButton={activeTab === 'user'}
            />
          )}
        </div>

        <DialogFooter className='border-t border-white/10 px-6 py-5 gap-2'>
          <DialogClose asChild>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              className='border-white/10 bg-white/4 text-white/85 hover:bg-white/8 hover:text-white'
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type='button'
            onClick={onConfirm}
            disabled={confirmDisabled}
            className='bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/30 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed'
          >
            {draftCount > 0 ? `Confirm (${draftCount})` : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
