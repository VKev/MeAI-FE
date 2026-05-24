import AIRecommendedPostPanel from '@/components/ai-recommendation/AIRecommendedPostPanel';
import AIThinkingPanel from '@/components/ai-recommendation/AIThinkingPanel';
import DialogError from '@/components/common/DialogError';
import PostEditMediaModal from '@/components/product/PostEditMediaModal';
import DirectPostPublishDialog, {
  type DirectPostPublishMode,
  type DirectPostPublishPayload,
  type DirectPostPublishPlatform
} from '@/components/publish/DirectPostPublishDialog';
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import type { Post } from '@/models/post.model';
import type { Resource, ResourceCursor } from '@/models/resource.model';
import type { SocialMedia } from '@/models/social-media.model';
import type { MediaItem } from '@/components/workspace/common/media-types';
import { fetchAiRecommendationDraftPost } from '@/services/client/ai-recommendation.client';
import { fetchNotifications } from '@/services/client/notification.client';
import { fetchPostById, updatePost } from '@/services/client/post.client';
import { fetchResources, uploadResource } from '@/services/client/resource.client';
import { fetchFacebookPages, fetchSocialMedias } from '@/services/client/social-media.client';
import { hasRole, requireUser } from '@/services/server/session.server';
import {
  isAiDraftPostGenerationNotification,
  selectAiRecommendationTimeline,
  useAiRecommendationEventStore,
  type AiRecommendationThinkingItem
} from '@/store/ai-recommendation-events.store';
import { mergeFacebookPagesWithAccounts } from '@/utils/social-media-display';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, BotIcon, CheckCircle2, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link, Navigate, redirect, useParams, type LoaderFunctionArgs } from 'react-router';
import { toast } from 'react-toastify';

const TERMINAL_TASK_STATUSES = new Set(['completed', 'failed']);
const INITIAL_NOTIFICATION_HISTORY_LIMIT = 4;
const OLDER_NOTIFICATION_HISTORY_LIMIT = 8;
const RECOMMENDATION_RESOURCE_PAGE_SIZE = 50;
const RECOMMENDATION_FILE_INPUT_ACCEPT = 'image/*,video/*';
const RECOMMENDATION_MAX_UPLOAD_FILE_SIZE = 20 * 1024 * 1024;

function normalizePublishPlatform(type?: string | null): DirectPostPublishPlatform | null {
  switch (type?.trim().toLowerCase()) {
    case 'facebook':
    case 'fb':
      return 'facebook';
    case 'instagram':
    case 'ig':
      return 'instagram';
    case 'tiktok':
      return 'tiktok';
    case 'thread':
    case 'threads':
      return 'thread';
    default:
      return null;
  }
}

function isVideoMedia(post: Post) {
  return post.media.some((item) => {
    const resourceType = item.resourceType?.toLowerCase() ?? '';
    const contentType = item.contentType?.toLowerCase() ?? '';
    return resourceType === 'video' || contentType.startsWith('video/');
  });
}

function isImageMedia(post: Post) {
  return post.media.some((item) => {
    const resourceType = item.resourceType?.toLowerCase() ?? '';
    const contentType = item.contentType?.toLowerCase() ?? '';
    return resourceType === 'image' || contentType.startsWith('image/');
  });
}

function resolveRecommendedPostMode(post: Post, platform: DirectPostPublishPlatform): DirectPostPublishMode {
  const postType = post.content?.post_type?.trim().toLowerCase() ?? '';

  if (platform === 'tiktok') {
    if (postType === 'image' || (!isVideoMedia(post) && isImageMedia(post))) return 'image';
    return 'video';
  }

  if (platform === 'facebook' || platform === 'instagram') {
    return postType === 'reel' || postType === 'reels' || postType === 'video' ? 'reel' : 'post';
  }

  return 'post';
}

function collectRecommendedPostResourceIds(post: Post) {
  const ids = [...post.media.map((item) => item.resourceId), ...(post.content?.resource_list ?? [])].filter(Boolean);

  return Array.from(new Set(ids));
}

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

function getInitialCombinedContent(post?: Post | null) {
  if (!post) return '';
  return [post.content?.content || '', post.content?.hashtag || ''].filter(Boolean).join('\n\n');
}

function normalizeStatus(status?: string | null) {
  return status?.toLowerCase() ?? '';
}

function isAiRecommendationDraft(post?: Post | null) {
  return normalizeStatus(post?.status) === 'draft' && Boolean(post?.isAiRecommendedDraft);
}

function isTerminalTaskStatus(status?: string | null) {
  return TERMINAL_TASK_STATUSES.has(normalizeStatus(status));
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  if (!hasRole(user, 'user')) {
    throw redirect('/forbidden');
  }

  return { user };
}

function AiRecommendation() {
  const { resultPostId } = useParams();
  const queryClient = useQueryClient();
  const [isShowErrorDialog, setIsShowErrorDialog] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaActiveTab, setMediaActiveTab] = useState<'user' | 'ai'>('user');
  const [userUploadMedia, setUserUploadMedia] = useState<MediaItem[]>([]);
  const [aiGenerationMedia, setAiGenerationMedia] = useState<MediaItem[]>([]);
  const [draftMediaSelections, setDraftMediaSelections] = useState<MediaItem[]>([]);
  const [removeMediaTarget, setRemoveMediaTarget] = useState<string | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const taskQuery = useQuery({
    queryKey: ['ai-recommendation-task', resultPostId],
    queryFn: () => fetchAiRecommendationDraftPost(resultPostId!),
    enabled: Boolean(resultPostId),
    retry: false
  });

  const task = taskQuery.data?.value ?? null;
  const isTaskLookupFailure = taskQuery.isError || taskQuery.data?.isFailure === true;
  const taskStatus = normalizeStatus(task?.status);
  const isTaskFailed = taskStatus === 'failed';
  const isTaskTerminal = isTerminalTaskStatus(task?.status);
  const timeline = useAiRecommendationEventStore((state) =>
    selectAiRecommendationTimeline(state, [resultPostId, task?.correlationId, task?.resultPostId])
  );
  const resultDraftPostId = task?.resultPostId ?? timeline?.resultPostId ?? timeline?.postId ?? null;
  const shouldFetchResultPost =
    Boolean(resultDraftPostId) && !isTaskFailed && (taskStatus === 'completed' || timeline?.status === 'completed');

  const resultPostQuery = useQuery({
    queryKey: ['ai-recommendation-draft-post', resultDraftPostId],
    queryFn: () => fetchPostById(resultDraftPostId!),
    enabled: shouldFetchResultPost,
    retry: false
  });

  const directPostQuery = useQuery({
    queryKey: ['ai-recommendation-draft-post', resultPostId],
    queryFn: () => fetchPostById(resultPostId!),
    enabled: false,
    retry: false
  });

  const post = resultPostQuery.data?.value ?? directPostQuery.data?.value ?? null;
  const initialPostContent = useMemo(() => getInitialCombinedContent(post), [post]);

  useEffect(() => {
    setEditedContent(initialPostContent);
  }, [initialPostContent, post?.id]);

  const {
    data: resourcesData,
    isLoading: isLoadingResources,
    isFetchingNextPage: isFetchingNextResourcePage,
    hasNextPage: hasNextResourcePage,
    fetchNextPage: fetchNextResourcePage
  } = useInfiniteQuery({
    queryKey: ['ai-recommendation-resources', post?.id],
    initialPageParam: null as ResourceCursor | null,
    queryFn: ({ pageParam, signal }) =>
      fetchResources({
        limit: RECOMMENDATION_RESOURCE_PAGE_SIZE,
        cursor: pageParam ?? undefined,
        signal
      }),
    enabled: Boolean(post),
    getNextPageParam: (lastPage) => {
      if (lastPage.value.length < RECOMMENDATION_RESOURCE_PAGE_SIZE) {
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

  const resources = useMemo(() => resourcesData?.pages.flatMap((page) => page.value) ?? [], [resourcesData]);

  const { data: socialAccountsData, isLoading: isLoadingPublishAccounts } = useQuery({
    queryKey: ['ai-recommendation-publish-social-medias'],
    queryFn: () => fetchSocialMedias(),
    enabled: Boolean(post),
    staleTime: 30_000
  });

  const { data: facebookPagesData, isLoading: isLoadingFacebookPages } = useQuery({
    queryKey: ['ai-recommendation-publish-facebook-pages'],
    queryFn: () => fetchFacebookPages(),
    enabled: Boolean(post),
    staleTime: 30_000
  });

  const publishAccounts = useMemo<SocialMedia[]>(() => {
    const rawAccounts = socialAccountsData?.value ?? [];
    return mergeFacebookPagesWithAccounts(rawAccounts, facebookPagesData?.value ?? null);
  }, [facebookPagesData?.value, socialAccountsData?.value]);

  useEffect(() => {
    if (resources.length === 0) {
      setUserUploadMedia([]);
      setAiGenerationMedia([]);
      return;
    }

    const postResourceIds = new Set(post ? collectRecommendedPostResourceIds(post) : []);
    const availableResources = resources.filter((resource) => !postResourceIds.has(resource.id));
    const toMediaItem = (resource: Resource): MediaItem => ({
      id: resource.id,
      url: resource.link,
      source: 'resource',
      isVideo: isVideoResource(resource)
    });

    setUserUploadMedia(availableResources.filter((resource) => !isAiResource(resource)).map(toMediaItem));
    setAiGenerationMedia(availableResources.filter(isAiResource).map(toMediaItem));
  }, [post, resources]);

  const updatePostMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updatePost>[1]) => {
      if (!post) {
        throw new Error('No recommendation draft loaded.');
      }

      return updatePost(post.id, payload);
    },
    onSuccess: (response) => {
      if (response.value?.id) {
        queryClient.setQueryData(['ai-recommendation-draft-post', response.value.id], response);
      }
      if (resultPostId) {
        queryClient.setQueryData(['ai-recommendation-draft-post', resultPostId], response);
      }

      queryClient.invalidateQueries({ queryKey: ['ai-recommendation-draft-post'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['ai-recommendation-resources'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['storage-usage'] });
      setDraftMediaSelections([]);
      toast.success('Recommendation media updated.');
    },
    onError: (error) => {
      console.error('Failed to update recommendation draft media:', error);
      toast.error('Failed to update media. Please try again.');
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
        isVideo: isVideoResource(resource)
      };

      setUserUploadMedia((current) =>
        current.some((item) => item.id === uploadedItem.id) ? current : [uploadedItem, ...current]
      );
      setDraftMediaSelections((current) =>
        current.some((item) => item.id === uploadedItem.id) ? current : [...current, uploadedItem]
      );
      setMediaActiveTab('user');
      toast.success('Resource uploaded successfully.');
      queryClient.invalidateQueries({ queryKey: ['ai-recommendation-resources'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['storage-usage'] });
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
    },
    onError: (error) => {
      console.error('Failed to upload recommendation media:', error);
      toast.error(error.message || 'Failed to upload media.');
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
    }
  });

  const publishPayloads = useMemo<DirectPostPublishPayload[]>(() => {
    if (!post) return [];

    const sourceAccount = publishAccounts.find((account) => account.id === post.socialMediaId);
    const platform =
      normalizePublishPlatform(sourceAccount?.type) ??
      normalizePublishPlatform(post.platform) ??
      normalizePublishPlatform(post.publications?.[0]?.socialMediaType) ??
      normalizePublishPlatform(publishAccounts[0]?.type);
    if (!platform) return [];

    const content = editedContent.trim();
    const resourceIds = collectRecommendedPostResourceIds(post);
    if (!content && resourceIds.length === 0) return [];

    return [
      {
        platform,
        mode: resolveRecommendedPostMode(post, platform),
        content,
        resourceIds,
        postId: post.id
      }
    ];
  }, [editedContent, post, publishAccounts]);
  const defaultPublishAccountIds = useMemo(
    () => (post?.socialMediaId ? [post.socialMediaId] : []),
    [post?.socialMediaId]
  );

  const isTimelinePending = timeline?.status === 'submitted' || timeline?.status === 'processing';
  const isTimelineFailed = timeline?.status === 'failed';
  const isTimelineWaitingForResult = timeline?.status === 'completed' && !post;
  const isTaskPending = Boolean(task && !isTaskTerminal);
  const isPostRecommendationPending = Boolean(post?.isAiRecommendedDraft && !post.isAiRecommendationDone);
  const isPostRecommendationFailed = normalizeStatus(post?.aiRecommendationStatus) === 'failed';
  const isRecommendationFailed = isTaskFailed || isTimelineFailed || isPostRecommendationFailed;
  const isRecommendationPending =
    !isRecommendationFailed &&
    (isTaskPending || isPostRecommendationPending || isTimelinePending || isTimelineWaitingForResult);
  const isPublishUnavailable =
    !post ||
    !post.isAiRecommendationDone ||
    isRecommendationFailed ||
    publishPayloads.length === 0 ||
    publishAccounts.length === 0 ||
    updatePostMutation.isPending ||
    isLoadingPublishAccounts ||
    isLoadingFacebookPages;
  const isLoading =
    taskQuery.isLoading ||
    resultPostQuery.isLoading ||
    (directPostQuery.isLoading && directPostQuery.fetchStatus !== 'idle');
  const isUnknownRecommendationId = isTaskLookupFailure && !timeline && !post;
  const isInvalidRecommendationPost = Boolean(post && !isAiRecommendationDraft(post));
  const hasPageLookupError = isUnknownRecommendationId || isInvalidRecommendationPost;
  const isFetching = taskQuery.isFetching || resultPostQuery.isFetching || directPostQuery.isFetching;
  const fallbackThinkings = useMemo<AiRecommendationThinkingItem[]>(() => {
    if ((timeline?.items.length ?? 0) > 0) return [];

    if (task) {
      const status = normalizeStatus(task.status);
      const isFailed = status === 'failed';
      const isCompleted = status === 'completed';
      return [
        {
          id: `task-${task.correlationId}`,
          action: 'task_status',
          status: isFailed ? 'failed' : isCompleted ? 'done' : status === 'submitted' ? 'queued' : 'processing',
          title: isFailed
            ? 'AI recommendation failed'
            : isCompleted
              ? 'AI recommendation completed'
              : status === 'submitted'
                ? 'AI recommendation queued'
                : 'AI recommendation in progress',
          description: isFailed
            ? (task.errorMessage ?? 'AI hit an error and stopped generating this recommendation.')
            : status === 'submitted'
              ? 'AI is preparing your recommendation draft.'
              : isCompleted
                ? 'AI finished generating this recommendation draft.'
                : 'AI is generating your recommendation draft.',
          details: task,
          createdAt: task.completedAt ?? task.createdAt,
          notificationType: 'ai.draft_post_generation.task_state'
        }
      ];
    }

    if (post && isAiRecommendationDraft(post)) {
      return [
        {
          id: `post-${post.id}`,
          action: 'draft_post_ready',
          status: post.isAiRecommendationDone ? 'done' : 'processing',
          title: post.isAiRecommendationDone ? 'AI recommendation ready' : 'AI recommendation in progress',
          description: post.isAiRecommendationDone
            ? 'AI finished generating this recommendation draft.'
            : 'AI is generating this recommendation draft.',
          details: {
            postId: post.id,
            correlationId: post.aiRecommendationCorrelationId,
            status: post.aiRecommendationStatus,
            completedAt: post.aiRecommendationCompletedAt,
            errorCode: post.aiRecommendationErrorCode,
            errorMessage: post.aiRecommendationErrorMessage
          },
          createdAt: post.aiRecommendationCompletedAt ?? new Date().toISOString(),
          notificationType: 'ai.draft_post_generation.post_state'
        }
      ];
    }

    return [];
  }, [post, task, timeline?.items.length]);
  const thinkingItems = (timeline?.items.length ?? 0) > 0 ? (timeline?.items ?? []) : fallbackThinkings;
  const hasThinkingItems = thinkingItems.length > 0;
  const shouldShowErrorDialog = hasPageLookupError && !hasThinkingItems;
  const shouldShowStandaloneThinkingPanel =
    isRecommendationPending || (hasThinkingItems && (isRecommendationFailed || !post));
  const failureMessage =
    timeline?.errorMessage ??
    task?.errorMessage ??
    post?.aiRecommendationErrorMessage ??
    'AI hit an error and stopped generating this recommendation.';
  const notificationHistoryId = useMemo(() => {
    const primaryId =
      task?.correlationId ??
      timeline?.correlationId ??
      post?.aiRecommendationCorrelationId ??
      task?.resultPostId ??
      timeline?.resultPostId ??
      timeline?.postId ??
      post?.id ??
      resultPostId;

    return primaryId ?? null;
  }, [
    post?.aiRecommendationCorrelationId,
    post?.id,
    resultPostId,
    task?.correlationId,
    task?.resultPostId,
    timeline?.correlationId,
    timeline?.postId,
    timeline?.resultPostId
  ]);

  const notificationHistoryQuery = useInfiniteQuery({
    queryKey: ['ai-recommendation-event-history', notificationHistoryId],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const pageSize = pageParam ? OLDER_NOTIFICATION_HISTORY_LIMIT : INITIAL_NOTIFICATION_HISTORY_LIMIT;
      const response = await fetchNotifications({
        limit: pageSize,
        source: 'Creator',
        typePrefix: 'ai.draft_post_generation.',
        relatedId: notificationHistoryId ?? undefined,
        beforeCreatedAt: pageParam
      });

      return { ...response, pageSize };
    },
    getNextPageParam: (lastPage) => {
      const notifications = lastPage.value ?? [];
      if (notifications.length < lastPage.pageSize) return undefined;
      return notifications.at(-1)?.createdAt;
    },
    enabled: Boolean(notificationHistoryId),
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

  const handleRefresh = () => {
    if (task) {
      void taskQuery.refetch();
    }

    if (shouldFetchResultPost && resultDraftPostId) {
      void resultPostQuery.refetch();
    }

    if (notificationHistoryId) {
      void notificationHistoryQuery.refetch();
    }
  };

  const updateRecommendationResources = useCallback(
    (resourceIds: string[]) => {
      if (!post) return;

      updatePostMutation.mutate({
        content: {
          content: editedContent,
          hashtag: null,
          resource_list: Array.from(new Set(resourceIds)),
          post_type: post.content?.post_type ?? 'posts'
        }
      });
    },
    [editedContent, post, updatePostMutation]
  );

  const handleMediaSelectItem = useCallback((item: MediaItem) => {
    setDraftMediaSelections((current) => {
      const exists = current.some((media) => media.id === item.id);
      return exists ? current.filter((media) => media.id !== item.id) : [...current, item];
    });
  }, []);

  const handleMediaUploadClick = useCallback(() => {
    const currentMediaCount = post ? collectRecommendedPostResourceIds(post).length : 0;
    if (currentMediaCount + draftMediaSelections.length >= 10) {
      toast.error('This post already has the maximum number of media items.');
      return;
    }

    uploadInputRef.current?.click();
  }, [draftMediaSelections.length, post]);

  const handleUploadInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
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

      if (file.size > RECOMMENDATION_MAX_UPLOAD_FILE_SIZE) {
        toast.error('File is too large. Maximum upload size is 20MB.');
        event.target.value = '';
        return;
      }

      uploadMediaMutation.mutate({ file, type });
    },
    [uploadMediaMutation]
  );

  const handleMediaConfirm = useCallback(() => {
    if (!post) return;

    const nextResourceIds = [...collectRecommendedPostResourceIds(post), ...draftMediaSelections.map((item) => item.id)];
    updateRecommendationResources(nextResourceIds);
    setIsMediaModalOpen(false);
  }, [draftMediaSelections, post, updateRecommendationResources]);

  const handleRemoveMediaConfirm = useCallback(() => {
    if (!post || !removeMediaTarget) return;

    const nextResourceIds = collectRecommendedPostResourceIds(post).filter((resourceId) => resourceId !== removeMediaTarget);
    updateRecommendationResources(nextResourceIds);
    setIsRemoveDialogOpen(false);
    setRemoveMediaTarget(null);
  }, [post, removeMediaTarget, updateRecommendationResources]);

  useEffect(() => {
    setIsShowErrorDialog(shouldShowErrorDialog);
  }, [shouldShowErrorDialog]);

  if (!resultPostId) {
    return null;
  }

  if (post && !isAiRecommendationDraft(post)) {
    const status = normalizeStatus(post.status);

    if (status === 'published') {
      return <Navigate to={`/user/product/${post.id}/analytics`} replace />;
    }

    if (status === 'draft') {
      return <Navigate to={`/user/product/${post.id}/edit`} replace />;
    }

    return <Navigate to='/user/product' replace />;
  }

  return (
    <>
      <div className='space-y-8'>
        <section className='overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8 relative flex items-center justify-between'>
          <div className='absolute top-0 right-0 w-1/3 h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none' />

          <div className='flex items-center gap-4 relative z-10'>
            <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'>
              <BotIcon className='h-7 w-7' />
            </div>

            <div className='space-y-1'>
              <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>AI Recommendation</h1>
              <p className='text-sm leading-relaxed text-slate-400'>View the AI-generated recommendation.</p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={handleRefresh}
              disabled={isFetching}
              className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white px-6 relative z-10'
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsPublishDialogOpen(true)}
              disabled={isPublishUnavailable}
              className='rounded-2xl text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:text-white px-6 relative z-10 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/30'
            >
              <CheckCircle2 className='h-4 w-4 mr-2' />
              Publish
            </Button>
          </div>
        </section>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href='/user'>Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href='/user/product'>Products</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>AI Recommendation</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {(isLoading || shouldShowStandaloneThinkingPanel) && (
          <div className='grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]'>
            <AIThinkingPanel
              thinkings={thinkingItems}
              isActive={isLoading || isRecommendationPending}
              isLoading={isLoading || isRecommendationPending}
              layout='fill'
              className='min-h-[620px]'
              hasMore={notificationHistoryQuery.hasNextPage}
              isLoadingMore={notificationHistoryQuery.isFetchingNextPage}
              onLoadMore={() => {
                if (notificationHistoryQuery.hasNextPage && !notificationHistoryQuery.isFetchingNextPage) {
                  void notificationHistoryQuery.fetchNextPage();
                }
              }}
            />
            {isRecommendationFailed ? (
              <section className='rounded-[28px] border border-rose-500/20 bg-rose-500/8 p-6 shadow-[0_20px_60px_rgba(3,5,12,0.35)]'>
                <div className='flex items-start gap-4'>
                  <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-500/10 text-rose-200'>
                    <AlertTriangle className='h-5 w-5' />
                  </div>
                  <div className='space-y-2'>
                    <h2 className='text-lg font-semibold text-white'>Recommendation failed</h2>
                    <p className='text-sm leading-relaxed text-rose-100/80'>{failureMessage}</p>
                    <p className='text-xs leading-relaxed text-slate-400'>
                      Open the failed event details on the left to see the full backend error and RAG context.
                    </p>
                    <Button
                      asChild
                      variant='outline'
                      className='mt-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15 hover:text-white'
                    >
                      <Link to='/user/product?status=failed'>View failed posts</Link>
                    </Button>
                  </div>
                </div>
              </section>
            ) : (
              <AIRecommendedPostPanel post={null} isLoading={true} />
            )}
          </div>
        )}

        {!isLoading &&
          !shouldShowErrorDialog &&
          !shouldShowStandaloneThinkingPanel &&
          post &&
          isAiRecommendationDraft(post) && (
            <div className='grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]'>
              <AIThinkingPanel
                thinkings={thinkingItems}
                layout='fill'
                className='min-h-[620px]'
                hasMore={notificationHistoryQuery.hasNextPage}
                isLoadingMore={notificationHistoryQuery.isFetchingNextPage}
                onLoadMore={() => {
                  if (notificationHistoryQuery.hasNextPage && !notificationHistoryQuery.isFetchingNextPage) {
                    void notificationHistoryQuery.fetchNextPage();
                  }
                }}
              />
              <AIRecommendedPostPanel
                post={post}
                contentValue={editedContent}
                onContentChange={setEditedContent}
                onAddMedia={() => setIsMediaModalOpen(true)}
                onRemoveMedia={(resourceId) => {
                  setRemoveMediaTarget(resourceId);
                  setIsRemoveDialogOpen(true);
                }}
                isMediaUpdating={updatePostMutation.isPending}
              />
            </div>
          )}
      </div>
      <input
        ref={uploadInputRef}
        type='file'
        accept={RECOMMENDATION_FILE_INPUT_ACCEPT}
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
        currentMediaCount={post ? collectRecommendedPostResourceIds(post).length : 0}
        onSelectItem={handleMediaSelectItem}
        onUploadClick={handleMediaUploadClick}
        onClose={() => {
          setIsMediaModalOpen(false);
          setDraftMediaSelections([]);
        }}
        onConfirm={handleMediaConfirm}
        confirmDisabled={draftMediaSelections.length === 0 || updatePostMutation.isPending}
        isLoading={isLoadingResources}
        isFetchingNextPage={isFetchingNextResourcePage}
        isUploading={uploadMediaMutation.isPending}
        hasNextPage={hasNextResourcePage}
        onLoadMore={() => void fetchNextResourcePage()}
      />
      <AlertDialog
        open={isRemoveDialogOpen}
        onOpenChange={(open) => {
          setIsRemoveDialogOpen(open);
          if (!open) {
            setRemoveMediaTarget(null);
          }
        }}
      >
        <AlertDialogContent className='rounded-3xl border-white/15 bg-[#060912] text-white'>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Media</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this media from the AI recommendation draft?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='rounded-xl border-white/10 bg-white/4 text-white/85 hover:bg-white/8 hover:text-white'>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMediaConfirm}
              className='rounded-xl bg-red-600 text-white hover:bg-red-700'
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DirectPostPublishDialog
        isOpen={isPublishDialogOpen}
        onClose={() => setIsPublishDialogOpen(false)}
        payloads={publishPayloads}
        accounts={publishAccounts}
        media={post?.media ?? []}
        title='Publish AI Recommendation'
        emptyAccountMessage='No connected social accounts are available for publishing.'
        defaultSelectedAccountIds={defaultPublishAccountIds}
        selectAllByDefault={false}
        invalidateQueryKeys={[['ai-recommendation-draft-post']]}
      />
      {isShowErrorDialog && <DialogError isOpen={isShowErrorDialog} />}
    </>
  );
}

export default AiRecommendation;
