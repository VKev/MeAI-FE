import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import MediaModal from './MediaModal';
import PromptTextarea from './PromptTextarea';
import SelectedMediaStrip from './SelectedMediaStrip';
import type { MediaItem } from './media-types';
import { fetchResources, uploadResource } from '@/services/client/resource.client';
import type { Resource, ResourceCursor } from '@/models/resource.model';
import { toast } from 'sonner';
import type { VideoGenerationType, VideoReferenceInputOption } from '@/routes/workspace/config';

interface PromptInputProps {
  prompt: string;
  setPrompt: (text: string) => void;
  handleGenerate: (resourceIds: string[]) => void;
  isGenerating: boolean;
  costCoins?: number;
  onReferenceResourceIdsChange?: (resourceIds: string[]) => void;
  mediaConfig?: {
    options: readonly VideoReferenceInputOption[];
    selected: VideoReferenceInputOption;
    onSelect: (generationType: VideoGenerationType) => void;
  };
}

const MAX_PROMPT_LENGTH = 1000;
const DEFAULT_MAX_SELECTED = 3;
const RESOURCE_PAGE_SIZE = 20;
const FILE_INPUT_ACCEPT = 'image/png,image/jpeg,image/jpg,image/webp';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function isImageResource(resource: Resource): boolean {
  if (resource.contentType?.startsWith('image/')) return true;
  const type = resource.resourceType?.toUpperCase();
  if (type === 'IMAGE') return true;
  return false;
}

function isUserUpload(resource: Resource): boolean {
  return resource.originKind !== 'ai_generated' && resource.originKind !== 'ai_imported_url';
}

function resourceToMediaItem(resource: Resource): MediaItem {
  return {
    id: resource.id,
    url: resource.link,
    source: 'resource'
  };
}

export default function PromptInput({
  prompt,
  setPrompt,
  handleGenerate,
  isGenerating,
  costCoins,
  onReferenceResourceIdsChange,
  mediaConfig
}: PromptInputProps) {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<MediaItem[]>([]);
  const [draftSelections, setDraftSelections] = useState<MediaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'user' | 'ai'>('user');
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const maxSelected = mediaConfig?.selected.maxSelected ?? DEFAULT_MAX_SELECTED;
  const minSelected = mediaConfig?.selected.minSelected ?? 0;

  // Infinite query for resources
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['media-modal-resources'],
    initialPageParam: null as ResourceCursor | null,
    refetchOnWindowFocus: false,
    queryFn: ({ pageParam, signal }) =>
      fetchResources({
        limit: RESOURCE_PAGE_SIZE,
        cursor: pageParam ?? undefined,
        signal
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.value.length < RESOURCE_PAGE_SIZE) {
        return null;
      }

      const lastItem = lastPage.value[lastPage.value.length - 1];

      if (!lastItem?.createdAt || !lastItem?.id) {
        return null;
      }

      return {
        cursorCreatedAt: lastItem.createdAt,
        cursorId: lastItem.id
      };
    }
  });

  // Get all resources from pages
  const allResources = useMemo(() => data?.pages.flatMap((page) => page.value) ?? [], [data]);

  // Filter resources by tab and image type
  const userUploadImages = useMemo(() => {
    return allResources.filter((r) => isImageResource(r) && isUserUpload(r)).map(resourceToMediaItem);
  }, [allResources]);

  const aiGenerationImages = useMemo(() => {
    return allResources.filter((r) => isImageResource(r) && !isUserUpload(r)).map(resourceToMediaItem);
  }, [allResources]);

  // Get current tab items
  const resourceItems = activeTab === 'user' ? userUploadImages : aiGenerationImages;
  const totalSelectedCount = selectedImages.length + draftSelections.length;
  const canSelectMore = totalSelectedCount < maxSelected;

  useEffect(() => {
    onReferenceResourceIdsChange?.(selectedImages.map((item) => item.id));
  }, [onReferenceResourceIdsChange, selectedImages]);

  useEffect(() => {
    setSelectedImages((prev) => (prev.length > maxSelected ? prev.slice(0, maxSelected) : prev));
    setDraftSelections((prev) => (prev.length > maxSelected ? prev.slice(0, maxSelected) : prev));
  }, [maxSelected]);

  const toggleDraftSelection = (item: MediaItem) => {
    if (selectedImages.some((s) => s.id === item.id)) return;

    setDraftSelections((prev) => {
      const exists = prev.some((d) => d.id === item.id);
      if (exists) {
        return prev.filter((d) => d.id !== item.id);
      }
      if (selectedImages.length + prev.length >= maxSelected) return prev;
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
      const remaining = maxSelected - prev.length;
      const toAdd = draftSelections.filter((d) => !prev.some((s) => s.id === d.id)).slice(0, remaining);
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

      // Invalidate and refetch to get updated list
      await queryClient.invalidateQueries({ queryKey: ['media-modal-resources'] });

      // Auto-select if there's room
      if (selectedImages.length + draftSelections.length < maxSelected) {
        setDraftSelections((prev) => [...prev, newItem]);
      }

      toast.success('Image uploaded successfully');
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

  const handleGenerateWithClear = () => {
    const selectedResourceIds = selectedImages.map((item) => item.id);
    if (selectedResourceIds.length < minSelected) {
      toast.error(`${mediaConfig?.selected.label ?? 'Image input'} requires ${minSelected} image.`);
      return;
    }

    setSelectedImages([]);
    handleGenerate(selectedResourceIds);
  };

  const getSelectedItemLabel = (index: number) => {
    const labels = mediaConfig?.selected.itemLabels;
    if (labels?.[index]) return labels[index];

    const prefix = mediaConfig?.selected.itemLabelPrefix;
    return prefix ? `${prefix} ${index + 1}` : undefined;
  };

  return (
    <div className='relative'>
      <input
        ref={fileInputRef}
        type='file'
        size={MAX_FILE_SIZE}
        accept={FILE_INPUT_ACCEPT}
        onChange={handleUploadImage}
        className='hidden'
      />

      {mediaConfig && (
        <div className='mb-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3'>
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <div>
              <p className='text-xs font-medium text-slate-200'>Image guidance</p>
              <p className='mt-1 text-[11px] text-slate-500'>{mediaConfig.selected.description}</p>
            </div>
            <span className='text-[11px] text-slate-500'>
              {selectedImages.length}/{maxSelected} images
            </span>
          </div>
          {mediaConfig.options.length > 1 && (
            <div className='mt-3 flex flex-wrap gap-2'>
              {mediaConfig.options.map((option) => (
                <button
                  key={option.generationType}
                  type='button'
                  onClick={() => mediaConfig.onSelect(option.generationType)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
                    option.generationType === mediaConfig.selected.generationType
                      ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                      : 'border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <PromptTextarea
        prompt={prompt}
        onPromptChange={setPrompt}
        maxLength={MAX_PROMPT_LENGTH}
        selectedCount={selectedImages.length}
        onOpenMediaModal={handleOpenMediaModal}
        onGenerate={handleGenerateWithClear}
        isGenerateDisabled={!prompt.trim() || selectedImages.length < minSelected}
        isMediaDisabled={selectedImages.length >= maxSelected}
        isGenerating={isGenerating}
        costCoins={costCoins}
      />

      <SelectedMediaStrip selectedItems={selectedImages} onRemove={handleRemoveSelected} getItemLabel={getSelectedItemLabel} />

      <MediaModal
        isOpen={isMediaModalOpen}
        userUploadItems={userUploadImages}
        aiGenerationItems={aiGenerationImages}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedItems={selectedImages}
        draftSelections={draftSelections}
        canSelectMore={canSelectMore}
        maxSelected={maxSelected}
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
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        isUploading={isUploading}
        hasNextPage={hasNextPage}
        onLoadMore={() => fetchNextPage()}
      />
    </div>
  );
}
