import DialogError from '@/components/common/DialogError';
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
import MediaGallery from '@/components/workspace/common/MediaGallery';
import { fetchPostById, updatePost } from '@/services/client/post.client';
import { fetchResources } from '@/services/client/resource.client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, CheckCircle2, Package, RefreshCw, Save, Sparkles, X, Upload } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useBlocker } from 'react-router';
import type { MediaItem } from '@/components/workspace/common/media-types';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

function ProductEdit() {
  const { postId } = useParams();
  const queryClient = useQueryClient();
  const [isShowErrorDialog, setIsShowErrorDialog] = useState(false);
  const [isShowUnsavedDialog, setIsShowUnsavedDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Content edit state
  const [editContent, setEditContent] = useState<string>('');

  // Media Modal state
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaActiveTab, setMediaActiveTab] = useState<'user' | 'ai'>('user');
  const [userUploadMedia, setUserUploadMedia] = useState<MediaItem[]>([]);
  const [aiGenerationMedia, setAiGenerationMedia] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [draftMediaSelections, setDraftMediaSelections] = useState<MediaItem[]>([]);

  if (!postId) {
    return null;
  }

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ['ai-recommendation-draft-post', postId],
    queryFn: () => fetchPostById(postId!),
    enabled: Boolean(postId)
  });

  // Fetch resources
  const { data: resourcesData } = useQuery({
    queryKey: ['post-edit-resources'],
    queryFn: () => fetchResources({ limit: 50 }),
    enabled: Boolean(postId)
  });

  // Update Post mutation
  const updatePostMutation = useMutation({
    mutationFn: (payload: any) => updatePost(postId!, payload),
    onSuccess: () => {
      setHasChanges(false);
      setSelectedMedia([]);
      setDraftMediaSelections([]);

      // Show success toast
      toast.success('Update successfully');

      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: ['ai-recommendation-draft-post', postId]
      });
      queryClient.invalidateQueries({
        queryKey: ['post-edit-resources']
      });
    },
    onError: (error) => {
      console.error('Failed to save changes:', error);
      toast.error('Failed to save changes. Please try again.');
    }
  });

  const post = data?.value;
  const isShowPublish = post && post.status === 'draft' ? true : false;

  // Filter resources: exclude resources already in post
  useEffect(() => {
    if (resourcesData?.value) {
      const postResourceIds = new Set(post?.content?.resource_list || []);
      const filteredResources = resourcesData.value.filter((resource) => !postResourceIds.has(resource.id));

      // Separate into user uploads and AI generations
      const userUploads = filteredResources
        .filter((r) => r.originKind !== 'ai_generation')
        .map((r) => ({
          id: r.id,
          url: r.link,
          source: 'resource' as const,
          isVideo: r.resourceType?.includes('video')
        }));

      const aiGenerations = filteredResources
        .filter((r) => r.originKind === 'ai_generation')
        .map((r) => ({
          id: r.id,
          url: r.link,
          source: 'resource' as const,
          isVideo: r.resourceType?.includes('video')
        }));

      setUserUploadMedia(userUploads);
      setAiGenerationMedia(aiGenerations);
    }
  }, [resourcesData, post?.content?.resource_list]);

  useEffect(() => {
    const shouldShowErrorDialog = isError || (post && post.status !== 'draft');

    if (shouldShowErrorDialog) {
      setIsShowErrorDialog(true);
    }
  }, [isError, post]);

  // Set initial content when post loads
  useEffect(() => {
    if (post?.content) {
      setEditContent([post.content.content || '', post.content.hashtag || ''].filter(Boolean).join('\n\n'));
    }
  }, [post]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Block navigation if there are unsaved changes
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return hasChanges && currentLocation.pathname !== nextLocation.pathname;
  });

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setIsShowUnsavedDialog(true);
    }
  }, [blocker.state]);

  const handleSaveChanges = useCallback(async () => {
    if (!post) return;

    const newMediaIds = selectedMedia.map((m) => m.id);
    const newMediaList = [...(post.content?.resource_list || []), ...newMediaIds];

    await updatePostMutation.mutateAsync({
      content: {
        ...post.content,
        content: editContent,
        hashtag: null,
        resource_list: newMediaList
      }
    });
  }, [post, editContent, selectedMedia, updatePostMutation, queryClient]);

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

  const handleMediaConfirm = useCallback(async () => {
    if (!post) return;

    const newMediaIds = [...selectedMedia.map((m) => m.id), ...draftMediaSelections.map((m) => m.id)];
    const newMediaList = [...(post.content?.resource_list || []), ...newMediaIds];

    await updatePostMutation.mutateAsync({
      content: {
        ...post.content,
        content: editContent,
        resource_list: newMediaList
      }
    });
  }, [post, editContent, selectedMedia, draftMediaSelections, updatePostMutation]);

  // Show loading state
  if (isFetching) {
    return (
      <div className='space-y-8'>
        {/* Header skeleton */}
        <section className='overflow-hidden rounded-[28px] border border-white/12 bg-white/2 px-5 py-6 sm:px-7 sm:py-8'>
          <div className='flex items-center gap-4'>
            <div className='h-14 w-14 rounded-2xl bg-white/4 animate-pulse' />
            <div className='flex-1 space-y-2'>
              <div className='h-8 w-48 bg-white/4 rounded-lg animate-pulse' />
              <div className='h-4 w-96 bg-white/4 rounded-lg animate-pulse' />
            </div>
          </div>
        </section>

        {/* Content section skeleton */}
        <section className='rounded-[28px] border border-white/12 bg-white/2 px-6 py-6 space-y-4'>
          <div className='h-8 w-48 bg-white/4 rounded-lg animate-pulse' />
          <div className='w-full h-48 bg-white/4 rounded-2xl animate-pulse' />
          <div className='h-4 w-full bg-white/4 rounded-lg animate-pulse' />
        </section>

        {/* Media section skeleton */}
        <section className='rounded-[28px] border border-white/12 bg-white/2 px-6 py-6 space-y-4'>
          <div className='h-8 w-48 bg-white/4 rounded-lg animate-pulse' />
          <div className='flex gap-4'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='h-24 w-24 rounded-lg bg-white/4 animate-pulse' />
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Show error state
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

  return (
    <>
      <div className='space-y-8'>
        {/* header */}
        <section className='overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8 relative flex items-center justify-between'>
          <div className='absolute top-0 right-0 w-1/3 h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none' />

          <div className='flex items-center gap-4 relative z-10'>
            <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'>
              <Package className='h-7 w-7' />
            </div>

            <div className='space-y-1'>
              <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Edit Post</h1>
              <p className='text-sm leading-relaxed text-slate-400'>Modify your post content and media below.</p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => void refetch()}
              disabled={isFetching}
              className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white px-6 relative z-10'
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
            {isShowPublish && (
              <Button
                type='button'
                variant='outline'
                disabled={!isShowPublish}
                className='rounded-2xl text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:text-white px-6 relative z-10 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/30'
              >
                <CheckCircle2 className={`h-4 w-4 mr-2`} />
                Publish
              </Button>
            )}
          </div>
        </section>

        {/* breadcrumb and action buttons */}
        <div className='flex items-center justify-between'>
          {/* breadcrumb */}
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
                <BreadcrumbPage>{post?.id}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* action buttons */}
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              className='rounded-2xl border-amber-500/20 text-amber-100 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:text-white px-6 relative z-10 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30'
            >
              <Sparkles className='h-4 w-4' />
              Improve
            </Button>

            <Button
              type='button'
              variant='outline'
              className='rounded-2xl border-emerald-500/20 text-emerald-100 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:text-white px-6 relative z-10 bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-emerald-500/30'
            >
              <Check className='h-4 w-4' />
              Approve
            </Button>

            <Button
              type='button'
              variant='outline'
              className='rounded-2xl border-rose-500/20 text-rose-100 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:text-white px-6 relative z-10 bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-500/30'
            >
              <X className='h-4 w-4' />
              Reject
            </Button>
          </div>
        </div>

        {/* Content Editor Section */}
        <section className='rounded-[28px] border border-white/12 bg-white/4 px-6 py-6 space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-2xl font-semibold text-white'>Edit Content</h2>
            <div className='text-sm text-slate-400'>
              {post?.status && (
                <span className='rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs uppercase tracking-wide text-blue-200'>
                  {post.status}
                </span>
              )}
            </div>
          </div>

          <div className='space-y-3'>
            <label className='block text-sm font-semibold text-white'>Content</label>
            <textarea
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                setHasChanges(true);
              }}
              placeholder='Write your post content here. You can include hashtags too.'
              className='w-full min-h-48 resize-none rounded-2xl border border-white/10 bg-white/3 p-4 text-sm text-slate-200 placeholder-slate-500 transition-colors focus:border-white/30 focus:bg-white/5 focus:outline-none'
            />
          </div>

          {post?.publications && post.publications.length > 0 && (
            <div className='space-y-3 border-t border-white/10 pt-4'>
              <p className='text-sm font-semibold text-slate-300'>Published Platforms:</p>
              <div className='flex flex-wrap gap-2'>
                {post.publications.map((pub) => (
                  <span
                    key={pub.id}
                    className='px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-slate-300'
                  >
                    {pub.socialMediaType}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Save Changes Button */}
          <div className='border-t border-white/10 pt-4 flex justify-end'>
            <Button
              type='button'
              onClick={handleSaveChanges}
              disabled={!hasChanges || updatePostMutation.isPending}
              className='rounded-2xl text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:text-white px-6 relative z-10 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <Save className={`h-4 w-4 mr-2`} />
              Save Changes
            </Button>
          </div>
        </section>

        {/* Post Media Section */}
        <section className='rounded-[28px] border border-white/12 bg-white/4 px-6 py-6 space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-2xl font-semibold text-white'>Post Media</h2>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsMediaModalOpen(true)}
              className='rounded-2xl text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:text-white px-6 relative z-10 bg-linear-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-cyan-500/30'
            >
              <Upload className='h-4 w-4 mr-2' />
              Import Media
            </Button>
          </div>

          {post?.media && post.media.length > 0 ? (
            <div className='flex flex-wrap gap-4'>
              {post.media.map((media) => (
                <div
                  key={media.resourceId}
                  className='relative h-24 w-24 rounded-lg overflow-hidden border border-white/10'
                >
                  {media.contentType?.includes('video') ? (
                    <video src={media.presignedUrl} muted className='h-full w-full object-cover' />
                  ) : (
                    <img src={media.presignedUrl} alt='Post media' className='h-full w-full object-cover' />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-12 rounded-lg border border-dashed border-white/10 bg-white/2'>
              <Upload className='h-8 w-8 text-slate-500 mb-2' />
              <p className='text-slate-400 text-sm'>No media added yet</p>
              <p className='text-slate-500 text-xs mt-1'>Click "Import Media" button to add images or videos</p>
            </div>
          )}
        </section>
      </div>

      {/* Dialogs */}

      {post && (
        <PostEditMediaModal
          isOpen={isMediaModalOpen}
          onOpenChange={setIsMediaModalOpen}
          userUploadItems={userUploadMedia}
          aiGenerationItems={aiGenerationMedia}
          activeTab={mediaActiveTab}
          onTabChange={setMediaActiveTab}
          selectedItems={selectedMedia}
          draftSelections={draftMediaSelections}
          canSelectMore={selectedMedia.length + draftMediaSelections.length < 10}
          onSelectItem={handleMediaSelectItem}
          onUploadClick={() => {}}
          onClose={() => {
            setIsMediaModalOpen(false);
            setDraftMediaSelections([]);
          }}
          onConfirm={handleMediaConfirm}
          confirmDisabled={draftMediaSelections.length === 0}
          isLoading={false}
          isFetchingNextPage={false}
          isUploading={false}
          hasNextPage={false}
        />
      )}

      <AlertDialog open={isShowUnsavedDialog} onOpenChange={setIsShowUnsavedDialog}>
        <AlertDialogContent className='border-white/15 bg-[#060912] text-white'>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='border-white/10 bg-white/4 text-white/85 hover:bg-white/8 hover:text-white'>
              Keep Editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (blocker.state === 'blocked') {
                  blocker.proceed();
                }
              }}
              className='bg-red-600 hover:bg-red-700 text-white'
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isShowErrorDialog && <DialogError isOpen={isShowErrorDialog} />}
    </>
  );
}

export default ProductEdit;
