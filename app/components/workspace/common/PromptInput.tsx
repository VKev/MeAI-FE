import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ImagePlusIcon, SparklesIcon, Trash2Icon } from 'lucide-react';

interface PromptInputProps {
  prompt: string;
  setPrompt: (text: string) => void;
  handleGenerate: () => void;
}

const MAX_PROMPT_LENGTH = 600;

type MediaSource = 'upload' | 'generation';

type MediaItem = {
  id: string;
  url: string;
  source: MediaSource;
  isObjectUrl?: boolean;
};

const GENERATION_IMAGES: MediaItem[] = [
  {
    id: 'gen-1',
    url: 'https://cdn.leonardo.ai/users/61b12163-b5db-448c-9fc7-816eba537f81/generations/17fe4c94-9560-4e79-8468-f70f08e95b10/segments/1:1:1/Lucid_Origin_bmw_530i_with_sleek_red_metal_color_featuring_a_p_0.jpg',
    source: 'generation'
  },
  {
    id: 'gen-2',
    url: 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=600&q=80',
    source: 'generation'
  }
];

export default function PromptInput({ prompt, setPrompt, handleGenerate }: PromptInputProps) {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<'uploads' | 'generations'>('uploads');
  const [uploadedImages, setUploadedImages] = useState<MediaItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const [draftSelection, setDraftSelection] = useState<MediaItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const visibleGalleryItems = useMemo(
    () => (activeMediaTab === 'uploads' ? uploadedImages : GENERATION_IMAGES),
    [activeMediaTab, uploadedImages]
  );

  useEffect(() => {
    return () => {
      uploadedImages.forEach((item) => {
        if (item.isObjectUrl) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [uploadedImages]);

  const toggleDraftSelection = (item: MediaItem) => {
    setDraftSelection((prev) => (prev?.id === item.id ? null : item));
  };

  const handleOpenMediaModal = () => {
    setDraftSelection(selectedImage);
    setIsMediaModalOpen(true);
  };

  const handleCloseMediaModal = () => {
    setDraftSelection(selectedImage);
    setIsMediaModalOpen(false);
  };

  const handleConfirmSelection = () => {
    setSelectedImage(draftSelection);
    setIsMediaModalOpen(false);
  };

  const handleUploadImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const newImage: MediaItem = {
      id: crypto.randomUUID(),
      url: objectUrl,
      source: 'upload',
      isObjectUrl: true
    };

    setUploadedImages((prev) => [newImage, ...prev]);
    setDraftSelection(newImage);
    event.target.value = '';
  };

  const handleDeleteSelectedUpload = () => {
    if (!draftSelection || draftSelection.source !== 'upload') {
      return;
    }

    setUploadedImages((prev) => {
      const itemToDelete = prev.find((item) => item.id === draftSelection.id);
      if (itemToDelete?.isObjectUrl) {
        URL.revokeObjectURL(itemToDelete.url);
      }
      return prev.filter((item) => item.id !== draftSelection.id);
    });

    if (selectedImage?.id === draftSelection.id) {
      setSelectedImage(null);
    }

    setDraftSelection(null);
  };

  return (
    <div className='relative'>
      <input
        ref={fileInputRef}
        type='file'
        accept='image/png,image/jpeg,image/webp'
        onChange={handleUploadImage}
        className='hidden'
      />

      <Textarea
        value={prompt}
        onChange={(e) => {
          setPrompt(e.target.value);
        }}
        maxLength={MAX_PROMPT_LENGTH}
        placeholder='Type a prompt...'
        className={cn(
          'w-full bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 shadow-none focus-visible:shadow-none focus:border-purple-600 focus-visible:border-purple-600 focus:ring-0 focus-visible:ring-0 pr-31 pl-15 resize-none wrap-break-words whitespace-pre-wrap overflow-hidden',
          selectedImage ? 'min-h-44 pb-24' : 'min-h-13 pb-10'
        )}
      />

      <Button
        type='button'
        variant='outline'
        size='icon-lg'
        onClick={handleOpenMediaModal}
        disabled={Boolean(selectedImage)}
        className='absolute left-2 top-3 border-gray-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50'
        aria-label='Open image selector'
      >
        <ImagePlusIcon className='w-5 h-5' />
      </Button>

      {selectedImage ? (
        <div className='group absolute left-2 bottom-3 h-16 w-16 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900'>
          <img src={selectedImage.url} alt='Selected prompt image' className='h-full w-full object-cover' />
          <button
            type='button'
            onClick={() => setSelectedImage(null)}
            className='absolute inset-0 flex items-center justify-center bg-black/65 text-white opacity-0 transition-opacity group-hover:opacity-100'
            aria-label='Remove selected image'
          >
            <Trash2Icon className='h-4 w-4' />
          </button>
        </div>
      ) : null}

      <div className='absolute right-36 bottom-3 text-xs text-gray-400'>
        {prompt.length} / {MAX_PROMPT_LENGTH}
      </div>
      <Button
        variant={'default'}
        onClick={handleGenerate}
        disabled={!prompt.trim()}
        className='absolute right-2 bottom-2 cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 disabled:opacity-50 disabled:cursor-not-allowed'
      >
        <SparklesIcon className='w-4 h-4 mr-2' />
        Generate
      </Button>

      <Dialog
        open={isMediaModalOpen}
        onOpenChange={(open) => {
          if (open) {
            setDraftSelection(selectedImage);
            setIsMediaModalOpen(true);
            return;
          }
          handleCloseMediaModal();
        }}
      >
        <DialogContent className='w-7xl h-[90vh] border-zinc-800 bg-zinc-950 p-0 text-zinc-100'>
          <DialogHeader className='border-b border-zinc-800 px-6 py-4'>
            <DialogTitle>Select Media</DialogTitle>
          </DialogHeader>

          <div className='flex-1 overflow-hidden px-6 pt-4'>
            <Tabs
              value={activeMediaTab}
              onValueChange={(value) => setActiveMediaTab(value as 'uploads' | 'generations')}
            >
              <TabsList variant='line' className='bg-transparent border-none p-0 h-auto gap-2'>
                <TabsTrigger
                  value='uploads'
                  className='rounded-none border-0 border-b-2 border-transparent px-2 py-2 text-zinc-400 hover:text-white data-[state=active]:border-purple-500 data-[state=active]:text-white data-[state=active]:bg-transparent'
                >
                  Your Uploads
                </TabsTrigger>
                <TabsTrigger
                  value='generations'
                  className='rounded-none border-0 border-b-2 border-transparent px-2 py-2 text-zinc-400 hover:text-white data-[state=active]:border-purple-500 data-[state=active]:text-white data-[state=active]:bg-transparent'
                >
                  Your Generations
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className='mt-5 h-[calc(90vh-220px)] min-h-64 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4'>
              <div className='flex flex-wrap gap-4'>
                {activeMediaTab === 'uploads' ? (
                  <button
                    type='button'
                    onClick={() => fileInputRef.current?.click()}
                    className='flex h-45 w-45 shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/70 text-zinc-300 transition-colors hover:border-purple-500 hover:text-white'
                  >
                    <ImagePlusIcon className='h-5 w-5' />
                    <span className='text-sm'>Upload image</span>
                  </button>
                ) : null}

                {visibleGalleryItems.map((item) => {
                  const isSelected = draftSelection?.id === item.id;

                  return (
                    <button
                      key={item.id}
                      type='button'
                      onClick={() => toggleDraftSelection(item)}
                      className={cn(
                        'relative h-45 w-45 shrink-0 overflow-hidden rounded-lg border bg-zinc-900',
                        isSelected
                          ? 'border-purple-500 ring-2 ring-purple-500/40'
                          : 'border-zinc-700 hover:border-zinc-500'
                      )}
                    >
                      <img src={item.url} alt='Gallery media item' className='h-full w-full object-cover' />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className='mt-2 flex items-center justify-between border-t border-zinc-800 px-6 py-4'>
            <Button
              type='button'
              variant='outline'
              onClick={handleCloseMediaModal}
              className='min-w-36 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-white'
            >
              Cancel
            </Button>

            <div className='flex items-center gap-3'>
              {activeMediaTab === 'uploads' ? (
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  onClick={handleDeleteSelectedUpload}
                  disabled={!draftSelection || draftSelection.source !== 'upload'}
                  className='border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800'
                  aria-label='Delete selected uploaded image'
                >
                  <Trash2Icon className='h-4 w-4' />
                </Button>
              ) : null}

              <Button
                type='button'
                onClick={handleConfirmSelection}
                disabled={!draftSelection}
                className='min-w-36 bg-purple-600 text-white hover:bg-purple-700'
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
