import { useCallback } from 'react';
import usePostBuilder, { type PostBuilderMode, type PostBuilderPlatform } from './usePostBuilder';

const DEFAULT_IDS: string[] = [];

type Updater<T> = T | ((prev: T) => T);

function getModeValue<T>(
  record: Partial<Record<PostBuilderMode, T>> | undefined,
  mode: PostBuilderMode,
  fallback: T
): T {
  if (!record) return fallback;
  return record[mode] ?? fallback;
}


function usePlatformPreviewState(platform: PostBuilderPlatform) {
  const previewState = usePostBuilder((state) => state.previewStates[platform]);
  const platformMode = usePostBuilder((state) => state.platformModes[platform]);
  const setPreviewMode = usePostBuilder((state) => state.setPreviewMode);
  const setSelectedMediaIdsStore = usePostBuilder((state) => state.setSelectedMediaIds);
  const setCurrentMediaIndexStore = usePostBuilder((state) => state.setCurrentMediaIndex);

  const mode = platformMode;
  const selectedMediaIds = getModeValue(previewState.selectedMediaIds, mode, DEFAULT_IDS);
  const currentMediaIndex = getModeValue(previewState.currentMediaIndex, mode, 0);

  const setMode = useCallback(
    (nextMode: PostBuilderMode) => setPreviewMode(platform, nextMode),
    [platform, setPreviewMode]
  );

  const setSelectedMediaIds = useCallback(
    (nextIds: Updater<string[]>, modeOverride?: PostBuilderMode) =>
      setSelectedMediaIdsStore(platform, modeOverride ?? mode, nextIds),
    [platform, mode, setSelectedMediaIdsStore]
  );

  const setCurrentMediaIndex = useCallback(
    (nextIndex: Updater<number>, modeOverride?: PostBuilderMode) =>
      setCurrentMediaIndexStore(platform, modeOverride ?? mode, nextIndex),
    [platform, mode, setCurrentMediaIndexStore]
  );

  return {
    mode,
    selectedMediaIds,
    currentMediaIndex,
    setMode,
    setSelectedMediaIds,
    setCurrentMediaIndex
  };
}

export default usePlatformPreviewState;
