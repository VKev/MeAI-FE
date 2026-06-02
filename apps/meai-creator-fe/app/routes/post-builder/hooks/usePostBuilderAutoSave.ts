import { useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TPostBuilder, TPostBuilderSocialMediaPost, TPostMedia } from '@/models/post-builder.model';
import usePostBuilder, { type PostBuilderMode, type PostBuilderPlatform } from './usePostBuilder';
import { createPost, updatePost, type CreatePostPayload } from '@/services/client/post.client';
import { resolveFePlatformAndModes, resolvePostTypeForMode } from './publish-utils';
import { toast } from 'sonner';

const SUPPORTED_MODES: Record<PostBuilderPlatform, PostBuilderMode[]> = {
  tiktok: ['video', 'image'],
  facebook: ['post', 'reel'],
  instagram: ['post', 'reel'],
  thread: ['post']
};

type Snapshot = {
  postId: string | null;
  content: string;
  resourceIds: string[];
};

type SaveBucket = Snapshot & {
  key: string;
  platform: PostBuilderPlatform;
  mode: PostBuilderMode;
};

function getBucketKey(platform: PostBuilderPlatform, mode: PostBuilderMode) {
  return `${platform}|${mode}`;
}

function resolveMediaKind(media: TPostMedia): 'image' | 'video' | null {
  const content = media.contentType?.toLowerCase() ?? '';
  const resourceType = media.resourceType?.toLowerCase() ?? '';
  if (content.startsWith('video/') || resourceType === 'video') return 'video';
  if (content.startsWith('image/') || resourceType === 'image') return 'image';
  return null;
}

function collectPostMediaIds(post: TPostBuilderSocialMediaPost | undefined | null): {
  orderedIds: string[];
  imageIds: string[];
  videoIds: string[];
} {
  const orderedIds: string[] = [];
  const imageIds: string[] = [];
  const videoIds: string[] = [];

  const media = post?.media ?? [];
  for (const item of media) {
    if (!item?.resourceId) continue;
    orderedIds.push(item.resourceId);
    const kind = resolveMediaKind(item);
    if (kind === 'image') imageIds.push(item.resourceId);
    if (kind === 'video') videoIds.push(item.resourceId);
  }

  if (orderedIds.length === 0 && post?.content?.resource_list?.length) {
    const fallbackIds = post.content.resource_list.filter(Boolean);
    return { orderedIds: fallbackIds, imageIds: [], videoIds: [] };
  }

  return { orderedIds, imageIds, videoIds };
}

function postRecencyScore(post: { updatedAt?: string | null; createdAt?: string | null }): number {
  const updated = post.updatedAt ? Date.parse(post.updatedAt) : 0;
  const created = post.createdAt ? Date.parse(post.createdAt) : 0;
  return Math.max(updated, created);
}

function pickMostRecentPost(posts: TPostBuilderSocialMediaPost[] | undefined): TPostBuilderSocialMediaPost | null {
  if (!posts || posts.length === 0) return null;
  let best = posts[0];
  let bestScore = postRecencyScore(best);
  for (const post of posts) {
    const score = postRecencyScore(post);
    if (score > bestScore) {
      best = post;
      bestScore = score;
    }
  }
  return best;
}

function buildFullContent(post: TPostBuilderSocialMediaPost | null): string {
  if (!post?.content?.content) return '';
  const caption = post.content.content;
  const hashtag = post.content.hashtag || '';
  return hashtag ? `${caption}\n\n${hashtag}` : caption;
}

function buildSnapshotFromBuilder(builder: TPostBuilder | null | undefined): Map<string, Snapshot> {
  const map = new Map<string, Snapshot>();
  if (!builder?.socialMedia) return map;

  for (const group of builder.socialMedia) {
    const resolved = resolveFePlatformAndModes(group);
    if (!resolved) continue;

    const platform = resolved.platform;
    const post = pickMostRecentPost(group.posts);
    if (!post) continue;

    const content = buildFullContent(post);
    const { orderedIds, imageIds, videoIds } = collectPostMediaIds(post);

    if (platform === 'tiktok') {
      // For TikTok, we need to map video and image modes separately
      // Video mode should only have video media, image mode only image media
      const videoModeSnapshot: Snapshot = {
        postId: post.id ?? null,
        content,
        resourceIds: videoIds.slice(0, 1)
      };
      const imageModeSnapshot: Snapshot = {
        postId: post.id ?? null,
        content,
        resourceIds: imageIds
      };

      map.set(getBucketKey(platform, 'video'), videoModeSnapshot);
      map.set(getBucketKey(platform, 'image'), imageModeSnapshot);
      continue;
    }

    for (const mode of resolved.modes) {
      const key = getBucketKey(platform, mode);

      // For reel mode, include video media. For post mode, include all media.
      const resourceIds = mode === 'reel'
        ? videoIds.slice(0, 1)
        : orderedIds;

      map.set(key, { postId: post.id ?? null, content, resourceIds });
    }
  }

  return map;
}

function buildSnapshotKey(snapshot: Snapshot): string {
  return `${snapshot.content.trim()}||${snapshot.resourceIds.join(',')}`;
}

type UsePostBuilderAutoSaveProps = {
  builder: TPostBuilder | null | undefined;
  postBuilderId?: string | null;
  workspaceId?: string | null;
  debounceMs?: number;
};

function usePostBuilderAutoSave({ builder, postBuilderId, workspaceId, debounceMs = 200 }: UsePostBuilderAutoSaveProps) {
  const queryClient = useQueryClient();
  const platformContents = usePostBuilder((state) => state.platformContents);
  const previewStates = usePostBuilder((state) => state.previewStates);
  const platformModes = usePostBuilder((state) => state.platformModes);
  const platformPublishStates = usePostBuilder((state) => state.platformPublishStates);
  const platformAvailability = usePostBuilder((state) => state.platformAvailability);

  const enabledPlatforms = useMemo(() => {
    return (Object.keys(platformAvailability) as PostBuilderPlatform[]).filter((p) => platformAvailability[p]);
  }, [platformAvailability]);

  const lastSavedRef = useRef<Map<string, Snapshot>>(new Map());
  const lastBuilderIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!builder?.id) return;
    if (lastBuilderIdRef.current === builder.id) return;
    lastBuilderIdRef.current = builder.id;
    lastSavedRef.current = buildSnapshotFromBuilder(builder);
  }, [builder]);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!builder || !postBuilderId) return;

    const buckets: SaveBucket[] = [];

    for (const platform of enabledPlatforms) {
      // For TikTok, only save the current mode
      // For other platforms, check which modes have data (content or media)
      const modesToCheck = platform === 'tiktok'
        ? [platformModes[platform]]
        : SUPPORTED_MODES[platform];

      for (const mode of modesToCheck) {
        const content = platformContents[platform]?.[mode]?.text ?? '';
        const resourceIds = previewStates[platform]?.selectedMediaIds?.[mode] ?? [];
        const key = getBucketKey(platform, mode);

        const savedSnapshot = lastSavedRef.current.get(key);
        const hadPrevious = Boolean(savedSnapshot?.postId || savedSnapshot?.content || savedSnapshot?.resourceIds?.length);
        const hasData = content.trim().length > 0 || resourceIds.length > 0;

        // Only save if there's data OR there was previous data (to handle deletions)
        if (!hasData && !hadPrevious) continue;

        const publishStatus = platformPublishStates[platform]?.[mode]?.status;
        if (publishStatus === 'published' || publishStatus === 'publishing' || publishStatus === 'unpublishing') {
          continue;
        }

        buckets.push({
          key,
          platform,
          mode,
          postId: savedSnapshot?.postId ?? null,
          content,
          resourceIds
        });
      }
    }

    const pending = buckets.filter((bucket) => {
      const snapshot = lastSavedRef.current.get(bucket.key);
      if (!snapshot) return true;
      return buildSnapshotKey(snapshot) !== buildSnapshotKey(bucket);
    });

    if (pending.length === 0) return;

    if (timerRef.current) window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(() => {
      void (async () => {
        await Promise.all(
          pending.map(async (bucket) => {
            try {
              let postId = bucket.postId;
              const postType = resolvePostTypeForMode(bucket.platform, bucket.mode);

              if (postId) {
                const updatePayload: Partial<CreatePostPayload> = {
                  content: {
                    content: bucket.content,
                    hashtag: null,
                    resource_list: bucket.resourceIds,
                    post_type: postType
                  }
                };
                await updatePost(postId, updatePayload);
              } else {
                const createPayload: CreatePostPayload = {
                  workspaceId: workspaceId || null,
                  socialMediaId: null,
                  title: null,
                  content: {
                    content: bucket.content,
                    hashtag: null,
                    resource_list: bucket.resourceIds,
                    post_type: postType
                  },
                  status: 'draft',
                  postBuilderId: postBuilderId ?? null,
                  platform: bucket.platform === 'thread' ? 'threads' : bucket.platform
                };
                const createResponse = await createPost(createPayload);
                postId = createResponse.value?.id ?? null;
                if (postId) {
                  void queryClient.invalidateQueries({ queryKey: ['post-builder', postBuilderId] });
                }
              }

              lastSavedRef.current.set(bucket.key, {
                postId: postId ?? bucket.postId ?? null,
                content: bucket.content,
                resourceIds: bucket.resourceIds
              });
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Auto-save failed';
              console.error(`[PostBuilderAutoSave] ${bucket.platform}/${bucket.mode}:`, message);
            }
          })
        );
        toast.success('Save successful!', { description: 'Your changes have been auto-saved.', duration: 1000 });
      })();
    }, debounceMs);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [
    builder,
    postBuilderId,
    workspaceId,
    enabledPlatforms,
    platformContents,
    previewStates,
    platformModes,
    platformPublishStates,
    queryClient,
    debounceMs
  ]);
}

export default usePostBuilderAutoSave;
