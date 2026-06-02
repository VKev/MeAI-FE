import DialogError from '@/components/common/DialogError';
import AIThinkingPanel from '@/components/ai-recommendation/AIThinkingPanel';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import PostEditMediaModal from '@/components/product/PostEditMediaModal';
import PostMediaSurface, {
  toGeneratedMediaDisplayItems,
  toPostMediaDisplayItems
} from '@/components/product/PostMediaSurface';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchPostById, updatePost, startAiPostImprove, fetchAiPostImprove, approveAiPostImprove, rejectAiPostImprove } from '@/services/client/post.client';
import { fetchNotifications } from '@/services/client/notification.client';
import { fetchFacebookPages, fetchSocialMedias } from '@/services/client/social-media.client';
import { fetchResources, uploadResource } from '@/services/client/resource.client';
import { mergeFacebookPagesWithAccounts } from '@/utils/social-media-display';
import { resolveMediaFormatLabel } from '@/utils/media-format';
import {
  isAiDraftPostGenerationNotification,
  selectAiRecommendationTimeline,
  useAiRecommendationEventStore
} from '@/store/ai-recommendation-events.store';
import DirectPostPublishDialog, { type DirectPostPublishPayload, type DirectPostPublishPlatform } from '@/components/publish/DirectPostPublishDialog';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Package,
  RefreshCw,
  Save,
  Sparkles,
  Image as ImageIcon,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useCallback, type ChangeEvent } from 'react';
import { useParams, useBlocker, Navigate } from 'react-router';
import type { MediaItem } from '@/components/workspace/common/media-types';
import type { SocialMedia } from '@/models/social-media.model';
import { toast } from 'react-toastify';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import type { Resource, ResourceCursor } from '@/models/resource.model';
import { formatPostType, normalizePostType, type EditablePostType } from '@/utils/post-type';

const POST_EDIT_RESOURCE_PAGE_SIZE = 50;
const POST_EDIT_FILE_INPUT_ACCEPT = 'image/*,video/*';
const POST_EDIT_MAX_UPLOAD_FILE_SIZE = 20 * 1024 * 1024;
const INITIAL_NOTIFICATION_HISTORY_LIMIT = 4;
const OLDER_NOTIFICATION_HISTORY_LIMIT = 8;
const CONTENT_CHARACTER_LIMIT = 2000;
const IMPROVE_PLATFORMS = ['facebook', 'instagram', 'tiktok', 'threads'] as const;
const NO_ACCOUNT_CONTEXT_VALUE = '__no_account_context__';

type ImprovePlatform = (typeof IMPROVE_PLATFORMS)[number];

function isAiResource(resource: Resource) {
  const originKind = resource.originKind?.toLowerCase() ?? '';
  return originKind === 'ai_generated' || originKind === 'ai_imported_url' || originKind.includes('ai');
}

function isVideoResource(resource: Resource) {
  const resourceType = resource.resourceType?.toLowerCase() ?? '';
  const contentType = resource.contentType?.toLowerCase() ?? '';
  return resourceType.includes('video') || contentType.startsWith('video/');
}

function inferUploadResourceType(file: File | null) {
  if (!file) {
    return null;
  }

  if (file.type.startsWith('image/')) {
    return 'IMAGE' as const;
  }

  if (file.type.startsWith('video/')) {
    return 'VIDEO' as const;
  }

  return null;
}

function normalizeImprovePlatform(value: string | null | undefined): ImprovePlatform | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized === 'fb') return 'facebook';
  if (normalized === 'ig') return 'instagram';
  if (normalized === 'thread') return 'threads';
  if (normalized === 'tik tok') return 'tiktok';
  return IMPROVE_PLATFORMS.includes(normalized as ImprovePlatform)
    ? normalized as ImprovePlatform
    : null;
}

function formatImprovePlatform(value: string | null | undefined) {
  const platform = normalizeImprovePlatform(value);
  if (!platform) {
    return 'Platform';
  }

  return platform === 'tiktok'
    ? 'TikTok'
    : platform.charAt(0).toUpperCase() + platform.slice(1);
}

function getImproveAccountDisplayName(account: SocialMedia) {
  if (normalizeImprovePlatform(account.type) === 'facebook') {
    return account.profile?.pageName || account.profile?.displayName || 'Facebook Page';
  }

  return account.profile?.displayName || account.profile?.username || 'Connected account';
}

function getImproveAccountAvatar(account: SocialMedia) {
  if (normalizeImprovePlatform(account.type) === 'facebook') {
    return account.profile?.pageProfilePictureUrl || account.profile?.profilePictureUrl || null;
  }

  return account.profile?.profilePictureUrl || null;
}

function getImproveAccountHandle(account: SocialMedia) {
  const platform = normalizeImprovePlatform(account.type);
  if (platform === 'facebook') {
    return account.profile?.pageId || account.profile?.userId || account.id;
  }

  return account.profile?.username ? `@${account.profile.username}` : account.id;
}

function getImprovePlatformTone(platform: ImprovePlatform | null) {
  switch (platform) {
    case 'facebook':
      return 'text-sky-300';
    case 'instagram':
      return 'text-pink-300';
    case 'tiktok':
      return 'text-white';
    case 'threads':
      return 'text-slate-200';
    default:
      return 'text-slate-300';
  }
}

function ProductEdit() {
  const { postId, workspaceId } = useParams();
  const queryClient = useQueryClient();
  const [isShowErrorDialog, setIsShowErrorDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Content edit state
  const [editContent, setEditContent] = useState<string>('');
  const [editPostType, setEditPostType] = useState<EditablePostType>('posts');

  // Media Modal state
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [mediaActiveTab, setMediaActiveTab] = useState<'user' | 'ai'>('user');
  const [userUploadMedia, setUserUploadMedia] = useState<MediaItem[]>([]);
  const [aiGenerationMedia, setAiGenerationMedia] = useState<MediaItem[]>([]);
  const [draftMediaSelections, setDraftMediaSelections] = useState<MediaItem[]>([]);

  const [isImproveModalOpen, setIsImproveModalOpen] = useState(false);
  const [improveInstruction, setImproveInstruction] = useState('');
  const [improveStyle, setImproveStyle] = useState('branded');
  const [improvePlatform, setImprovePlatform] = useState<string | null>(null);
  const [improveSocialMediaId, setImproveSocialMediaId] = useState<string | null | undefined>(undefined);
  const [improveCaption, setImproveCaption] = useState(true);
  const [improveImage, setImproveImage] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const originalPostBodyRef = useRef<HTMLDivElement>(null);
  const [aiThinkingPanelHeight, setAiThinkingPanelHeight] = useState<number | null>(null);

  const PRESET_PROMPTS = [
    'Make it shorter',
    'More engaging',
    'Add emojis',
    'Professional fix'
  ];

  if (!postId) {
    return null;
  }

  const { data, isFetching, isLoading, isError, refetch } = useQuery({
    queryKey: ['ai-recommendation-draft-post', postId],
    queryFn: () => fetchPostById(postId!),
    enabled: Boolean(postId)
  });

  const post = data?.value;

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['social-medias'],
    queryFn: () => fetchSocialMedias()
  });

  const { data: facebookPagesData, isLoading: isLoadingFacebookPages } = useQuery({
    queryKey: ['social-medias-facebook-pages'],
    queryFn: () => fetchFacebookPages()
  });

  const accounts = useMemo(
    () => mergeFacebookPagesWithAccounts(accountsData?.value ?? [], facebookPagesData?.value ?? null),
    [accountsData?.value, facebookPagesData?.value]
  );
  const inferredImprovePlatform = useMemo<ImprovePlatform>(() => {
    const postAccountId = post?.publications?.[0]?.socialMediaId || post?.socialMediaId;
    const postAccount = postAccountId ? accounts.find((account) => account.id === postAccountId) : null;
    const postPlatform =
      normalizeImprovePlatform(postAccount?.type) ||
      normalizeImprovePlatform(post?.publications?.[0]?.socialMediaType) ||
      normalizeImprovePlatform(post?.platform);
    const firstAccountPlatform = normalizeImprovePlatform(accounts[0]?.type);

    if (postPlatform) {
      const hasPostPlatformAccount = accounts.some((account) => normalizeImprovePlatform(account.type) === postPlatform);
      return hasPostPlatformAccount || !firstAccountPlatform ? postPlatform : firstAccountPlatform;
    }

    return firstAccountPlatform || 'facebook';
  }, [accounts, post]);
  const selectedImprovePlatform = normalizeImprovePlatform(improvePlatform) || inferredImprovePlatform;
  const improvePlatformAccounts = useMemo(
    () => accounts.filter((account) => normalizeImprovePlatform(account.type) === selectedImprovePlatform),
    [accounts, selectedImprovePlatform]
  );
  const defaultImproveAccount = useMemo(() => {
    const postAccountId = post?.publications?.[0]?.socialMediaId || post?.socialMediaId;
    const postAccount = postAccountId
      ? improvePlatformAccounts.find((account) => account.id === postAccountId)
      : null;

    return postAccount || improvePlatformAccounts[0] || null;
  }, [improvePlatformAccounts, post]);
  const selectedImproveAccount = useMemo(
    () => {
      if (improveSocialMediaId === null) {
        return null;
      }

      if (improveSocialMediaId) {
        return improvePlatformAccounts.find((account) => account.id === improveSocialMediaId) ?? null;
      }

      return defaultImproveAccount;
    },
    [defaultImproveAccount, improvePlatformAccounts, improveSocialMediaId]
  );
  const selectedImproveSocialMediaId = selectedImproveAccount?.id ?? null;
  const selectedImproveAccountName = selectedImproveAccount
    ? getImproveAccountDisplayName(selectedImproveAccount)
    : 'No account context';
  const selectedImproveAccountAvatar = selectedImproveAccount
    ? getImproveAccountAvatar(selectedImproveAccount)
    : null;
  const isLoadingImproveAccounts = isLoadingAccounts || isLoadingFacebookPages;

  // Fetch resources
  const {
    data: resourcesData,
    isLoading: isLoadingResources,
    isFetchingNextPage: isFetchingNextResourcePage,
    hasNextPage: hasNextResourcePage,
    fetchNextPage: fetchNextResourcePage
  } = useInfiniteQuery({
    queryKey: ['post-edit-resources'],
    initialPageParam: null as ResourceCursor | null,
    queryFn: ({ pageParam, signal }) =>
      fetchResources({
        limit: POST_EDIT_RESOURCE_PAGE_SIZE,
        cursor: pageParam ?? undefined,
        signal
      }),
    enabled: Boolean(postId),
    getNextPageParam: (lastPage) => {
      if (lastPage.value.length < POST_EDIT_RESOURCE_PAGE_SIZE) {
        return undefined;
      }

      const lastItem = lastPage.value[lastPage.value.length - 1];
      if (!lastItem?.createdAt || !lastItem?.id) {
        return undefined;
      }

      return {
        cursorCreatedAt: lastItem.createdAt,
        cursorId: lastItem.id
      };
    }
  });

  const updatePostMutation = useMutation({
    mutationFn: (payload: any) => updatePost(postId!, payload),
    onSuccess: (response) => {
      setHasChanges(false);
      setDraftMediaSelections([]);
      toast.success('Update successfully');
      queryClient.setQueryData(['ai-recommendation-draft-post', postId], response);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({
        queryKey: ['post-edit-resources']
      });
    },
    onError: (error) => {
      console.error('Failed to save changes:', error);
      toast.error('Failed to save changes. Please try again.');
    }
  });

  const uploadMediaMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: 'IMAGE' | 'VIDEO' }) => {
      return await uploadResource(file, type, undefined, 'user_upload');
    },
    onSuccess: (resource) => {
      const uploadedItem: MediaItem = {
        id: resource.id,
        url: resource.link,
        source: 'resource',
        isVideo: isVideoResource(resource),
        format: resolveMediaFormatLabel({ contentType: resource.contentType, url: resource.link, fallback: resource.resourceType })
      };

      setUserUploadMedia((current) => {
        if (current.some((item) => item.id === uploadedItem.id)) {
          return current;
        }

        return [uploadedItem, ...current];
      });
      setDraftMediaSelections((current) => {
        if (current.some((item) => item.id === uploadedItem.id)) {
          return current;
        }

        return [...current, uploadedItem];
      });
      setMediaActiveTab('user');
      toast.success('Resource uploaded successfully.');
      queryClient.invalidateQueries({ queryKey: ['post-edit-resources'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['storage-usage'] });
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
    },
    onError: (error) => {
      console.error('Failed to upload media:', error);
      toast.error(error.message || 'Failed to upload media.');
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
    }
  });

  const improvePostMutation = useMutation({
    mutationFn: () => startAiPostImprove(postId!, {
      improveCaption,
      improveImage,
      style: improveStyle,
      platform: selectedImprovePlatform,
      socialMediaId: selectedImproveSocialMediaId,
      userInstruction: improveInstruction || null
    }),
    onSuccess: (response) => {
      queryClient.setQueryData(['ai-post-improve', postId], response);
      queryClient.invalidateQueries({ queryKey: ['ai-recommendation-draft-post', postId] });
      setIsImproving(true);
      setIsImproveModalOpen(false);
      toast.success('AI Improvement started');
    },
    onError: (error) => {
      console.error('Failed to start AI improvement:', error);
      toast.error('Failed to start AI improvement. Please try again.');
      setIsImproving(false);
    }
  });

  const approveMutation = useMutation({
    mutationFn: () => approveAiPostImprove(postId!),
    onSuccess: () => {
      toast.success('AI suggestion applied!');
      setIsImproving(false);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['ai-recommendation-draft-post', postId] });
      queryClient.invalidateQueries({ queryKey: ['post-edit-resources'] });
      queryClient.removeQueries({ queryKey: ['ai-post-improve', postId] });
    },
    onError: () => toast.error('Failed to apply suggestion.')
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectAiPostImprove(postId!),
    onSuccess: () => {
      toast.info('AI suggestion discarded.');
      setIsImproving(false);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.removeQueries({ queryKey: ['ai-post-improve', postId] });
    },
    onError: () => toast.error('Failed to discard suggestion.')
  });

  const shouldFetchAiImprove = Boolean(
    postId &&
      (isImproving ||
        post?.aiImproveRecommendPostId ||
        post?.aiImproveCorrelationId ||
        post?.aiImproveStatus ||
        post?.isAiImproving ||
        post?.isAiImproveDone)
  );

  const { data: improveData, refetch: refetchImprove } = useQuery({
    queryKey: ['ai-post-improve', postId],
    queryFn: () => fetchAiPostImprove(postId!),
    enabled: shouldFetchAiImprove,
    staleTime: Infinity,
    retry: false,
    refetchInterval: false
  });

  const aiImprovement = improveData?.value;
  const rawAiImproveStatus = (aiImprovement?.status || post?.aiImproveStatus)?.toLowerCase() ?? null;
  const updatedAtTime = post?.updatedAt ? new Date(post.updatedAt).getTime() : 0;
  const isStalled = updatedAtTime > 0 && (Date.now() - updatedAtTime) > 5 * 60 * 1000;

  const isAiImproveFailed = rawAiImproveStatus === 'failed' || 
    ((rawAiImproveStatus === 'submitted' || rawAiImproveStatus === 'processing') && isStalled);

  const isAiImproving = (rawAiImproveStatus === 'submitted' || rawAiImproveStatus === 'processing') && !isAiImproveFailed;
  const isAiImproveDone = rawAiImproveStatus === 'completed';
  const aiImproveStatus = isAiImproveFailed ? 'failed' : rawAiImproveStatus;
  const improveTimeline = useAiRecommendationEventStore((state) =>
    selectAiRecommendationTimeline(state, [
      postId,
      aiImprovement?.correlationId,
      aiImprovement?.recommendId,
      aiImprovement?.recommendPostId,
      post?.aiImproveCorrelationId,
      post?.aiImproveRecommendPostId
    ])
  );
  const improveThinkingItems = improveTimeline?.items ?? [];
  const aiImproveHistoryId = useMemo(
    () =>
      aiImprovement?.correlationId ??
      post?.aiImproveCorrelationId ??
      aiImprovement?.recommendPostId ??
      aiImprovement?.recommendId ??
      post?.aiImproveRecommendPostId ??
      postId ??
      null,
    [
      aiImprovement?.correlationId,
      aiImprovement?.recommendId,
      aiImprovement?.recommendPostId,
      post?.aiImproveCorrelationId,
      post?.aiImproveRecommendPostId,
      postId
    ]
  );

  const notificationHistoryQuery = useInfiniteQuery({
    queryKey: ['ai-post-improve-event-history', aiImproveHistoryId],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const pageSize = pageParam ? OLDER_NOTIFICATION_HISTORY_LIMIT : INITIAL_NOTIFICATION_HISTORY_LIMIT;
      const response = await fetchNotifications({
        limit: pageSize,
        source: 'Creator',
        typePrefix: 'ai.post_improve.',
        relatedId: aiImproveHistoryId ?? undefined,
        beforeCreatedAt: pageParam
      });

      return { ...response, pageSize };
    },
    getNextPageParam: (lastPage) => {
      const notifications = lastPage.value ?? [];
      if (notifications.length < lastPage.pageSize) return undefined;
      return notifications.at(-1)?.createdAt;
    },
    enabled: Boolean(
      aiImproveHistoryId &&
        (isImproving || isAiImproving || isAiImproveDone || aiImprovement || post?.aiImproveCorrelationId)
    ),
    retry: false,
    staleTime: 3000
  });

  useEffect(() => {
    const notifications = notificationHistoryQuery.data?.pages.flatMap((page) => page.value ?? []) ?? [];
    const store = useAiRecommendationEventStore.getState();

    const orderedNotifications = Array.from(
      new Map(notifications.map((notification) => [notification.notificationId, notification])).values()
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    for (const notification of orderedNotifications) {
      if (isAiDraftPostGenerationNotification(notification.type)) {
        store.upsertNotification(notification);
      }
    }
  }, [notificationHistoryQuery.data]);

  useEffect(() => {
    if (isAiImproving) {
      setIsImproving(true);
    } else if (aiImproveStatus === 'completed' || aiImproveStatus === 'failed' || !aiImproveStatus) {
      setIsImproving(false);
    }
  }, [isAiImproving, aiImproveStatus]);

  const isShowPublish = post && post.status === 'draft' ? true : false;

  const publishPayloads = useMemo(() => {
    if (!post || !postId) return [];

    let platform = (post.platform?.toLowerCase() || post.publications?.[0]?.socialMediaType?.toLowerCase() || 'facebook') as DirectPostPublishPlatform;
    if (platform === 'thread') platform = 'thread';

    return [{
      postId: postId,
      platform: platform,
      content: editContent,
      resourceIds: post.content?.resource_list || [],
      mode: editPostType
    }] as DirectPostPublishPayload[];
  }, [editContent, editPostType, post, postId]);
  const resources = useMemo(() => resourcesData?.pages.flatMap((page) => page.value) ?? [], [resourcesData]);

  useEffect(() => {
    if (!post || isLoadingImproveAccounts) {
      return;
    }

    if (improveSocialMediaId === null) {
      return;
    }

    const platform = selectedImprovePlatform;
    if (improveSocialMediaId) {
      const selectedAccountStillMatches = accounts.some((account) =>
        account.id === improveSocialMediaId &&
        normalizeImprovePlatform(account.type) === platform);

      if (!selectedAccountStillMatches) {
        setImproveSocialMediaId(undefined);
      }
      return;
    }

    if (defaultImproveAccount?.id) {
      setImproveSocialMediaId(defaultImproveAccount.id);
    }
  }, [accounts, defaultImproveAccount, improveSocialMediaId, isLoadingImproveAccounts, post, selectedImprovePlatform]);

  useEffect(() => {
    if (resources.length > 0) {
      const postResourceIds = new Set(post?.content?.resource_list || []);
      const filteredResources = resources.filter((resource) => !postResourceIds.has(resource.id));

      const userUploads = filteredResources
        .filter((r) => !isAiResource(r))
        .map((r) => ({
          id: r.id,
          url: r.link,
          source: 'resource' as const,
          isVideo: isVideoResource(r),
          format: resolveMediaFormatLabel({ contentType: r.contentType, url: r.link, fallback: r.resourceType })
        }));

      const aiGenerations = filteredResources
        .filter((r) => isAiResource(r))
        .map((r) => ({
          id: r.id,
          url: r.link,
          source: 'resource' as const,
          isVideo: isVideoResource(r),
          format: resolveMediaFormatLabel({ contentType: r.contentType, url: r.link, fallback: r.resourceType })
        }));

      setUserUploadMedia(userUploads);
      setAiGenerationMedia(aiGenerations);
      return;
    }

    setUserUploadMedia([]);
    setAiGenerationMedia([]);
  }, [resources, post?.content?.resource_list]);

  useEffect(() => {
    const validStatuses = ['draft', 'scheduled', 'published', 'completed', 'archived', 'processing'];
    const currentStatus = post?.status?.toLowerCase() || '';
    const isStatusValid = !post || validStatuses.includes(currentStatus);
    const shouldShowErrorDialog = isError || !isStatusValid;

    if (shouldShowErrorDialog) {
      if (!isStatusValid) console.warn('[Debug] ProductEdit - Invalid Status:', currentStatus);
      setIsShowErrorDialog(true);
    }
  }, [isError, post]);

  useEffect(() => {
    if (post?.content) {
      setEditContent([post.content.content || '', post.content.hashtag || ''].filter(Boolean).join('\n\n'));
      setEditPostType(normalizePostType(post.content.post_type));
    }
  }, [post]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasChanges) return;
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    if (hasChanges) {
      window.addEventListener('beforeunload', onBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [hasChanges]);

  useEffect(() => {
    const originalBody = originalPostBodyRef.current;
    if (!isImproving || !originalBody) {
      setAiThinkingPanelHeight(null);
      return;
    }

    const updateHeight = () => {
      const nextHeight = Math.max(420, Math.round(originalBody.getBoundingClientRect().height - 32));
      setAiThinkingPanelHeight((currentHeight) => currentHeight === nextHeight ? currentHeight : nextHeight);
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(originalBody);
    window.addEventListener('resize', updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [isImproving, editContent, post?.media?.length, post?.content?.resource_list?.length]);

  const handleSaveChanges = useCallback(() => {
    if (!post) return;

    updatePostMutation.mutate({
      content: {
        ...post.content,
        content: editContent,
        hashtag: null,
        post_type: editPostType
      }
    });
  }, [post, editContent, editPostType, updatePostMutation]);

  const handleMediaSelectItem = useCallback((item: MediaItem) => {
    setDraftMediaSelections((prev) => {
      const exists = prev.some((m) => m.id === item.id);
      if (exists) {
        return prev.filter((m) => m.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  }, []);

  const handleMediaUploadClick = useCallback(() => {
    uploadInputRef.current?.click();
  }, []);

  const handleUploadInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }

    const type = inferUploadResourceType(file);
    if (!type) {
      toast.error('Only image and video files are allowed.');
      event.target.value = '';
      return;
    }

    if (file.size > POST_EDIT_MAX_UPLOAD_FILE_SIZE) {
      toast.error('File is too large. Maximum upload size is 20MB.');
      event.target.value = '';
      return;
    }

    uploadMediaMutation.mutate({ file, type });
  }, [uploadMediaMutation]);

  const handleMediaConfirm = useCallback(() => {
    if (!post) return;

    const newMediaIds = draftMediaSelections.map((m) => m.id);
    const newMediaList = [...(post.content?.resource_list || []), ...newMediaIds];

    updatePostMutation.mutate({
      content: {
        ...post.content,
        content: editContent,
        post_type: editPostType,
        resource_list: newMediaList
      }
    });

    setIsMediaModalOpen(false);
    setDraftMediaSelections([]);
  }, [post, editContent, editPostType, draftMediaSelections, updatePostMutation]);

  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    isVideo?: boolean;
  } | null>(null);

  const handleRemoveConfirm = useCallback(() => {
    if (!post || !removeTarget) return;

    const remaining = (post.content?.resource_list || []).filter((id) => id !== removeTarget);

    updatePostMutation.mutate({
      content: {
        ...post.content,
        content: editContent,
        post_type: editPostType,
        resource_list: remaining
      }
    });

    setIsRemoveDialogOpen(false);
    setRemoveTarget(null);
  }, [post, removeTarget, updatePostMutation, editContent, editPostType]);

  const handleRegenerate = useCallback(() => {
    setIsImproveModalOpen(true);
  }, []);

  const handleAiImprove = useCallback(() => {
    if (!improveCaption && !improveImage) {
      setImproveCaption(true);
      toast.error('Select content or media before starting optimization.');
      return;
    }

    improvePostMutation.mutate();
  }, [improveCaption, improveImage, improvePostMutation]);

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <header className='flex items-center gap-4'>
          <div className='flex items-center gap-4'>
            <div className='flex h-11 w-11 items-center justify-center rounded-[12px] bg-white/[0.05] text-white/80'>
              <Package className='h-5 w-5 animate-pulse' />
            </div>
            <div className='space-y-0.5'>
              <h1 className='text-xl font-bold tracking-tight text-white'>Edit Product</h1>
              <p className='text-[11px] font-medium uppercase tracking-widest text-slate-500'>
                Modify product content and media
              </p>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <Breadcrumb className='px-2'>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/workspace/${workspaceId || ''}/dashboard`}>Workspace</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/workspace/${workspaceId || ''}/product`}>Products</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-slate-400">Loading...</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <main className='mx-auto max-w-6xl space-y-5 py-2'>
          <section className='rounded-[28px] border border-white/10 bg-[#090c15]/90 shadow-[0_18px_48px_rgba(3,5,12,0.34)]'>
            <div className='border-b border-white/8 px-6 py-5'>
              <div className='h-5 w-40 animate-pulse rounded-md bg-white/10' />
              <div className='mt-3 h-3 w-72 max-w-full animate-pulse rounded bg-white/6' />
            </div>
            <div className='space-y-4 p-6'>
              <div className='h-48 animate-pulse rounded-2xl border border-white/8 bg-black/20' />
              <div className='flex flex-wrap gap-3'>
                <div className='h-10 w-32 animate-pulse rounded-xl bg-white/8' />
                <div className='h-10 w-28 animate-pulse rounded-xl bg-white/8' />
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (!post || isError) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-red-400 mb-4'>Failed to load post or post not found</p>
          <Button onClick={() => void refetch()} className='bg-violet-600 hover:bg-violet-700 text-white'>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (post && post.status === 'draft' && post.isAiRecommendedDraft && !post.isAiRecommendationDone) {
    return <Navigate to={`/workspace/${workspaceId}/product/ai-recommendation/${post.id}`} replace />;
  }

  const postDisplayName = post.title || post.content?.content?.split('\n')[0]?.slice(0, 72) || post.id;
  const platformLabel = post.publications?.[0]?.socialMediaType || post.platform || 'No platform';
  const mediaCount = post.media?.length ?? 0;
  const contentCharacterCount = editContent.length;
  const originalMediaItems = toPostMediaDisplayItems(post.media ?? []);
  const improvedGeneratedMediaItems = toGeneratedMediaDisplayItems(
    aiImprovement?.resultPresignedUrls,
    aiImprovement?.resultPresignedUrl,
    aiImprovement?.resultResourceIds,
    `ai-improved-${post.id}`
  );
  const improvedMediaItems = improvedGeneratedMediaItems.length > 0
    ? improvedGeneratedMediaItems
    : originalMediaItems;
  const improvedCaption = aiImprovement?.resultCaption || editContent;

  return (
    <>
      <div className='space-y-6'>
        <header className='flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex min-w-0 items-center gap-4'>
            <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.05] text-white/80'>
              <Package className='h-5 w-5' />
            </div>

            <div className='min-w-0 space-y-0.5'>
              <h1 className='truncate text-xl font-bold tracking-tight text-white'>Edit Product</h1>
              <p className='text-[11px] font-medium uppercase tracking-widest text-slate-500'>
                Modify product content and media
              </p>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-2 lg:justify-end'>
            <div className='flex h-10 items-center gap-2 rounded-[14px] bg-white/[0.05] px-4 text-xs text-slate-400'>
              <span>Platform</span>
              <span className='font-semibold capitalize text-slate-100'>{platformLabel}</span>
            </div>
            <div className='flex h-10 items-center gap-2 rounded-[14px] bg-white/[0.05] px-4 text-xs text-slate-400'>
              <span>Type</span>
              <span className='font-semibold text-slate-100'>{formatPostType(editPostType)}</span>
            </div>
            <div className='flex h-10 items-center gap-2 rounded-[14px] bg-white/[0.05] px-4 text-xs text-slate-400'>
              <ImageIcon className='h-4 w-4 text-slate-500' />
              <span className='font-semibold text-slate-100'>{mediaCount}</span>
            </div>
            <Button
              variant='outline'
              onClick={() => {
                void refetch();
                void refetchImprove();
                void notificationHistoryQuery.refetch();
              }}
              disabled={isFetching}
              className='h-10 rounded-[14px] border-none bg-white/[0.05] px-4 text-xs font-bold text-slate-200 hover:bg-white/[0.08] hover:text-white focus-visible:ring-2 focus-visible:ring-violet-400/60'
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            {isShowPublish && (
              <Button
                type='button'
                onClick={() => setIsPublishDialogOpen(true)}
                disabled={isImproving || isAiImproving}
                className='h-10 rounded-[14px] bg-white px-4 text-xs font-bold text-black hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-violet-300/70'
              >
                <CheckCircle2 className='mr-2 h-4 w-4' />
                Publish
              </Button>
            )}
          </div>
        </header>

        <Breadcrumb className='px-2'>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/workspace/${workspaceId}/dashboard`}>Workspace</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/workspace/${workspaceId}/product`}>Products</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className='max-w-[260px] truncate text-slate-400'>{postDisplayName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <main className='mx-auto max-w-6xl space-y-6 py-2'>
          <section className='overflow-hidden rounded-[28px] border border-white/10 bg-[#090c15]/90 shadow-[0_18px_48px_rgba(3,5,12,0.34)]'>
            <div className='flex flex-col gap-4 border-b border-white/8 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between'>
              <div className='space-y-1'>
                <div className='flex items-center gap-3'>
                  <span className='h-8 w-1 rounded-full bg-amber-400' />
                  <h2 className='text-xl font-semibold text-white'>Caption & Context</h2>
                </div>
                <p className='pl-4 text-sm text-slate-400'>Refine the post narrative, then improve or publish when it is ready.</p>
              </div>

              <div className='flex flex-wrap items-center gap-3'>
                <Dialog open={isImproveModalOpen} onOpenChange={setIsImproveModalOpen}>
                    <DialogTrigger asChild>
                      {!isAiImproveDone && (
                        <Button
                          type='button'
                          variant='outline'
                          disabled={isImproving || !editContent.trim()}
                          className='h-10 rounded-xl border-amber-400/25 bg-amber-400/8 px-5 text-amber-200 hover:bg-amber-400/12 hover:text-amber-100 focus-visible:ring-2 focus-visible:ring-amber-300/50'
                        >
                          {isImproving ? (
                            <>
                              <RefreshCw className='h-4 w-4 animate-spin' />
                              Improving...
                            </>
                          ) : (
                            <>
                              <Sparkles className='h-4 w-4' />
                              Improve
                            </>
                          )}
                        </Button>
                      )}
                    </DialogTrigger>
                    <DialogContent className='overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.98)_0%,rgba(8,10,18,0.99)_100%)] p-0 shadow-[0_24px_70px_rgba(3,5,12,0.72)] sm:max-w-[520px]'>
                      <div className='pointer-events-none absolute right-0 top-0 h-40 w-48 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.10),transparent_70%)]' />
                      <div className='relative z-10 space-y-6 p-5 sm:p-6'>
                        <div className='flex items-start gap-4'>
                          <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300/18 bg-amber-300/8 text-amber-200 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'>
                            <Sparkles className='h-6 w-6' />
                          </div>
                          <div className='min-w-0 space-y-1'>
                            <DialogTitle className='text-2xl font-semibold tracking-tight text-white'>AI Improve</DialogTitle>
                            <DialogDescription className='text-sm leading-relaxed text-slate-400'>
                              Refine the caption and media with account-aware context.
                            </DialogDescription>
                          </div>
                        </div>

                        <div className='space-y-3'>
                          <div className='flex items-center justify-between gap-3'>
                            <Label htmlFor='instruction' className='text-xs font-semibold text-slate-300'>Custom Instruction</Label>
                            <span className='text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600'>Optional</span>
                          </div>
                          <Input
                            id='instruction'
                            value={improveInstruction}
                            onChange={(e) => setImproveInstruction(e.target.value)}
                            placeholder='e.g. Write in a storytelling style...'
                            className='h-11 rounded-2xl border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-slate-600 focus-visible:border-amber-300/35 focus-visible:ring-2 focus-visible:ring-amber-300/20 focus-visible:ring-offset-0'
                          />
                          <div className='flex flex-wrap gap-2'>
                            {PRESET_PROMPTS.map(prompt => (
                              <button
                                key={prompt}
                                type='button'
                                onClick={() => {
                                  const newInstruction = improveInstruction
                                    ? `${improveInstruction.trim()}, ${prompt}`
                                    : prompt;
                                  setImproveInstruction(newInstruction);
                                }}
                                className='cursor-pointer rounded-xl border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-slate-400 transition-colors duration-200 hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/30'
                              >
                                {prompt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className='space-y-2.5'>
                          <Label htmlFor='style' className='text-xs font-semibold text-slate-300'>Target Audience & Tone</Label>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='outline'
                                className='h-11 w-full justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-normal text-white shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-amber-300/30 focus-visible:ring-offset-0'
                              >
                                <span className='flex items-center gap-2'>
                                  <span className='h-1.5 w-1.5 rounded-full bg-amber-300' />
                                  <span className='capitalize'>{improveStyle}</span>
                                </span>
                                <ChevronDown className='h-4 w-4 text-slate-500' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='z-[110] w-64 rounded-2xl border-white/10 bg-[#0a0d18] p-1 text-white shadow-2xl'>
                              <DropdownMenuRadioGroup value={improveStyle} onValueChange={setImproveStyle}>
                                <DropdownMenuRadioItem value='branded' className='cursor-pointer rounded-xl py-2 text-xs focus:bg-amber-300/10 focus:text-amber-200'>Branded</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value='creative' className='cursor-pointer rounded-xl py-2 text-xs focus:bg-amber-300/10 focus:text-amber-200'>Creative</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value='marketing' className='cursor-pointer rounded-xl py-2 text-xs focus:bg-amber-300/10 focus:text-amber-200'>Marketing</DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className='grid gap-4 sm:grid-cols-2'>
                          <div className='space-y-2.5'>
                            <Label className='text-xs font-semibold text-slate-300'>Target Platform</Label>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='outline'
                                  className='h-11 w-full justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-normal text-white shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-amber-300/30 focus-visible:ring-offset-0'
                                >
                                  <span className={cn('font-semibold', getImprovePlatformTone(selectedImprovePlatform))}>
                                    {formatImprovePlatform(selectedImprovePlatform)}
                                  </span>
                                  <ChevronDown className='h-4 w-4 text-slate-500' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className='z-[110] w-64 rounded-2xl border-white/10 bg-[#0a0d18] p-1 text-white shadow-2xl'>
                                <DropdownMenuRadioGroup
                                  value={selectedImprovePlatform}
                                  onValueChange={(value) => {
                                    const nextPlatform = normalizeImprovePlatform(value) || 'facebook';
                                    setImprovePlatform(nextPlatform);
                                    setImproveSocialMediaId((current) => current === null ? null : undefined);
                                  }}
                                >
                                  {IMPROVE_PLATFORMS.map((platform) => (
                                    <DropdownMenuRadioItem
                                      key={platform}
                                      value={platform}
                                      className={cn(
                                        'cursor-pointer rounded-xl py-2 text-xs focus:bg-white/6',
                                        getImprovePlatformTone(platform)
                                      )}
                                    >
                                      {formatImprovePlatform(platform)}
                                    </DropdownMenuRadioItem>
                                  ))}
                                </DropdownMenuRadioGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className='space-y-2.5'>
                            <Label className='text-xs font-semibold text-slate-300'>Account Context</Label>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='outline'
                                  disabled={isLoadingImproveAccounts}
                                  className='h-11 w-full justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-left text-sm font-normal text-white shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-amber-300/30 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60'
                                >
                                  <span className='flex min-w-0 items-center gap-2'>
                                    <span className='flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/8 text-[11px] font-semibold text-slate-300'>
                                      {selectedImproveAccountAvatar ? (
                                        <img src={selectedImproveAccountAvatar} alt='' className='h-full w-full object-cover' />
                                      ) : (
                                        selectedImproveAccountName.charAt(0).toUpperCase()
                                      )}
                                    </span>
                                    <span className='min-w-0 truncate'>
                                      {isLoadingImproveAccounts
                                        ? 'Loading accounts'
                                        : selectedImproveAccountName}
                                    </span>
                                  </span>
                                  <ChevronDown className='h-4 w-4 shrink-0 text-slate-500' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className='z-[110] w-[320px] rounded-2xl border-white/10 bg-[#0a0d18] p-1 text-white shadow-2xl'>
                                {isLoadingImproveAccounts ? (
                                  <div className='px-3 py-4 text-xs leading-relaxed text-slate-500'>
                                    Loading connected accounts...
                                  </div>
                                ) : (
                                  <DropdownMenuRadioGroup
                                    value={selectedImproveSocialMediaId ?? NO_ACCOUNT_CONTEXT_VALUE}
                                    onValueChange={(value) => {
                                      setImproveSocialMediaId(value === NO_ACCOUNT_CONTEXT_VALUE ? null : value);
                                    }}
                                  >
                                    <DropdownMenuRadioItem
                                      value={NO_ACCOUNT_CONTEXT_VALUE}
                                      className='cursor-pointer rounded-xl py-2 focus:bg-white/6 focus:text-white'
                                    >
                                      <span className='flex min-w-0 items-center gap-3'>
                                        <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/8 text-xs font-semibold text-slate-300'>
                                          N
                                        </span>
                                        <span className='min-w-0'>
                                          <span className='block truncate text-xs font-semibold text-slate-100'>No account context</span>
                                          <span className='block truncate text-[10px] text-slate-500'>Use platform and style knowledge only</span>
                                        </span>
                                      </span>
                                    </DropdownMenuRadioItem>
                                    {improvePlatformAccounts.map((account) => {
                                      const accountName = getImproveAccountDisplayName(account);
                                      const accountAvatar = getImproveAccountAvatar(account);
                                      const accountHandle = getImproveAccountHandle(account);

                                      return (
                                        <DropdownMenuRadioItem
                                          key={account.id}
                                          value={account.id}
                                          className='cursor-pointer rounded-xl py-2 focus:bg-white/6 focus:text-white'
                                        >
                                          <span className='flex min-w-0 items-center gap-3'>
                                            <span className='flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/8 text-xs font-semibold text-slate-300'>
                                              {accountAvatar ? (
                                                <img src={accountAvatar} alt='' className='h-full w-full object-cover' />
                                              ) : (
                                                accountName.charAt(0).toUpperCase()
                                              )}
                                            </span>
                                            <span className='min-w-0'>
                                              <span className='block truncate text-xs font-semibold text-slate-100'>{accountName}</span>
                                              <span className='block truncate text-[10px] text-slate-500'>{accountHandle}</span>
                                            </span>
                                          </span>
                                        </DropdownMenuRadioItem>
                                      );
                                    })}
                                    {improvePlatformAccounts.length === 0 ? (
                                      <div className='px-3 py-3 text-xs leading-relaxed text-slate-500'>
                                        No connected {formatImprovePlatform(selectedImprovePlatform)} account found. You can still run without account context.
                                      </div>
                                    ) : null}
                                  </DropdownMenuRadioGroup>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <p className='text-[11px] leading-relaxed text-slate-500'>
                              {selectedImproveSocialMediaId
                                ? "MeAI reads this account's posts and profile when available."
                                : 'Account context is optional. Without it, MeAI uses platform and style knowledge only.'}
                            </p>
                          </div>
                        </div>

                        <div className='space-y-3 pt-1'>
                          <Label className='text-xs font-semibold text-slate-300'>Refinement Scope</Label>
                          <div className='grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-black/20 p-1'>
                            <button
                              type='button'
                              onClick={() => {
                                if (improveCaption && !improveImage) return;
                                setImproveCaption(!improveCaption);
                              }}
                              className={cn(
                                'flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/30',
                                improveCaption
                                  ? 'border border-amber-300/25 bg-amber-300/12 text-amber-100 shadow-[0_8px_24px_rgba(245,158,11,0.10)]'
                                  : 'text-slate-500 hover:bg-white/6 hover:text-slate-200'
                              )}
                            >
                              <Package className='h-3.5 w-3.5' />
                              Content
                            </button>
                            <button
                              type='button'
                              onClick={() => {
                                if (improveImage && !improveCaption) return;
                                setImproveImage(!improveImage);
                              }}
                              className={cn(
                                'flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/30',
                                improveImage
                                  ? 'border border-amber-300/25 bg-amber-300/12 text-amber-100 shadow-[0_8px_24px_rgba(245,158,11,0.10)]'
                                  : 'text-slate-500 hover:bg-white/6 hover:text-slate-200'
                              )}
                            >
                              <ImageIcon className='h-3.5 w-3.5' />
                              Media
                            </button>
                          </div>
                        </div>

                        <Button
                          type='button'
                          onClick={handleAiImprove}
                          disabled={improvePostMutation.isPending || (!improveCaption && !improveImage)}
                          className='h-12 w-full rounded-2xl border border-amber-300/20 bg-amber-400 font-semibold text-black shadow-lg shadow-amber-950/30 hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-amber-200/70 disabled:cursor-not-allowed disabled:opacity-60'
                        >
                          {improvePostMutation.isPending ? (
                            <>
                              <RefreshCw className='h-4 w-4 animate-spin' />
                              Starting...
                            </>
                          ) : (
                            'Start Optimization'
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {!isImproving && (
                    <Button
                      type='button'
                      onClick={handleSaveChanges}
                      disabled={!hasChanges || updatePostMutation.isPending}
                      className='h-10 rounded-xl bg-violet-600 px-5 font-semibold text-white shadow-lg shadow-violet-950/30 hover:bg-violet-500 focus-visible:ring-2 focus-visible:ring-violet-300/70'
                    >
                      <Save className='h-4 w-4' />
                      Save Changes
                    </Button>
                  )}
                </div>
              </div>

            <div className='p-5 sm:p-6'>
              <div className='grid grid-cols-1 gap-5 xl:grid-cols-2'>
                <article className='flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/20'>
                  <div className='flex flex-col gap-3 border-b border-white/8 px-4 py-4 sm:flex-row sm:items-start sm:justify-between lg:h-[108px] lg:min-h-[108px]'>
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2'>
                        <div className='h-1.5 w-1.5 rounded-full bg-slate-400' />
                        <h3 className='text-sm font-semibold uppercase tracking-[0.16em] text-slate-300'>Original Post</h3>
                      </div>
                      <p className='mt-1 text-xs text-slate-500'>
                        Neutral post editor with large media and editable caption
                      </p>
                    </div>
                  </div>

                  <div ref={originalPostBodyRef} className='space-y-4 p-4'>
                    <div className='flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between'>
                      <div>
                        <Label className='text-xs font-semibold uppercase tracking-[0.14em] text-slate-500'>Post type</Label>
                        <p className='mt-1 text-xs text-slate-500'>
                          Use Post for images. Facebook and Instagram Reels require video.
                        </p>
                      </div>
                      <div
                        role='group'
                        aria-label='Post type'
                        className='flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-black/25 p-1'
                      >
                        {(['posts', 'reels'] as const).map((postType) => {
                          const isActive = editPostType === postType;
                          return (
                            <button
                              key={postType}
                              type='button'
                              aria-pressed={isActive}
                              onClick={() => {
                                setEditPostType(postType);
                                setHasChanges(true);
                              }}
                              className={cn(
                                'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/50',
                                isActive
                                  ? 'bg-violet-500/20 text-violet-100'
                                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                              )}
                            >
                              {formatPostType(postType)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className='flex h-[300px] min-h-[300px] max-h-[300px] min-w-0 flex-col overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4'>
                      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
                        <div>
                          <Label htmlFor='post-content-editor' className='text-xs font-semibold uppercase tracking-[0.14em] text-slate-500'>
                            Caption
                          </Label>
                          <p className='mt-1 text-xs text-slate-500'>Edit the copy that will publish with the media.</p>
                        </div>
                        <span className={cn(
                          'font-mono text-xs transition-colors duration-200',
                          contentCharacterCount > CONTENT_CHARACTER_LIMIT ? 'text-red-400' : 'text-slate-500'
                        )}>
                          {contentCharacterCount.toLocaleString()} / {CONTENT_CHARACTER_LIMIT.toLocaleString()}
                        </span>
                      </div>
                      <textarea
                        id='post-content-editor'
                        value={editContent}
                        onChange={(e) => {
                          setEditContent(e.target.value);
                          setHasChanges(true);
                        }}
                        placeholder='Describe your post... MeAI will help you optimize it later.'
                        className='min-h-0 w-full flex-1 resize-none overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-4 text-[14px] leading-7 text-slate-100 placeholder:text-slate-600 transition-colors duration-200 focus:border-amber-300/30 focus:bg-black/35 focus:outline-none focus:ring-2 focus:ring-amber-300/10'
                      />
                      <div className='mt-3 flex items-center gap-2 text-xs text-slate-500'>
                        <div className={cn('h-2 w-2 rounded-full', hasChanges ? 'bg-amber-400' : 'bg-emerald-400')} />
                        <span>{hasChanges ? 'Unsaved changes' : 'No unsaved changes'}</span>
                      </div>
                    </div>

                    <PostMediaSurface
                      items={originalMediaItems}
                      tone='original'
                      emptyTitle='No media attached'
                      emptyDescription='Add image or video media here. The media surface stays inside the original post card.'
                      addLabel='Add Media'
                      onAddMedia={() => setIsMediaModalOpen(true)}
                      onOpenMedia={(item) => setPreviewMedia({ url: item.url, isVideo: item.isVideo })}
                      onRemoveMedia={(item) => {
                        if (!item.resourceId) return;
                        setRemoveTarget(item.resourceId);
                        setIsRemoveDialogOpen(true);
                      }}
                    />
                  </div>
                </article>

                <article className='flex flex-col overflow-hidden rounded-2xl border border-amber-300/18 bg-amber-300/[0.025]'>
                  <div className='flex flex-col gap-3 border-b border-amber-300/12 px-4 py-4 sm:flex-row sm:items-start sm:justify-between lg:h-[108px] lg:min-h-[108px]'>
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2'>
                        <div className={cn('h-1.5 w-1.5 rounded-full', isAiImproveFailed ? 'bg-rose-500' : 'bg-amber-300')} />
                        <h3 className={cn('text-sm font-semibold uppercase tracking-[0.16em]', isAiImproveFailed ? 'text-rose-400' : 'text-amber-200')}>
                          {isAiImproveFailed ? 'AI Improve Failed' : 'AI Improved'}
                        </h3>
                      </div>
                      <p className='mt-1 text-xs text-slate-500'>
                        {isImproving ? 'AI thinking and recommendation progress' : isAiImproveFailed ? 'The post optimization process failed' : isAiImproveDone ? 'Preview the optimized post before applying it' : 'Run AI improve to compare against the original'}
                      </p>
                    </div>

                    {isAiImproveDone && !isImproving ? (
                      <div className='flex shrink-0 flex-nowrap items-center gap-1 rounded-xl border border-white/10 bg-black/20 p-1'>
                        <button
                          type='button'
                          onClick={handleRegenerate}
                          className='flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-slate-400 transition-colors duration-200 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20'
                        >
                          <RefreshCw className='h-3.5 w-3.5' />
                          Regenerate
                        </button>
                        <button
                          type='button'
                          onClick={() => rejectMutation.mutate()}
                          disabled={rejectMutation.isPending || approveMutation.isPending}
                          className='flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-rose-300 transition-colors duration-200 hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/30 disabled:cursor-not-allowed disabled:opacity-60'
                        >
                          {rejectMutation.isPending ? <RefreshCw className='h-3.5 w-3.5 animate-spin' /> : <ThumbsDown className='h-3.5 w-3.5' />}
                          Reject
                        </button>
                        <button
                          type='button'
                          onClick={() => approveMutation.mutate()}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          className='flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-emerald-300 transition-colors duration-200 hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/30 disabled:cursor-not-allowed disabled:opacity-60'
                        >
                          {approveMutation.isPending ? <RefreshCw className='h-3.5 w-3.5 animate-spin' /> : <ThumbsUp className='h-3.5 w-3.5' />}
                          Approve
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className='flex flex-1 flex-col p-4'>
                    {isImproving ? (
                      <div
                        className={cn('flex animate-in fade-in duration-500', !aiThinkingPanelHeight && 'h-120')}
                        style={aiThinkingPanelHeight ? { height: aiThinkingPanelHeight } : undefined}
                      >
                        <AIThinkingPanel
                          thinkings={improveThinkingItems}
                          isActive
                          isLoading={improveThinkingItems.length === 0}
                          tone='amber'
                          layout='fill'
                          hasMore={notificationHistoryQuery.hasNextPage}
                          isLoadingMore={notificationHistoryQuery.isFetchingNextPage}
                          onLoadMore={() => {
                            if (notificationHistoryQuery.hasNextPage && !notificationHistoryQuery.isFetchingNextPage) {
                              void notificationHistoryQuery.fetchNextPage();
                            }
                          }}
                        />
                      </div>
                    ) : isAiImproveFailed ? (
                      <div className='flex min-h-[520px] flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-rose-500/15 bg-black/15 p-8 text-center'>
                        <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/15 bg-rose-500/8 text-rose-200'>
                          <AlertTriangle className='h-7 w-7' />
                        </div>
                        <h4 className='mt-5 text-lg font-semibold text-white'>AI Improve Failed</h4>
                        <p className='mt-2 max-w-sm text-sm leading-relaxed text-rose-200/60'>
                          {post?.aiImproveErrorMessage || 'The post improvement process encountered an error.'}
                        </p>
                        <Button
                          type='button'
                          onClick={() => setIsImproveModalOpen(true)}
                          disabled={!editContent.trim()}
                          className='mt-6 h-10 rounded-xl bg-amber-400 px-5 font-semibold text-black shadow-lg shadow-amber-950/30 hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-amber-200/70 disabled:cursor-not-allowed disabled:opacity-60'
                        >
                          <Sparkles className='mr-2 h-4 w-4' />
                          Try Again
                        </Button>
                      </div>
                    ) : isAiImproveDone ? (
                      <div className='space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500'>
                        <div className='flex h-[300px] min-h-[300px] max-h-[300px] min-w-0 flex-col overflow-hidden rounded-2xl border border-amber-300/16 bg-[linear-gradient(180deg,rgba(251,191,36,0.08),rgba(251,191,36,0.025))] p-4'>
                          <div className='mb-3 flex items-center justify-between gap-3'>
                            <div>
                              <p className='text-xs font-semibold uppercase tracking-[0.14em] text-amber-200'>Improved Caption</p>
                              <p className='mt-1 text-xs text-slate-500'>Review the AI-written copy before approving.</p>
                            </div>
                          </div>
                          <div className='min-h-0 w-full flex-1 overflow-y-auto overscroll-contain whitespace-pre-wrap break-words rounded-xl border border-amber-300/12 bg-black/25 p-4 pr-5 text-[14px] leading-7 text-slate-100 [overflow-wrap:anywhere]'>
                            {improvedCaption || <span className='italic text-slate-600'>No improved caption returned.</span>}
                          </div>
                        </div>

                        <PostMediaSurface
                          items={improvedMediaItems}
                          tone='improved'
                          emptyTitle='No improved media'
                          emptyDescription='The AI result only changed the caption. Media will stay unchanged unless you ask AI to improve it.'
                          onOpenMedia={(item) => setPreviewMedia({ url: item.url, isVideo: item.isVideo })}
                        />
                      </div>
                    ) : (
                      <div className='flex min-h-[520px] flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-amber-300/15 bg-black/15 p-8 text-center'>
                        <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/15 bg-amber-300/8 text-amber-200'>
                          <Sparkles className='h-7 w-7' />
                        </div>
                        <h4 className='mt-5 text-lg font-semibold text-white'>No AI version yet</h4>
                        <p className='mt-2 max-w-sm text-sm leading-relaxed text-slate-500'>
                          Improve the original post to generate a second card for side-by-side review.
                        </p>
                        <Button
                          type='button'
                          onClick={() => setIsImproveModalOpen(true)}
                          disabled={!editContent.trim()}
                          className='mt-6 h-10 rounded-xl bg-amber-400 px-5 font-semibold text-black shadow-lg shadow-amber-950/30 hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-amber-200/70 disabled:cursor-not-allowed disabled:opacity-60'
                        >
                          <Sparkles className='mr-2 h-4 w-4' />
                          Improve with AI
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              </div>

              {post?.publications && post.publications.length > 0 && (
                <div className='mt-6 border-t border-white/8 pt-5'>
                  <div className='mb-3 flex items-center gap-3 px-1'>
                    <div className='h-1.5 w-1.5 rounded-full bg-emerald-400' />
                    <p className='text-[11px] font-semibold uppercase tracking-widest text-slate-500'>Current Distribution</p>
                  </div>
                  <div className='flex flex-wrap gap-2 px-1'>
                    {post.publications.map((pub) => (
                      <div
                        key={pub.id}
                        className='flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-slate-400'
                      >
                        <div className='h-1.5 w-1.5 rounded-full bg-blue-400/70' />
                        {pub.socialMediaType}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Dialogs */}
      <input
        ref={uploadInputRef}
        type='file'
        accept={POST_EDIT_FILE_INPUT_ACCEPT}
        onChange={handleUploadInputChange}
        className='sr-only'
      />

      <PostEditMediaModal
        isOpen={isMediaModalOpen}
        onOpenChange={setIsMediaModalOpen}
        userUploadItems={userUploadMedia}
        aiGenerationItems={aiGenerationMedia}
        activeTab={mediaActiveTab}
        onTabChange={setMediaActiveTab}
        draftSelections={draftMediaSelections}
        currentMediaCount={post.media?.length || 0}
        onSelectItem={handleMediaSelectItem}
        onUploadClick={handleMediaUploadClick}
        onClose={() => {
          setIsMediaModalOpen(false);
          setDraftMediaSelections([]);
        }}
        onConfirm={handleMediaConfirm}
        confirmDisabled={draftMediaSelections.length === 0}
        isLoading={isLoadingResources}
        isFetchingNextPage={isFetchingNextResourcePage}
        isUploading={uploadMediaMutation.isPending}
        hasNextPage={hasNextResourcePage}
        onLoadMore={() => void fetchNextResourcePage()}
      />

      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent className='border-white/15 bg-[#060912] text-white rounded-3xl'>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Media</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to remove this media from the post?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='border-white/10 bg-white/4 text-white/85 hover:bg-white/8 hover:text-white rounded-xl'>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveConfirm} className='bg-red-600 hover:bg-red-700 text-white rounded-xl'>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DirectPostPublishDialog
        isOpen={isPublishDialogOpen}
        onClose={() => setIsPublishDialogOpen(false)}
        payloads={publishPayloads}
        accounts={accounts}
        invalidateQueryKeys={[['ai-recommendation-draft-post', postId]]}
      />

      <Dialog open={Boolean(previewMedia)} onOpenChange={(open: boolean) => !open && setPreviewMedia(null)}>
        <DialogContent className='flex items-center justify-center min-w-[40vw] max-w-[80vw] max-h-[80vh] p-0 border-none bg-transparent'>
          <DialogTitle className='sr-only'>Media Preview</DialogTitle>
          <DialogDescription className='sr-only'>Preview the selected post media.</DialogDescription>
          {previewMedia && (
            <div className='w-full h-full flex items-center justify-center bg-[#080A12]/90 backdrop-blur-3xl p-4 rounded-3xl border border-white/10 overflow-hidden shadow-2xl'>
              {previewMedia.isVideo ? (
                <video src={previewMedia.url} controls className='max-h-full max-w-full rounded-2xl' />
              ) : (
                <img src={previewMedia.url} alt='Preview' className='max-h-full max-w-full rounded-2xl' />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isShowErrorDialog && <DialogError isOpen={isShowErrorDialog} />}
    </>
  );
}

export default ProductEdit;
