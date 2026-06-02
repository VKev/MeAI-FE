import z from 'zod';
import type { TMediaResource } from '@/store/media-resource.store';

export type TChatConfig = string | Record<string, unknown> | null;

export type TChatResource = {
  resourceId: string;
  url: string;
  resourceType: string | null;
  contentType: string | null;
};

type ChatResourceLike = TChatResource & {
  id?: string | null;
  presignedUrl?: string | null;
  link?: string | null;
};

export type TChatMediaKind = 'image' | 'video';

export type TChat = {
  id: string;
  sessionId: string;
  prompt: string;
  config: TChatConfig;
  referenceResourceIds: string[] | string | null;
  resultResourceIds: string[] | string | null;
  referenceResources: TChatResource[] | null;
  resultResources: TChatResource[] | null;
  referenceResourceUrls: string[] | null;
  resultResourceUrls: string[] | null;
  status: string | null;
  errorMessage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

function parseChatConfig(config: TChatConfig) {
  if (!config) return null;
  if (typeof config !== 'string') return config;

  try {
    const parsed = JSON.parse(config);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function toLowerText(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isVideoResourceDescriptor(resource: Pick<TChatResource, 'resourceType' | 'contentType'> | TMediaResource) {
  const resourceType =
    'resourceType' in resource ? (resource.resourceType?.toLowerCase() ?? '') : (resource.type?.toLowerCase() ?? '');
  const contentType = 'contentType' in resource ? (resource.contentType?.toLowerCase() ?? '') : '';

  return resourceType === 'video' || contentType.startsWith('video/') || resourceType.endsWith('video');
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov|m4v|avi|m3u8)(\?|#|$)/i.test(url);
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
  } catch {
    // Fall through to treating the raw string as a URL.
  }

  return [value];
}

function getResourceUrl(resource: ChatResourceLike) {
  return resource.url || resource.presignedUrl || resource.link || '';
}

function getResourceId(resource: ChatResourceLike, fallbackId: string) {
  return resource.resourceId || resource.id || fallbackId;
}

function toResourceArray(value: unknown): TChatResource[] {
  return Array.isArray(value) ? value.filter((item): item is TChatResource => item && typeof item === 'object') : [];
}

export function getChatMediaKind(
  chat: Pick<TChat, 'config' | 'resultResources' | 'resultResourceUrls'>
): TChatMediaKind {
  const resources = toResourceArray(chat.resultResources);
  if (resources.some((resource) => isVideoResourceDescriptor(resource))) {
    return 'video';
  }

  const parsedConfig = parseChatConfig(chat.config);
  if (!parsedConfig) {
    const urls = toStringArray(chat.resultResourceUrls);
    return urls.some(isVideoUrl) ? 'video' : 'image';
  }

  const generationType = toLowerText(
    parsedConfig.type ?? parsedConfig.Type ?? parsedConfig.generationType ?? parsedConfig.GenerationType
  );
  if (generationType === 'video') return 'video';

  const enableTranslation = parsedConfig.EnableTranslation ?? parsedConfig.enableTranslation;
  if (enableTranslation === true) return 'video';

  const urls = toStringArray(chat.resultResourceUrls);
  return urls.some(isVideoUrl) ? 'video' : 'image';
}

export function getChatMediaItems(
  chat: Pick<TChat, 'id' | 'config' | 'resultResources' | 'resultResourceUrls'>
): TMediaResource[] {
  const chatMediaKind = getChatMediaKind(chat);
  const mediaItems: TMediaResource[] = [];
  const seen = new Set<string>();

  for (const [index, resource] of toResourceArray(chat.resultResources).entries()) {
    const resourceLike = resource as ChatResourceLike;
    const url = getResourceUrl(resourceLike);
    if (!url) continue;

    const id = getResourceId(resourceLike, `${chat.id}-media-${index}`);
    const dedupeKey = `${id}:${url}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const isVideo = isVideoResourceDescriptor(resourceLike) || chatMediaKind === 'video' || isVideoUrl(url);
    mediaItems.push({
      id,
      name: `Media ${mediaItems.length + 1}`,
      type: isVideo ? 'video' : 'image',
      url,
      thumbnail_url: url
    });
  }

  const fallbackUrls = toStringArray(chat.resultResourceUrls);
  for (const [index, url] of fallbackUrls.entries()) {
    const dedupeKey = `url:${url}`;
    const alreadyAdded = mediaItems.some((item) => item.url === url || item.thumbnail_url === url);
    if (seen.has(dedupeKey) || alreadyAdded) continue;
    seen.add(dedupeKey);

    const type = isVideoUrl(url) || chatMediaKind === 'video' ? 'video' : 'image';
    mediaItems.push({
      id: `${chat.id}-media-url-${index}`,
      name: `Media ${mediaItems.length + 1}`,
      type,
      url,
      thumbnail_url: url
    });
  }

  return mediaItems;
}

export type TGetAllChatResponse = {
  value: TChat[];
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};

export type TChatResponse = {
  value: TChat;
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};

export type TDeleteChatResponse = {
  value: boolean;
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};

export const CreateVideoChatSchema = z.object({
  chatSessionId: z.string().trim(),
  prompt: z.string().trim(),
  resourceIds: z.array(z.string()).optional(),
  model: z.string().trim(),
  variant: z.string().trim().optional(),
  aspectRatio: z.string().trim().optional(),
  seeds: z.array(z.number().int()).optional(),
  enableTranslation: z.boolean().optional(),
  watermark: z.string().trim().optional(),
  generationType: z.string().trim().optional(),
  resolution: z.string().trim().optional(),
  duration: z.number().int().optional(),
  generateAudio: z.boolean().optional(),
  returnLastFrame: z.boolean().optional(),
  webSearch: z.boolean().optional()
});

export type TCreateVideoChat = z.infer<typeof CreateVideoChatSchema>;

export const SocialTargetSchema = z.object({
  platform: z.string().trim(),
  type: z.string().trim(),
  ratio: z.string().trim()
});

export const CreateImageChatSchema = z.object({
  chatSessionId: z.string().trim(),
  prompt: z.string().trim(),
  resourceIds: z.array(z.string()).optional(),
  model: z.string().trim(),
  aspectRatio: z.string().trim().optional(),
  numberOfVariances: z.number().int().optional(),
  resolution: z.string().trim().optional(),
  socialTargets: z.array(SocialTargetSchema).optional()
});

export type TCreateImageChat = z.infer<typeof CreateImageChatSchema>;

export type TCreateChatResponse = {
  value: {
    chatId: string;
    correlationId: string;
  };
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};
