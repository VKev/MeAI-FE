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
  const setPreviewMode = usePostBuilder((state) => state.setPreviewMode);
  const setSelectedMediaIds = usePostBuilder((state) => state.setSelectedMediaIds);
  const setCurrentMediaIndex = usePostBuilder((state) => state.setCurrentMediaIndex);
  const setIsModalOpen = usePostBuilder((state) => state.setIsModalOpen);
  const setIsExpanded = usePostBuilder((state) => state.setIsExpanded);
  const setIsMuted = usePostBuilder((state) => state.setIsMuted);

  const mode = previewState.mode;
  const selectedMediaIds = getModeValue(previewState.selectedMediaIds, mode, DEFAULT_IDS);
  const currentMediaIndex = getModeValue(previewState.currentMediaIndex, mode, 0);
  const isModalOpen = getModeValue(previewState.isModalOpen, mode, false);
  const isExpanded = getModeValue(previewState.isExpanded, mode, false);
  const isMuted = getModeValue(previewState.isMuted, mode, true);

  return {
    mode,
    selectedMediaIds,
    currentMediaIndex,
    isModalOpen,
    isExpanded,
    isMuted,
    setMode: (nextMode: PostBuilderMode) => setPreviewMode(platform, nextMode),
    setSelectedMediaIds: (nextIds: Updater<string[]>, modeOverride?: PostBuilderMode) =>
      setSelectedMediaIds(platform, modeOverride ?? mode, nextIds),
    setCurrentMediaIndex: (nextIndex: Updater<number>, modeOverride?: PostBuilderMode) =>
      setCurrentMediaIndex(platform, modeOverride ?? mode, nextIndex),
    setIsModalOpen: (nextOpen: Updater<boolean>, modeOverride?: PostBuilderMode) =>
      setIsModalOpen(platform, modeOverride ?? mode, nextOpen),
    setIsExpanded: (nextExpanded: Updater<boolean>, modeOverride?: PostBuilderMode) =>
      setIsExpanded(platform, modeOverride ?? mode, nextExpanded),
    setIsMuted: (nextMuted: Updater<boolean>, modeOverride?: PostBuilderMode) =>
      setIsMuted(platform, modeOverride ?? mode, nextMuted)
  };
}

export default usePlatformPreviewState;
