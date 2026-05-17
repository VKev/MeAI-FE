import { useEffect, useMemo, useRef } from 'react';
import type { TPostBuilder, TPostMedia } from '@/models/post-builder.model';
import usePostBuilder from './usePostBuilder';
import useMediaResourceStore, { type TMediaResource } from '@/store/media-resource.store';
import {
  buildPlatformPublishStates,
  buildSavedMediaSelections,
  resolveEnabledPlatforms,
  resolveInitialPlatformModes
} from './publish-utils';

function resolveMediaType(media: TPostMedia): 'image' | 'video' | null {
  const content = media.contentType?.toLowerCase() ?? '';
  const resourceType = media.resourceType?.toLowerCase() ?? '';
  if (content.startsWith('video/') || resourceType === 'video') return 'video';
  if (content.startsWith('image/') || resourceType === 'image') return 'image';
  return null;
}

function mapBuilderResources(resources: TPostMedia[] | undefined | null): TMediaResource[] {
  if (!resources?.length) return [];
  const output: TMediaResource[] = [];
  const seen = new Set<string>();
  for (const media of resources) {
    if (!media?.resourceId || seen.has(media.resourceId)) continue;
    const type = resolveMediaType(media);
    if (!type) continue;
    seen.add(media.resourceId);
    output.push({
      id: media.resourceId,
      name: media.resourceId,
      type,
      url: media.presignedUrl,
      thumbnail_url: media.presignedUrl
    });
  }
  return output;
}

function usePostBuilderHydration(builder: TPostBuilder | null | undefined) {
  const setPlatformPublishStates = usePostBuilder((state) => state.setPlatformPublishStates);
  const setSelectedMediaIds = usePostBuilder((state) => state.setSelectedMediaIds);
  const setPlatformMode = usePostBuilder((state) => state.setPlatformMode);
  const setPlatformAvailability = usePostBuilder((state) => state.setPlatformAvailability);
  const setActivePlatform = usePostBuilder((state) => state.setActivePlatform);
  const activePlatform = usePostBuilder((state) => state.activePlatform);
  const existingResources = useMediaResourceStore((state) => state.mediaResources);
  const setMediaResources = useMediaResourceStore((state) => state.setMediaResources);

  const enabledPlatforms = useMemo(() => resolveEnabledPlatforms(builder), [builder]);

  useEffect(() => {
    if (!builder) return;
    setPlatformPublishStates(buildPlatformPublishStates(builder));
  }, [builder, setPlatformPublishStates]);

  useEffect(() => {
    if (!builder) return;
    setPlatformAvailability(enabledPlatforms);

    if (enabledPlatforms.length === 0) return;
    if (!enabledPlatforms.includes(activePlatform)) {
      setActivePlatform(enabledPlatforms[0]);
    }
  }, [builder, enabledPlatforms, activePlatform, setPlatformAvailability, setActivePlatform]);

  useEffect(() => {
    if (!builder) return;

    const nextResources = mapBuilderResources(builder.resources);
    if (nextResources.length === 0) return;

    const merged = new Map<string, TMediaResource>();
    for (const resource of existingResources) merged.set(resource.id, resource);
    for (const resource of nextResources) merged.set(resource.id, resource);

    const finalResources = Array.from(merged.values());

    // 🔥 tránh loop
    const isSame =
      finalResources.length === existingResources.length &&
      finalResources.every((r, i) => r.id === existingResources[i]?.id);

    if (!isSame) {
      setMediaResources(finalResources);
    }
  }, [builder, existingResources, setMediaResources]);

  const seededBuilderRef = useRef<string | null>(null);
  useEffect(() => {
    if (!builder) return;
    if (seededBuilderRef.current === builder.id) return;
    seededBuilderRef.current = builder.id;

    const modes = resolveInitialPlatformModes(builder);
    for (const platform of Object.keys(modes) as Array<keyof typeof modes>) {
      const mode = modes[platform];
      if (mode) {
        setPlatformMode(platform, mode);
      }
    }

    const savedSelections = buildSavedMediaSelections(builder);
    for (const { platform, mode, resourceIds } of savedSelections) {
      setSelectedMediaIds(platform, mode, resourceIds);
    }
  }, [builder, setPlatformMode, setSelectedMediaIds]);
}

export default usePostBuilderHydration;
