import type { PostBuilderPlatform, PostBuilderMode } from '@/routes/post-builder/hooks/usePostBuilder';
import type { TCreateCaptionPost, TPlatform, TSocialMediaCaptionsByPost } from '@/models/post-prepare.model';
import type { TPostBuilderSocialMedia, TPostBuilder } from '@/models/post-builder.model';
import { resolveFePlatformAndModes } from '@/routes/post-builder/hooks/publish-utils';
import { updatePost } from '@/services/client/post.client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CaptionPayloadEntry = {
  payload: TCreateCaptionPost;
  platform: PostBuilderPlatform;
  mode: PostBuilderMode;
  postId: string;
};

type SetPlatformContent = (
  platform: PostBuilderPlatform,
  mode: PostBuilderMode,
  payload: { content: string; htmlContent: string }
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
  thread: 'threads'
};

// Backend uses 'ig' for instagram in post builder data
const PLATFORM_ALIASES: Record<string, PostBuilderPlatform> = {
  tiktok: 'tiktok',
  facebook: 'facebook',
  instagram: 'instagram',
  ig: 'instagram',
  threads: 'thread'
};

export const PLATFORM_LABELS: Record<PostBuilderPlatform, string> = {
  tiktok: 'TikTok',
  facebook: 'Facebook',
  instagram: 'Instagram',
  thread: 'Threads'
};

export const ALL_PLATFORMS: PostBuilderPlatform[] = ['tiktok', 'facebook', 'instagram', 'thread'];

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

export function textToHtml(text: string): string {
  return text
    .split('\n')
    .map((line) => `<p>${line || '<br>'}</p>`)
    .join('');
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
      payload: { postId: post.id, platform: PLATFORM_MAP[platform], resourceIds },
      platform,
      mode,
      postId: post.id
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
    const htmlContent = textToHtml(fullText);
    setPlatformContent(entry.platform, entry.mode, { content: fullText, htmlContent });

    const platformLabel = entry.platform;
    savePromises.push(
      updatePost(sm.postId, {
        content: {
          content: built.captionText,
          hashtag: built.hashtagStr || null,
          resource_list: sm.resourceList || [],
          post_type: null
        }
      }).catch((err) => {
        console.error(`Failed to save caption for ${platformLabel}:`, err);
      })
    );
  }

  return savePromises;
}

export function loadSavedCaptions(
  postBuilder: TPostBuilder,
  setPlatformContent: SetPlatformContent
): boolean {
  let hasContent = false;

  for (const group of postBuilder.socialMedia) {
    const resolved = resolveFePlatformAndModes(group);
    if (!resolved) continue;

    // Platforms like Facebook can have multiple posts (one per page). Prefer a published
    // post with caption; fall back to the first post that has any caption at all.
    const posts = group.posts ?? [];
    const publishedWithCaption = posts.find((p) => p.isPublished && p.content?.content);
    const anyWithCaption = posts.find((p) => p.content?.content);
    const post = publishedWithCaption ?? anyWithCaption;
    const caption = post?.content?.content;
    if (!caption) continue;

    hasContent = true;
    const hashtag = post?.content?.hashtag || '';
    const fullText = hashtag ? `${caption}\n\n${hashtag}` : caption;
    const payload = { content: fullText, htmlContent: textToHtml(fullText) };

    for (const mode of resolved.modes) {
      setPlatformContent(resolved.platform, mode, payload);
    }
  }

  return hasContent;
}
