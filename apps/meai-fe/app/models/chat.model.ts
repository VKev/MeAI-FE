import z from "zod";
import type { TMediaResource } from '@/store/media-resource.store';

export type TChatConfig = string | Record<string, unknown> | null;

export type TChatResource = {
  resourceId: string;
  url: string;
  resourceType: string | null;
  contentType: string | null;
};

export type TChatMediaKind = 'image' | 'video';

export type TChat = {
  id: string;
  sessionId: string;
  prompt: string;
  config: TChatConfig;
  referenceResourceIds: string[] | null;
  resultResourceIds: string[] | null;
  referenceResources: TChatResource[] | null;
  resultResources: TChatResource[] | null;
  referenceResourceUrls: string[] | null;
  resultResourceUrls: string[] | null;
  status: string | null;
  errorMessage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

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
  const resourceType = 'resourceType' in resource ? resource.resourceType?.toLowerCase() ?? '' : resource.type?.toLowerCase() ?? '';
  const contentType = 'contentType' in resource ? resource.contentType?.toLowerCase() ?? '' : '';

  return resourceType === 'video' || contentType.startsWith('video/') || resourceType.endsWith('video');
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov|m4v|avi|m3u8)(\?|#|$)/i.test(url);
}

export function getChatMediaKind(chat: Pick<TChat, 'config' | 'resultResources' | 'resultResourceUrls'>): TChatMediaKind {
  const resources = [...(chat.resultResources ?? [])];
  if (resources.some((resource) => isVideoResourceDescriptor(resource))) {
    return 'video';
  }

  const parsedConfig = parseChatConfig(chat.config);
  if (!parsedConfig) {
    const urls = [...(chat.resultResourceUrls ?? [])];
    return urls.some(isVideoUrl) ? 'video' : 'image';
  }

  const generationType = toLowerText(
    parsedConfig.type ?? parsedConfig.Type ?? parsedConfig.generationType ?? parsedConfig.GenerationType
  );
  if (generationType === 'video') return 'video';

  const enableTranslation = parsedConfig.EnableTranslation ?? parsedConfig.enableTranslation;
  if (enableTranslation === true) return 'video';

  const urls = [...(chat.resultResourceUrls ?? [])];
  return urls.some(isVideoUrl) ? 'video' : 'image';
}

export function getChatMediaItems(chat: Pick<TChat, 'id' | 'config' | 'resultResources' | 'resultResourceUrls'>): TMediaResource[] {
  const chatMediaKind = getChatMediaKind(chat);
  const mediaItems = [...(chat.resultResources ?? [])].map((resource, index) => {
    const isVideo = isVideoResourceDescriptor(resource) || chatMediaKind === 'video';

    return {
      id: resource.resourceId || `${chat.id}-media-${index}`,
      name: `Media ${index + 1}`,
      type: isVideo ? 'video' : 'image',
      url: resource.url,
      thumbnail_url: resource.url
    };
  });

  if (mediaItems.length > 0) {
    return mediaItems;
  }

  const fallbackUrls = [...(chat.resultResourceUrls ?? [])];
  return fallbackUrls.map((url, index) => ({
    id: `${chat.id}-media-${index}`,
    name: `Media ${index + 1}`,
    type: chatMediaKind,
    url,
    thumbnail_url: url
  }));
}

export type TGetAllChatResponse = {
  value: TChat[],
  isSuccess: boolean,
  isFailure: boolean,
  error: {
    code: string;
    description: string;
  }
}

export type TChatResponse = {
  value: TChat,
  isSuccess: boolean,
  isFailure: boolean,
  error: {
    code: string;
    description: string;
  }
}

export type TDeleteChatResponse = {
  value: boolean,
  isSuccess: boolean,
  isFailure: boolean,
  error: {
    code: string;
    description: string;
  }
}

export const CreateVideoChatSchema = z.object({
  chatSessionId: z.string().trim(),
  prompt: z.string().trim(),
  resourceIds: z.array(z.string()).optional(),
  model: z.string().trim(),
  aspectRatio: z.string().trim().optional(),
  seeds: z.array(z.number().int()).optional(),
  enableTranslation: z.boolean().optional(),
  watermark: z.string().trim().optional(),
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
    chatId: string,
    correlationId: string
  },
  isSuccess: boolean,
  isFailure: boolean,
  error: {
    code: string,
    description: string
  }
}

