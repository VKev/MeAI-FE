import { useMemo } from 'react';
import type { TPostBuilder } from '@/models/post-builder.model';
import usePostBuilder, { type PostBuilderMode, type PostBuilderPlatform } from './usePostBuilder';
import { normalizePostType, resolvePostTypeForMode } from './publish-utils';

export type PublishPayload = {
  platform: PostBuilderPlatform;
  content: string;
  resourceIds: string[];
  mode: PostBuilderMode;
  postId: string | null;
};

const SUPPORTED_MODES: Record<PostBuilderPlatform, PostBuilderMode[]> = {
  tiktok: ['video', 'image'],
  facebook: ['post', 'reel'],
  instagram: ['post', 'reel'],
  thread: ['post']
};

function isPublishRuleSatisfied(
  platform: PostBuilderPlatform,
  mode: PostBuilderMode,
  content: string,
  resourceIds: string[]
): boolean {
  const hasContent = content.trim().length > 0;
  const hasMedia = resourceIds.length > 0;

  if (platform === 'tiktok') return hasContent && hasMedia;
  if (platform === 'facebook') return mode === 'reel' ? hasContent && hasMedia : hasContent;
  if (platform === 'instagram') return hasContent && hasMedia;
  return hasContent;
}

function normalizePlatform(value: string | null | undefined): string {
  const normalized = (value ?? '').trim().toLowerCase();
  return normalized === 'thread' ? 'threads' : normalized;
}

function usePostBuilderPublishPayloads(builder: TPostBuilder | null | undefined) {
  const platformContents = usePostBuilder((state) => state.platformContents);
  const previewStates = usePostBuilder((state) => state.previewStates);
  const platformModes = usePostBuilder((state) => state.platformModes);
  const platformAvailability = usePostBuilder((state) => state.platformAvailability);
  const platformPublishStates = usePostBuilder((state) => state.platformPublishStates);

  const enabledPlatforms = useMemo(
    () => (Object.keys(platformAvailability) as PostBuilderPlatform[]).filter((p) => platformAvailability[p]),
    [platformAvailability]
  );

  const payloads = useMemo<PublishPayload[]>(() => {
    if (!builder?.socialMedia) return [];

    const entries: PublishPayload[] = [];
    const builderGroups = builder.socialMedia ?? [];

    for (const platform of enabledPlatforms) {
      // For TikTok, only check the current mode
      // For other platforms, check all supported modes but only include those with data
      const modesToCheck = platform === 'tiktok'
        ? [platformModes[platform]]
        : SUPPORTED_MODES[platform];

      for (const mode of modesToCheck) {
        const contentBucket = platformContents[platform]?.[mode] ?? { text: '' };
        const resourceIds = previewStates[platform]?.selectedMediaIds?.[mode] ?? [];

        if (!isPublishRuleSatisfied(platform, mode, contentBucket.text, resourceIds)) continue;

        const dbPlatform = platform === 'thread' ? 'threads' : platform;
        const dbType = resolvePostTypeForMode(platform, mode);
        const typeMatch = builderGroups.find(
          (group) => normalizePlatform(group.platform) === dbPlatform && normalizePostType(group.type) === dbType
        );
        const existingPostId = typeMatch?.posts?.[0]?.id ?? null;

        entries.push({
          platform,
          content: contentBucket.text,
          resourceIds,
          mode,
          postId: existingPostId
        });
      }
    }

    return entries;
  }, [builder, enabledPlatforms, platformContents, previewStates, platformModes]);

  const publishablePayloads = useMemo(
    () =>
      payloads.filter((item) => {
        const status = platformPublishStates[item.platform]?.[item.mode]?.status;
        return status !== 'published' && status !== 'publishing' && status !== 'unpublishing';
      }),
    [payloads, platformPublishStates]
  );

  return {
    payloads,
    publishablePayloads,
    canPublish: publishablePayloads.length > 0
  };
}

export default usePostBuilderPublishPayloads;
