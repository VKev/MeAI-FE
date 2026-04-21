import type { TPostBuilder, TPostBuilderSocialMedia, TPostPublication } from '@/models/post-builder.model';
import type {
  PlatformPublishInfo,
  PlatformPublishStateMap,
  PostBuilderMode,
  PostBuilderPlatform
} from './usePostBuilder';

// BE stores platforms as tiktok/facebook/ig/threads; FE uses tiktok/facebook/instagram/thread.
function normalizeToFePlatform(value: string | null | undefined): PostBuilderPlatform | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case 'tiktok':
      return 'tiktok';
    case 'facebook':
    case 'fb':
      return 'facebook';
    case 'instagram':
    case 'ig':
      return 'instagram';
    case 'threads':
    case 'thread':
      return 'thread';
    default:
      return null;
  }
}

// Map BE post-builder group `type` to the FE modes it should lock.
// - Meta "post"/"posts" → ['post']
// - Meta "reel"/"reels" → ['reel']
// - Threads "post" → ['post']
// - TikTok: BE typically stores "reel" but FE exposes `video` and `image` modes; both
//   map to the same single TikTok post so a publish on either mode locks the whole tab.
function mapTypeToFeModes(
  type: string | null | undefined,
  platform: PostBuilderPlatform
): PostBuilderMode[] {
  const normalized = (type ?? '').trim().toLowerCase();

  if (platform === 'tiktok') {
    return ['video', 'image'];
  }

  if (normalized === 'post' || normalized === 'posts') return ['post'];
  if (normalized === 'reel' || normalized === 'reels') return ['reel'];

  // Fallback — if we can't tell, lock the platform's default mode.
  if (platform === 'thread') return ['post'];
  return ['post'];
}

export function buildPlatformUrl(info: TPostPublication): string | null {
  const id = info.externalContentId?.trim();
  const ownerId = info.destinationOwnerId?.trim();
  if (!id) return null;

  const type = info.socialMediaType?.trim().toLowerCase();

  if (type === 'facebook') {
    if (id.includes('_')) {
      const [pageId, postId] = id.split('_');
      if (pageId && postId) {
        return `https://www.facebook.com/${pageId}/posts/${postId}`;
      }
    }
    return `https://www.facebook.com/${id}`;
  }

  if (type === 'instagram' || type === 'ig') {
    return `https://www.instagram.com/p/${id}/`;
  }

  if (type === 'tiktok') {
    if (ownerId) {
      return `https://www.tiktok.com/@${ownerId}/video/${id}`;
    }
    return `https://www.tiktok.com/video/${id}`;
  }

  if (type === 'threads') {
    // Threads publish stores "{numericMediaId}|{permalink}" in externalContentId.
    // Pull the permalink half if present. Older rows may have just the URL OR just the
    // numeric id — fall back to the raw `/t/{id}` pattern for the latter.
    const pipe = id.indexOf('|');
    if (pipe > 0) {
      const permalink = id.slice(pipe + 1);
      if (/^https?:\/\//i.test(permalink)) return permalink;
    }
    if (/^https?:\/\//i.test(id)) return id;
    return `https://www.threads.net/t/${id}`;
  }

  return null;
}

export function resolveFePlatformAndModes(
  group: TPostBuilderSocialMedia
): { platform: PostBuilderPlatform; modes: PostBuilderMode[] } | null {
  const fePlatform = normalizeToFePlatform(group.platform);
  if (!fePlatform) return null;
  const feModes = mapTypeToFeModes(group.type, fePlatform);
  if (feModes.length === 0) return null;
  return { platform: fePlatform, modes: feModes };
}

// Extract a stable list of resource IDs for every (platform, mode) that this builder covers
// so the FE can re-hydrate Select-Your-Media state after a page reload.
export function buildSavedMediaSelections(
  builder: TPostBuilder | null | undefined
): Array<{ platform: PostBuilderPlatform; mode: PostBuilderMode; resourceIds: string[] }> {
  const result: Array<{ platform: PostBuilderPlatform; mode: PostBuilderMode; resourceIds: string[] }> = [];
  if (!builder?.socialMedia) return result;

  for (const group of builder.socialMedia) {
    const mapping = resolveFePlatformAndModes(group);
    if (!mapping) continue;

    const post = group.posts?.[0];
    const resources = post?.content?.resource_list ?? [];
    if (resources.length === 0) continue;

    for (const mode of mapping.modes) {
      result.push({ platform: mapping.platform, mode, resourceIds: resources });
    }
  }

  return result;
}

export function buildPlatformPublishStates(
  builder: TPostBuilder | null | undefined
): Partial<PlatformPublishStateMap> {
  // Initialise every FE platform so the caller's REPLACE-on-key store update clears any
  // stale state (e.g. an "unpublishing" entry from a previous refetch when the post is
  // now back in draft).
  const result: Partial<PlatformPublishStateMap> = {
    tiktok: {},
    facebook: {},
    instagram: {},
    thread: {}
  };
  if (!builder?.socialMedia) return result;

  for (const group of builder.socialMedia) {
    const fePlatform = normalizeToFePlatform(group.platform);
    if (!fePlatform) continue;

    const feModes = mapTypeToFeModes(group.type, fePlatform);
    if (feModes.length === 0) continue;

    for (const post of group.posts) {
      const livePublication = post.publications?.find(
        (publication) => publication.publishStatus?.toLowerCase() === 'published' && publication.externalContentId
      );
      const unpublishingPublication = post.publications?.find(
        (publication) => publication.publishStatus?.toLowerCase() === 'unpublishing'
      );
      const processingPublication = !livePublication && !unpublishingPublication
        ? post.publications?.find(
            (publication) => publication.publishStatus?.toLowerCase() === 'processing'
          )
        : undefined;
      const postStatus = post.status?.toLowerCase();
      const isProcessingPost = postStatus === 'processing';
      const isUnpublishingPost = postStatus === 'unpublishing';

      let info: PlatformPublishInfo | null = null;

      if (unpublishingPublication || isUnpublishingPost) {
        // Unpublish takes priority over the existing "published" state — we want the UI
        // to flip straight to the orange "Unpublishing…" banner while the request runs.
        info = {
          isPublished: false,
          status: 'unpublishing',
          externalContentId: livePublication?.externalContentId ?? unpublishingPublication?.externalContentId,
          destinationOwnerId: livePublication?.destinationOwnerId ?? unpublishingPublication?.destinationOwnerId,
          socialMediaType: (livePublication ?? unpublishingPublication)?.socialMediaType ?? group.platform,
          publishedAt: livePublication?.publishedAt ?? null,
          externalUrl: livePublication ? buildPlatformUrl(livePublication) : null
        };
      } else if (livePublication) {
        info = {
          isPublished: true,
          status: 'published',
          externalContentId: livePublication.externalContentId,
          externalContentIdType: livePublication.externalContentIdType,
          destinationOwnerId: livePublication.destinationOwnerId,
          socialMediaType: livePublication.socialMediaType,
          publishedAt: livePublication.publishedAt,
          externalUrl: buildPlatformUrl(livePublication)
        };
      } else if (processingPublication || isProcessingPost) {
        info = {
          isPublished: false,
          status: 'publishing',
          socialMediaType: processingPublication?.socialMediaType ?? group.platform
        };
      }

      if (!info) continue;

      const platformBucket = (result[fePlatform] ??= {});
      for (const mode of feModes) {
        // Once a mode is marked as published, don't downgrade it to publishing/failed
        // by a different post in the same group (e.g. a leftover placeholder).
        if (platformBucket[mode]?.status === 'published') continue;
        platformBucket[mode] = info;
      }
    }
  }

  return result;
}
