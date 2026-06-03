import type { PostBuilderPlatform, PostBuilderMode } from '@/routes/post-builder/hooks/usePostBuilder';
import type { TPlatform, TSocialMediaCaptionsByPost } from '@/models/post-prepare.model';
import type { TPostBuilderSocialMedia, TPostBuilder } from '@/models/post-builder.model';
import { resolveFePlatformAndModes } from '@/routes/post-builder/hooks/publish-utils';
import { resolvePostTypeForMode } from '@/routes/post-builder/hooks/publish-utils';
import { updatePost } from '@/services/client/post.client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CaptionPayloadEntry = {
  platform: PostBuilderPlatform;
  mode: PostBuilderMode;
  postId: string;
  resourceIds: string[];
};

type SetPlatformContent = (
  platform: PostBuilderPlatform,
  mode: PostBuilderMode,
  payload: { content: string }
) => void;

export type BuiltCaption = {
  captionText: string;
  hashtagStr: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PLATFORM_MAP: Record<PostBuilderPlatform, TPlatform> = {
  tiktok: 'tiktok',
  facebook: 'facebook',
  instagram: 'instagram',
  threads: 'threads'
};

// Backend uses 'ig' for instagram in post builder data
const PLATFORM_ALIASES: Record<string, PostBuilderPlatform> = {
  tiktok: 'tiktok',
  facebook: 'facebook',
  instagram: 'instagram',
  ig: 'instagram',
  thread: 'threads',
  threads: 'threads'
};

export const PLATFORM_LABELS: Record<PostBuilderPlatform, string> = {
  tiktok: 'TikTok',
  facebook: 'Facebook',
  instagram: 'Instagram',
  threads: 'Threads'
};

export const ALL_PLATFORMS: PostBuilderPlatform[] = ['tiktok', 'facebook', 'instagram', 'threads'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function findSmGroup(
  socialMedia: TPostBuilderSocialMedia[],
  platform: PostBuilderPlatform
): TPostBuilderSocialMedia | undefined {
  const apiPlatform = PLATFORM_MAP[platform];
  return socialMedia.find((sm) => {
    const p = sm.platform?.toLowerCase();
    return p === apiPlatform || PLATFORM_ALIASES[p ?? ''] === platform;
  });
}

export function buildCaptionText(sm: TSocialMediaCaptionsByPost): BuiltCaption | null {
  const caption = sm.captions?.[0];
  if (!caption?.caption) return null;

  const captionText = caption.caption;
  const hashtags = [...(caption.hashtags || []), ...(caption.trendingHashtags || [])];
  const hashtagStr = hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ');
  return { captionText, hashtagStr };
}

export function buildCaptionPayloads(
  postBuilder: TPostBuilder,
  generatePlatforms: Set<PostBuilderPlatform>,
  platformModes: Record<PostBuilderPlatform, PostBuilderMode>,
  previewStates: Record<PostBuilderPlatform, { selectedMediaIds?: Record<string, string[]> }>
): CaptionPayloadEntry[] {
  const entries: CaptionPayloadEntry[] = [];

  for (const platform of ALL_PLATFORMS) {
    if (!generatePlatforms.has(platform)) continue;

    const smGroup = findSmGroup(postBuilder.socialMedia, platform);
    const post = smGroup?.posts?.[0];
    if (!post?.id) continue;

    const mode = platformModes[platform];
    let resourceIds = previewStates[platform]?.selectedMediaIds?.[mode] ?? [];
    if (resourceIds.length === 0) {
      resourceIds = post.content?.resource_list ?? [];
    }

    if (resourceIds.length === 0) continue;

    entries.push({
      platform,
      mode,
      postId: post.id,
      resourceIds
    });
  }

  return entries;
}

export function applyCaptionResults(
  responseSocialMedia: TSocialMediaCaptionsByPost[],
  entries: CaptionPayloadEntry[],
  setPlatformContent: SetPlatformContent
): Promise<unknown>[] {
  const entryByPostId = new Map(entries.map((e) => [e.postId, e]));
  const savePromises: Promise<unknown>[] = [];

  for (let i = 0; i < responseSocialMedia.length; i++) {
    const sm = responseSocialMedia[i];

    let entry = entryByPostId.get(sm.postId);
    if (!entry && i < entries.length) {
      entry = entries[i];
    }
    if (!entry) continue;

    const built = buildCaptionText(sm);
    if (!built) continue;

    const fullText = built.hashtagStr ? `${built.captionText}\n\n${built.hashtagStr}` : built.captionText;
    setPlatformContent(entry.platform, entry.mode, { content: fullText });

    const platformLabel = entry.platform;
    savePromises.push(
      updatePost(sm.postId, {
        content: {
          content: built.captionText,
          hashtag: built.hashtagStr || null,
          resource_list: sm.resourceList || [],
          post_type: resolvePostTypeForMode(entry.platform, entry.mode)
        }
      }).catch((err) => {
        console.error(`Failed to save caption for ${platformLabel}:`, err);
      })
    );
  }

  return savePromises;
}

// "Last touched" timestamp for a post — prefer UpdatedAt, fall back to CreatedAt. Legacy
// rows have UpdatedAt=null, and without this fallback they'd sort to the bottom even when
// newer than other rows.
function postRecencyScore(post: { updatedAt?: string | null; createdAt?: string | null }): number {
  const updated = post.updatedAt ? Date.parse(post.updatedAt) : 0;
  const created = post.createdAt ? Date.parse(post.createdAt) : 0;
  return Math.max(updated, created);
}

export function loadSavedCaptions(
  postBuilder: TPostBuilder,
  setPlatformContent: SetPlatformContent
): boolean {
  // Collect every (platform, mode) candidate across ALL groups so duplicate groups
  // from the pre-normalizePostType era don't race (iteration order used to decide the
  // winner, which made "save draft + refresh" randomly resurrect a stale caption).
  // Key: `${platform}|${mode}`, value: the post with the newest recency score + the
  // resolved mapping to write with.
  type Candidate = {
    platform: PostBuilderPlatform;
    mode: PostBuilderMode;
    caption: string;
    hashtag: string;
    score: number;
  };
  const bestByKey = new Map<string, Candidate>();

  for (const group of postBuilder.socialMedia) {
    const resolved = resolveFePlatformAndModes(group);
    if (!resolved) continue;

    const posts = group.posts ?? [];
    for (const post of posts) {
      const caption = post.content?.content;
      if (!caption) continue;

      const score = postRecencyScore(post);
      const hashtag = post.content?.hashtag || '';

      for (const mode of resolved.modes) {
        const key = `${resolved.platform}|${mode}`;
        const prev = bestByKey.get(key);
        if (!prev || score > prev.score) {
          bestByKey.set(key, {
            platform: resolved.platform,
            mode,
            caption,
            hashtag,
            score
          });
        }
      }
    }
  }

  if (bestByKey.size === 0) return false;

  for (const { platform, mode, caption, hashtag } of bestByKey.values()) {
    const fullText = hashtag ? `${caption}\n\n${hashtag}` : caption;
    setPlatformContent(platform, mode, { content: fullText });
  }

  return true;
}
