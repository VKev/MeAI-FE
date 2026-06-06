import { useMemo } from 'react';
import type { TPostBuilder } from '@/models/post-builder.model';
import usePostBuilder, { type PostBuilderMode, type PostBuilderPlatform } from './usePostBuilder';
import useMediaResourceStore from '@/store/media-resource.store';
import {
  buildBuilderMediaKindLookup,
  filterResourceIdsForPlatformMode,
  normalizeMediaKind,
  normalizePostType,
  resolvePostTypeForMode
} from './publish-utils';

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
  threads: ['post']
};

type BuilderSocialMediaGroup = NonNullable<TPostBuilder['socialMedia']>[number];
type BuilderPost = BuilderSocialMediaGroup['posts'][number];

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
  if (normalized === 'fb') return 'facebook';
  if (normalized === 'thread') return 'threads';
  if (normalized === 'ig') return 'instagram';
  return normalized;
}

function getPostRecency(post: BuilderPost): number {
  const updated = post.updatedAt ? Date.parse(post.updatedAt) : 0;
  const created = post.createdAt ? Date.parse(post.createdAt) : 0;
  return Math.max(updated, created);
}

function pickMostRecentPostId(posts: BuilderPost[] | undefined): string | null {
  if (!posts?.length) return null;

  return [...posts]
    .sort((a, b) => getPostRecency(b) - getPostRecency(a))
    .find((post) => Boolean(post.id))?.id ?? null;
}

function resolveExistingPostId(
  builderGroups: BuilderSocialMediaGroup[],
  platform: PostBuilderPlatform,
  mode: PostBuilderMode
): string | null {
  const dbType = resolvePostTypeForMode(platform, mode);
  const exactMatch = builderGroups.find(
    (group) => normalizePlatform(group.platform) === platform && normalizePostType(group.type) === dbType
  );

  const exactPostId = pickMostRecentPostId(exactMatch?.posts);
  if (exactPostId) return exactPostId;

  // TikTok drafts have moved between a single "reel" bucket and separate
  // image/video buckets over releases. If the mode has valid content/media,
  // publish should still be able to reuse the platform draft instead of
  // silently dropping TikTok from the payload.
  if (platform !== 'tiktok') return null;

  const platformGroups = builderGroups.filter((group) => normalizePlatform(group.platform) === platform);
  const platformPosts = platformGroups.flatMap((group) => group.posts ?? []);
  return pickMostRecentPostId(platformPosts);
}

function resolveModesToCheck(platform: PostBuilderPlatform, activeMode: PostBuilderMode): PostBuilderMode[] {
  const supportedModes = SUPPORTED_MODES[platform];
  if (platform !== 'tiktok') return supportedModes;

  return [
    activeMode,
    ...supportedModes.filter((mode) => mode !== activeMode)
  ];
}

function usePostBuilderPublishPayloads(builder: TPostBuilder | null | undefined) {
  const platformContents = usePostBuilder((state) => state.platformContents);
  const previewStates = usePostBuilder((state) => state.previewStates);
  const platformModes = usePostBuilder((state) => state.platformModes);
  const platformAvailability = usePostBuilder((state) => state.platformAvailability);
  const platformPublishStates = usePostBuilder((state) => state.platformPublishStates);
  const mediaResources = useMediaResourceStore((state) => state.mediaResources);

  const enabledPlatforms = useMemo(
    () => (Object.keys(platformAvailability) as PostBuilderPlatform[]).filter((p) => platformAvailability[p]),
    [platformAvailability]
  );

  const mediaKindById = useMemo(() => {
    const lookup = buildBuilderMediaKindLookup(builder);
    for (const resource of mediaResources) {
      const kind = normalizeMediaKind(resource.type);
      if (resource.id && kind) lookup.set(resource.id, kind);
    }
    return lookup;
  }, [builder, mediaResources]);

  const payloads = useMemo<PublishPayload[]>(() => {
    if (!builder?.socialMedia) return [];

    const entries: PublishPayload[] = [];
    const builderGroups = builder.socialMedia ?? [];

    for (const platform of enabledPlatforms) {
      // TikTok has two FE modes but one destination account. Prefer the current
      // mode, then fall back to the other mode if that is where the saved media is.
      const modesToCheck = resolveModesToCheck(platform, platformModes[platform]);

      for (const mode of modesToCheck) {
        const contentBucket = platformContents[platform]?.[mode] ?? { text: '' };
        const selectedResourceIds = previewStates[platform]?.selectedMediaIds?.[mode] ?? [];
        const resourceIds = filterResourceIdsForPlatformMode(platform, mode, selectedResourceIds, mediaKindById);

        if (!isPublishRuleSatisfied(platform, mode, contentBucket.text, resourceIds)) continue;

        const existingPostId = resolveExistingPostId(builderGroups, platform, mode);

        entries.push({
          platform,
          content: contentBucket.text,
          resourceIds,
          mode,
          postId: existingPostId
        });

        if (platform === 'tiktok') {
          break;
        }
      }
    }

    return entries;
  }, [builder, enabledPlatforms, mediaKindById, platformContents, previewStates, platformModes]);

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
