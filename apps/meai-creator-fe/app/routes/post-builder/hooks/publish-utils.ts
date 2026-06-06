import type {
  TPostBuilder,
  TPostBuilderSocialMedia,
  TPostBuilderSocialMediaPost,
  TPostMedia,
  TPostPublication
} from '@/models/post-builder.model';
import type {
  PlatformPublishInfo,
  PlatformPublishStateMap,
  PostBuilderMode,
  PostBuilderPlatform
} from './usePostBuilder';

// BE `post_type` column has accumulated multiple values over releases: "post" / "posts" /
// null / "reel" / "reels" / "video". Normalize so FE code only has to reason about two
// canonical buckets, "posts" and "reels". Used by PostBuilderHeader.publishPayload's
// typeMatch + ContentCreation's handleUnpublish/handleSaveCaptionEdit group lookups —
// without this, a legacy post with `post_type = "post"` silently fails to match and the
// Save Draft flow creates a duplicate row, causing loadSavedCaptions to later surface
// the OLD caption on refresh.
export function normalizePostType(value: string | null | undefined): 'reels' | 'posts' {
  const n = (value ?? '').trim().toLowerCase();
  if (n === 'reel' || n === 'reels' || n === 'video') return 'reels';
  return 'posts';
}

export function resolvePostTypeForMode(
  platform: PostBuilderPlatform,
  mode: PostBuilderMode
): 'reels' | 'posts' {
  if (platform === 'tiktok') return mode === 'image' ? 'posts' : 'reels';
  if (mode === 'reel') return 'reels';
  return 'posts';
}

// Canonical post-builder platforms follow the backend naming: tiktok/facebook/instagram/threads.
// Legacy aliases from older post data are still accepted here so hydration stays stable.
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
      return 'threads';
    default:
      return null;
  }
}

export type MediaKind = 'image' | 'video';
export type MediaKindLookup = ReadonlyMap<string, MediaKind>;

export function normalizeMediaKind(value: string | null | undefined): MediaKind | null {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (normalized.startsWith('video/') || normalized === 'video') return 'video';
  if (normalized.startsWith('image/') || normalized === 'image') return 'image';
  return null;
}

function resolveMediaKind(media: TPostMedia): MediaKind | null {
  const content = normalizeMediaKind(media.contentType);
  if (content) return content;
  const resourceType = normalizeMediaKind(media.resourceType);
  if (resourceType) return resourceType;
  return null;
}

export function buildBuilderMediaKindLookup(
  builder: TPostBuilder | null | undefined
): Map<string, MediaKind> {
  const lookup = new Map<string, MediaKind>();
  const addMedia = (media: TPostMedia | null | undefined) => {
    if (!media?.resourceId || lookup.has(media.resourceId)) return;
    const kind = resolveMediaKind(media);
    if (kind) lookup.set(media.resourceId, kind);
  };

  for (const media of builder?.resources ?? []) {
    addMedia(media);
  }

  for (const group of builder?.socialMedia ?? []) {
    for (const post of group.posts ?? []) {
      for (const media of post.media ?? []) {
        addMedia(media);
      }
    }
  }

  return lookup;
}

export function filterResourceIdsForPlatformMode(
  platform: PostBuilderPlatform,
  mode: PostBuilderMode,
  resourceIds: string[],
  mediaKindById: MediaKindLookup
): string[] {
  const uniqueIds = Array.from(new Set(resourceIds.filter(Boolean)));
  const idsOfKind = (kind: MediaKind) => uniqueIds.filter((id) => mediaKindById.get(id) === kind);
  const imageIds = idsOfKind('image');
  const videoIds = idsOfKind('video');
  const knownMediaIds = uniqueIds.filter((id) => mediaKindById.get(id) === 'image' || mediaKindById.get(id) === 'video');
  const fallbackIds = knownMediaIds.length > 0 ? knownMediaIds : uniqueIds;

  if (mode === 'reel' || mode === 'video') {
    return (videoIds.length > 0 ? videoIds : fallbackIds).slice(0, 1);
  }

  if (platform === 'tiktok' && mode === 'image') {
    return imageIds.length > 0 ? imageIds : fallbackIds;
  }

  if (platform === 'facebook' && mode === 'post') {
    if (imageIds.length > 0) return imageIds;
    if (videoIds.length > 0) return videoIds.slice(0, 1);
    return fallbackIds;
  }

  if (platform === 'instagram' && mode === 'post') {
    return fallbackIds.slice(0, 10);
  }

  return fallbackIds;
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

function resolveTiktokModeFromPost(post: TPostBuilderSocialMediaPost | undefined | null): PostBuilderMode {
  const { imageIds, videoIds } = collectPostMediaIds(post);
  if (videoIds.length > 0 && imageIds.length === 0) return 'video';
  if (videoIds.length > 0) return 'video';
  return 'image';
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
  if (platform === 'threads') return ['post'];
  return ['post'];
}

export function resolveEnabledPlatforms(
  builder: TPostBuilder | null | undefined
): PostBuilderPlatform[] {
  if (!builder?.socialMedia) return [];
  const platforms = new Set<PostBuilderPlatform>();
  for (const group of builder.socialMedia) {
    const platform = normalizeToFePlatform(group.platform);
    if (platform) platforms.add(platform);
  }
  return Array.from(platforms);
}

export function resolveInitialPlatformModes(
  builder: TPostBuilder | null | undefined
): Partial<Record<PostBuilderPlatform, PostBuilderMode>> {
  const result: Partial<Record<PostBuilderPlatform, PostBuilderMode>> = {};
  if (!builder?.socialMedia) return result;

  const fbTypes = new Set<string>();
  const igTypes = new Set<string>();

  for (const group of builder.socialMedia) {
    const platform = normalizeToFePlatform(group.platform);
    if (!platform) continue;

    if (platform === 'tiktok') {
      const mode = resolveTiktokModeFromPost(group.posts?.[0]);
      result.tiktok = mode;
      continue;
    }

    if (platform === 'facebook') {
      fbTypes.add(normalizePostType(group.type));
      continue;
    }

    if (platform === 'instagram') {
      igTypes.add(normalizePostType(group.type));
      continue;
    }

    if (platform === 'threads') {
      result.threads = 'post';
    }
  }

  if (!result.facebook) {
    result.facebook = fbTypes.has('posts') ? 'post' : fbTypes.has('reels') ? 'reel' : 'post';
  }

  if (!result.instagram) {
    result.instagram = igTypes.has('posts') ? 'post' : igTypes.has('reels') ? 'reel' : 'post';
  }

  if (!result.threads) result.threads = 'post';

  return result;
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
  const mediaKindById = buildBuilderMediaKindLookup(builder);

  for (const group of builder.socialMedia) {
    const mapping = resolveFePlatformAndModes(group);
    if (!mapping) continue;

    const post = group.posts?.[0];
    const { orderedIds } = collectPostMediaIds(post);
    if (orderedIds.length === 0) continue;

    if (mapping.platform === 'tiktok') {
      const mode = resolveTiktokModeFromPost(post);
      const resourceIds = filterResourceIdsForPlatformMode(mapping.platform, mode, orderedIds, mediaKindById);
      if (resourceIds.length > 0) {
        result.push({ platform: mapping.platform, mode, resourceIds });
      }
      continue;
    }

    for (const mode of mapping.modes) {
      const resourceIds = filterResourceIdsForPlatformMode(mapping.platform, mode, orderedIds, mediaKindById);
      if (resourceIds.length > 0) {
        result.push({ platform: mapping.platform, mode, resourceIds });
      }
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
    threads: {}
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
          socialMediaId: livePublication.socialMediaId ?? null,
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
