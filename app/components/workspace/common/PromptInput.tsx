import { useCallback, useEffect, useRef, useState } from 'react';
import MediaModal from './MediaModal';
import PromptTextarea from './PromptTextarea';
import SelectedMediaStrip from './SelectedMediaStrip';
import type { MediaItem } from './media-types';
import { fetchResources, uploadResource } from '@/services/client/resource.client';
import type { Resource, ResourceCursor } from '@/models/resource.model';
import { toast } from 'sonner';

interface PromptInputProps {
  prompt: string;
  setPrompt: (text: string) => void;
  handleGenerate: () => void;
  isGenerating: boolean;
  costCoins?: number;
}

const MAX_PROMPT_LENGTH = 600;
const MAX_SELECTED = 3;
const RESOURCE_PAGE_SIZE = 40;

function isVisualResource(resource: Resource): boolean {
  if (resource.contentType?.startsWith('image/')) return true;
  if (resource.contentType?.startsWith('video/')) return true;
  const type = resource.resourceType?.toUpperCase();
  if (type === 'IMAGE' || type === 'VIDEO') return true;
  return false;
}

function isVideoResource(resource: Resource): boolean {
  if (resource.contentType?.startsWith('video/')) return true;
  if (resource.resourceType?.toUpperCase() === 'VIDEO') return true;
  return false;
}

function resourceToMediaItem(resource: Resource): MediaItem {
  return {
    id: resource.id,
    url: resource.link,
    source: 'resource',
    isVideo: isVideoResource(resource)
  };
}

export default function PromptInput({ prompt, setPrompt, handleGenerate, isGenerating, costCoins }: PromptInputProps) {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<MediaItem[]>([]);
  const [draftSelections, setDraftSelections] = useState<MediaItem[]>([]);

  // Resource library state
  const [resourceItems, setResourceItems] = useState<MediaItem[]>([]);
  const [resourceCursor, setResourceCursor] = useState<ResourceCursor | null>(null);
  const [hasMoreResources, setHasMoreResources] = useState(true);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadResources = useCallback(async (cursor?: ResourceCursor | null) => {
    if (isLoadingResources) return;
    setIsLoadingResources(true);

    try {
      const response = await fetchResources({
        limit: RESOURCE_PAGE_SIZE,
        cursor: cursor ?? undefined
      });

      const imageResources = response.value
        .filter(isVisualResource)
        .map(resourceToMediaItem);

      setResourceItems((prev) => cursor ? [...prev, ...imageResources] : imageResources);

      if (response.value.length < RESOURCE_PAGE_SIZE) {
        setHasMoreResources(false);
        setResourceCursor(null);
      } else {
        const lastResource = response.value[response.value.length - 1];
        setResourceCursor(
          lastResource.createdAt
            ? { cursorCreatedAt: lastResource.createdAt, cursorId: lastResource.id }
            : null
        );
      }
    } catch {
      // Silently handle
    } finally {
      setIsLoadingResources(false);
      setResourcesLoaded(true);
    }
  }, [isLoadingResources]);

  const loadMoreResources = useCallback(() => {
    if (hasMoreResources && resourceCursor && !isLoadingResources) {
      loadResources(resourceCursor);
    }
  }, [hasMoreResources, resourceCursor, isLoadingResources, loadResources]);

  // Load resources when modal opens for the first time
  useEffect(() => {
    if (isMediaModalOpen && !resourcesLoaded && !isLoadingResources) {
      loadResources(null);
    }
  }, [isMediaModalOpen, resourcesLoaded, isLoadingResources, loadResources]);

  const totalSelectedCount = selectedImages.length + draftSelections.length;
  const canSelectMore = totalSelectedCount < MAX_SELECTED;

  const toggleDraftSelection = (item: MediaItem) => {
    if (selectedImages.some((s) => s.id === item.id)) return;

    setDraftSelections((prev) => {
      const exists = prev.some((d) => d.id === item.id);
      if (exists) {
        return prev.filter((d) => d.id !== item.id);
      }
      if (selectedImages.length + prev.length >= MAX_SELECTED) return prev;
      return [...prev, item];
    });
  };

  const handleOpenMediaModal = () => {
    setDraftSelections([]);
    setIsMediaModalOpen(true);
  };

  const handleCloseMediaModal = () => {
    setDraftSelections([]);
    setIsMediaModalOpen(false);
  };

  const handleConfirmSelection = () => {
    if (draftSelections.length === 0) return;

    setSelectedImages((prev) => {
      const remaining = MAX_SELECTED - prev.length;
      const toAdd = draftSelections
        .filter((d) => !prev.some((s) => s.id === d.id))
        .slice(0, remaining);
      return [...prev, ...toAdd];
    });

    setDraftSelections([]);
    setIsMediaModalOpen(false);
  };

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';

    setIsUploading(true);
    try {
      const resource = await uploadResource(file, 'IMAGE');
      const newItem: MediaItem = {
        id: resource.id,
        url: resource.link,
        source: 'resource'
      };

      // Add to the top of the gallery
      setResourceItems((prev) => [newItem, ...prev]);

      // Auto-select if there's room
      if (selectedImages.length + draftSelections.length < MAX_SELECTED) {
        setDraftSelections((prev) => [...prev, newItem]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveSelected = (id: string) => {
    setSelectedImages((prev) => prev.filter((s) => s.id !== id));
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
        isMediaDisabled={selectedImages.length >= MAX_SELECTED}
        isGenerating={isGenerating}
        costCoins={costCoins}
      />

      <SelectedMediaStrip selectedItems={selectedImages} onRemove={handleRemoveSelected} />

      <MediaModal
        isOpen={isMediaModalOpen}
        items={resourceItems}
        selectedItems={selectedImages}
        draftSelections={draftSelections}
        canSelectMore={canSelectMore}
        onOpenChange={(open) => {
          if (open) {
            setDraftSelections([]);
            setIsMediaModalOpen(true);
            return;
          }
          handleCloseMediaModal();
        }}
        onSelectItem={toggleDraftSelection}
        onUploadClick={() => fileInputRef.current?.click()}
        onClose={handleCloseMediaModal}
        onConfirm={handleConfirmSelection}
        confirmDisabled={draftSelections.length === 0}
        isLoadingResources={isLoadingResources}
        isUploading={isUploading}
        hasMoreResources={hasMoreResources}
        onLoadMoreResources={loadMoreResources}
      />
    </div>
  );
}
