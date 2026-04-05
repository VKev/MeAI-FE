import { useEffect, useMemo, useRef, useState } from 'react';
import MediaModal from './MediaModal';
import PromptTextarea from './PromptTextarea';
import SelectedMediaStrip from './SelectedMediaStrip';
import type { MediaItem, MediaTab } from './media-types';

interface PromptInputProps {
  prompt: string;
  setPrompt: (text: string) => void;
  handleGenerate: () => void;
  isGenerating: boolean;
}

const MAX_PROMPT_LENGTH = 600;

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
  },
  {
    id: 'gen-3',
    url: 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=600&q=80',
    source: 'generation'
  },
  {
    id: 'gen-4',
    url: 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=600&q=80',
    source: 'generation'
  },
  {
    id: 'gen-5',
    url: 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=600&q=80',
    source: 'generation'
  }
];

export default function PromptInput({ prompt, setPrompt, handleGenerate, isGenerating }: PromptInputProps) {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<MediaTab>('uploads');
  const [uploadedImages, setUploadedImages] = useState<MediaItem[]>([]);
  const [selectedImages, setSelectedImages] = useState<MediaItem[]>([]);
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
    const isAlreadySelected = selectedImages.some((selectedItem) => selectedItem.id === item.id);
    if (isAlreadySelected) {
      return;
    }

    setDraftSelection((prev) => (prev?.id === item.id ? null : item));
  };

  const handleOpenMediaModal = () => {
    setDraftSelection(null);
    setIsMediaModalOpen(true);
  };

  const handleCloseMediaModal = () => {
    setDraftSelection(null);
    setIsMediaModalOpen(false);
  };

  const handleConfirmSelection = () => {
    if (!draftSelection) {
      return;
    }

    setSelectedImages((prev) => {
      if (prev.length >= 3) {
        return prev;
      }

      const isExisted = prev.some((item) => item.id === draftSelection.id);
      if (isExisted) {
        return prev;
      }

      return [...prev, draftSelection];
    });

    setDraftSelection(null);
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

    setSelectedImages((prev) => prev.filter((item) => item.id !== draftSelection.id));

    setDraftSelection(null);
  };

  const handleRemoveSelected = (id: string) => {
    setSelectedImages((prev) => prev.filter((selectedItem) => selectedItem.id !== id));
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

      <PromptTextarea
        prompt={prompt}
        onPromptChange={setPrompt}
        maxLength={MAX_PROMPT_LENGTH}
        selectedCount={selectedImages.length}
        onOpenMediaModal={handleOpenMediaModal}
        onGenerate={handleGenerate}
        isGenerateDisabled={!prompt.trim()}
        isMediaDisabled={selectedImages.length >= 3}
        isGenerating={isGenerating}
      />

      <SelectedMediaStrip selectedItems={selectedImages} onRemove={handleRemoveSelected} />

      <MediaModal
        isOpen={isMediaModalOpen}
        activeMediaTab={activeMediaTab}
        items={visibleGalleryItems}
        selectedItems={selectedImages}
        draftSelection={draftSelection}
        onOpenChange={(open) => {
          if (open) {
            setDraftSelection(null);
            setIsMediaModalOpen(true);
            return;
          }
          handleCloseMediaModal();
        }}
        onTabChange={setActiveMediaTab}
        onSelectItem={toggleDraftSelection}
        onUploadClick={() => fileInputRef.current?.click()}
        onClose={handleCloseMediaModal}
        onConfirm={handleConfirmSelection}
        confirmDisabled={!draftSelection || selectedImages.length >= 3}
        onDeleteSelectedUpload={handleDeleteSelectedUpload}
        deleteDisabled={!draftSelection || draftSelection.source !== 'upload'}
      />
    </div>
  );
}
