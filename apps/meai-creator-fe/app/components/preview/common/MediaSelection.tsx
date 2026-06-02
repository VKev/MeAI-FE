import { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { ImportIcon, Play } from 'lucide-react';
import useMediaResourceStore, { type TMediaResource } from '@/store/media-resource.store';
import usePostBuilder from '@/routes/post-builder/hooks/usePostBuilder';
import DialogImportUserMedia, { type ImportedMedia } from '@/components/preview/common/DialogImportUserMedia';
import { PostBuilderClientApi } from '@/services/client/post-builder.client';
import { resolveMediaFormatLabel } from '@/utils/media-format';

type SelectedIdsUpdater = string[] | ((prev: string[]) => string[]);

type MediaSelectionProps = {
  items: TMediaResource[];
  selectedIds: string[];
  onChangeSelectedIds: (nextIds: SelectedIdsUpdater) => void;
  allowedTypes?: string[];
  maxSelected?: number;
  // When true, selecting an image clears any selected videos (and vice versa).
  mutuallyExclusiveTypes?: boolean;
  title?: string;
  selectedClassName?: string;
  disabledClassName?: string;
  imageClassName?: string;
};

const DEFAULT_SELECTED_CLASS = 'border-purple-500 ring-2 ring-purple-500/40 opacity-90';
const DEFAULT_DISABLED_CLASS = 'cursor-not-allowed border-none opacity-35 grayscale';
const DEFAULT_IMAGE_CLASS = 'transition-transform duration-300 group-hover:scale-[1.03]';

function MediaSelection({
  items,
  selectedIds,
  onChangeSelectedIds,
  allowedTypes,
  maxSelected,
  mutuallyExclusiveTypes = false,
  title = 'Select Your Media',
  selectedClassName = DEFAULT_SELECTED_CLASS,
  disabledClassName = DEFAULT_DISABLED_CLASS,
  imageClassName = DEFAULT_IMAGE_CLASS
}: MediaSelectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const existingResources = useMediaResourceStore((state) => state.mediaResources);
  const setMediaResources = useMediaResourceStore((state) => state.setMediaResources);
  const previewStates = usePostBuilder((state) => state.previewStates);
  // MediaSelection is rendered inside the post-builder route, so the `id` param resolves to
  // the current post-builder. Outside that route `postBuilderId` is undefined and we simply
  // skip the server-side attach.
  const { id: postBuilderId } = useParams();
  const queryClient = useQueryClient();

  const postBuilderResourceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const state of Object.values(previewStates)) {
      for (const modeIds of Object.values(state.selectedMediaIds)) {
        for (const resourceId of modeIds ?? []) {
          ids.add(resourceId);
        }
      }
    }
    return ids;
  }, [previewStates]);

  const excludedResourceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const resource of existingResources) ids.add(resource.id);
    for (const resourceId of postBuilderResourceIds) ids.add(resourceId);
    return Array.from(ids);
  }, [existingResources, postBuilderResourceIds]);

  const isTypeAllowed = (type: string) => {
    if (!allowedTypes || allowedTypes.length === 0) return true;
    return allowedTypes.includes(type);
  };

  const handleImportConfirm = (picked: ImportedMedia[]) => {
    if (picked.length === 0) return;

    // Merge picks into the media-resource store (dedupe by id), drop "other" types, and
    // auto-select the newly-imported ids in the current bucket.
    const addable = picked.filter((item) => item.type === 'image' || item.type === 'video');
    if (addable.length === 0) return;

    const existingIds = new Set(existingResources.map((r) => r.id));
    const toAdd: TMediaResource[] = addable
      .filter((item) => !existingIds.has(item.id))
      .map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        url: item.url,
        thumbnail_url: item.url,
        format: item.format
      }));

    if (toAdd.length > 0) {
      setMediaResources([...existingResources, ...toAdd]);
    }

    // Attach every imported id (image + video, regardless of current bucket type) to the
    // post-builder so the server-side resource_ids reflect what's actually in use. Fire-and-
    // forget; if this fails the user can still publish — the Post-level resource_list on
    // each child post is the publish source of truth.
    if (postBuilderId) {
      const attachIds = addable.map((item) => item.id);
      if (attachIds.length > 0) {
        void PostBuilderClientApi.addPostBuilderResources(postBuilderId, attachIds)
          .then(() => {
            void queryClient.invalidateQueries({ queryKey: ['post-builder', postBuilderId] });
          })
          .catch((err) => {
            console.error('[MediaSelection] failed to attach imports to post-builder:', err);
          });
      }
    }

    const newlySelectableIds = addable.filter((item) => isTypeAllowed(item.type)).map((item) => item.id);

    if (newlySelectableIds.length > 0) {
      onChangeSelectedIds((prev) => {
        const merged = new Set(prev);
        for (const id of newlySelectableIds) {
          if (typeof maxSelected === 'number' && merged.size >= maxSelected) break;
          merged.add(id);
        }
        return Array.from(merged);
      });
    }
  };

  const handleToggle = (item: TMediaResource) => {
    if (!isTypeAllowed(item.type)) return;

    const itemsById = new Map(items.map((i) => [i.id, i]));

    onChangeSelectedIds((prev) => {
      const isSelected = prev.includes(item.id);

      if (maxSelected === 1) {
        return isSelected ? [] : [item.id];
      }

      if (isSelected) {
        return prev.filter((selectedId) => selectedId !== item.id);
      }

      // Enforce image-XOR-video when the caller opted in. Adding a type the prev list
      // doesn't have yet drops every entry of the other type so publish isn't silently
      // blocked by the platform's mixed-media restriction.
      let effectivePrev = prev;
      if (mutuallyExclusiveTypes) {
        effectivePrev = prev.filter((selectedId) => {
          const other = itemsById.get(selectedId);
          return other ? other.type === item.type : true;
        });
      }

      if (typeof maxSelected === 'number' && maxSelected > 1 && effectivePrev.length >= maxSelected) {
        return effectivePrev;
      }

      return [...effectivePrev, item.id];
    });
  };

  return (
    <div className='space-y-5'>
      <div>
        <h3 className='text-md font-semibold text-white'>{title}</h3>
      </div>

      <div className='min-h-50 space-y-2 grid grid-cols-2 gap-3 md:grid-cols-4'>
        <button
          type='button'
          onClick={() => setIsImportOpen(true)}
          className='flex h-45 w-45 shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/70 text-zinc-300 transition-colors hover:border-purple-500 hover:text-white'
        >
          <ImportIcon className='h-5 w-5' />
          <span className='text-sm'>Import from your library</span>
        </button>

        {items.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          const isDisabled = !isTypeAllowed(item.type);

          return (
            <button
              key={item.id}
              type='button'
              onClick={() => handleToggle(item)}
              disabled={isDisabled}
              className={cn(
                'group relative h-45 w-45 aspect-square overflow-hidden rounded-lg border bg-zinc-900 text-left',
                isDisabled && disabledClassName,
                isSelected ? selectedClassName : 'border-zinc-700 hover:border-zinc-500'
              )}
            >
              {item.type === 'video' ? (
                <video
                  ref={videoRef}
                  src={item.url}
                  className='absolute inset-0 h-full w-full object-cover'
                  autoPlay={false}
                  loop={false}
                  muted={true}
                  playsInline={false}
                />
              ) : (
                <img
                  src={item.thumbnail_url}
                  alt={item.name || 'Gallery media item'}
                  className={cn('h-full w-full object-cover', imageClassName)}
                />
              )}

              {item.type === 'video' && (
                <span className='absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white'>
                  <Play className='h-3.5 w-3.5 fill-white text-white' />
                </span>
              )}

              <span className='absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase text-white'>
                {resolveMediaFormatLabel({
                  format: item.format,
                  url: item.url || item.thumbnail_url,
                  fallback: item.type
                })}
              </span>
            </button>
          );
        })}
      </div>

      <DialogImportUserMedia
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        handleAdd={handleImportConfirm}
        allowedTypes={allowedTypes?.filter((t): t is 'image' | 'video' => t === 'image' || t === 'video')}
        excludeIds={excludedResourceIds}
      />
    </div>
  );
}

export default MediaSelection;
