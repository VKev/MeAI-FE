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
  const setSelectedMediaIds = usePostBuilder((state) => state.setSelectedMediaIds);
  const setCurrentMediaIndex = usePostBuilder((state) => state.setCurrentMediaIndex);

  const mode = platformMode;
  const selectedMediaIds = getModeValue(previewState.selectedMediaIds, mode, DEFAULT_IDS);
  const currentMediaIndex = getModeValue(previewState.currentMediaIndex, mode, 0);

  return {
    mode,
    selectedMediaIds,
    currentMediaIndex,
    setMode: (nextMode: PostBuilderMode) => setPreviewMode(platform, nextMode),
    setSelectedMediaIds: (nextIds: Updater<string[]>, modeOverride?: PostBuilderMode) =>
      setSelectedMediaIds(platform, modeOverride ?? mode, nextIds),
    setCurrentMediaIndex: (nextIndex: Updater<number>, modeOverride?: PostBuilderMode) =>
      setCurrentMediaIndex(platform, modeOverride ?? mode, nextIndex)
  };
}

export default usePlatformPreviewState;
