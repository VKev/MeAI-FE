import DialogError from '@/components/common/DialogError';
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
import MediaGallery from '@/components/workspace/common/MediaGallery';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchPostById, updatePost, startAiPostImprove, fetchAiPostImprove } from '@/services/client/post.client';
import { fetchResources } from '@/services/client/resource.client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, CheckCircle2, Package, RefreshCw, Save, Sparkles, X, Image, Trash2, ChevronDown } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useBlocker } from 'react-router';
import type { MediaItem } from '@/components/workspace/common/media-types';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

function ProductEdit() {
  const { postId } = useParams();
  const queryClient = useQueryClient();
  const [isShowErrorDialog, setIsShowErrorDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Content edit state
  const [editContent, setEditContent] = useState<string>('');

  // Media Modal state
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaActiveTab, setMediaActiveTab] = useState<'user' | 'ai'>('user');
  const [userUploadMedia, setUserUploadMedia] = useState<MediaItem[]>([]);
  const [aiGenerationMedia, setAiGenerationMedia] = useState<MediaItem[]>([]);
  const [draftMediaSelections, setDraftMediaSelections] = useState<MediaItem[]>([]);

  const [isImprovePopoverOpen, setIsImprovePopoverOpen] = useState(false);
  const [improveInstruction, setImproveInstruction] = useState('');
  const [improveStyle, setImproveStyle] = useState('branded');
  const [improvePlatform, setImprovePlatform] = useState<string | null>(null);
  const [defaultPlatform, setDefaultPlatform] = useState<string | null>(null);
  const [improveCaption, setImproveCaption] = useState(true);
  const [improveImage, setImproveImage] = useState(false);
  const [isImproving, setIsImproving] = useState(false);

  const PRESET_PROMPTS = [
    'Make it shorter',
    'More engaging',
    'Add emojis',
    'Professional fix'
  ];

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

  const improvePostMutation = useMutation({
    mutationFn: () => startAiPostImprove(postId!, {
      improveCaption,
      improveImage,
      style: improveStyle,
      platform: improvePlatform !== 'none' ? improvePlatform : null,
      userInstruction: improveInstruction || null
    }),
    onSuccess: () => {
      setIsImproving(true);
      setIsImprovePopoverOpen(false);
      toast.success('AI Improvement started');
    },
    onError: (error) => {
      console.error('Failed to start AI improvement:', error);
      toast.error('Failed to start AI improvement. Please try again.');
      setIsImproving(false);
    }
  });

  // AI Improve Query (Real-time synced via useNotificationHub)
  const { data: improveData } = useQuery({
    queryKey: ['ai-post-improve', postId],
    queryFn: () => fetchAiPostImprove(postId!),
    enabled: Boolean(postId),
    staleTime: Infinity,
    refetchInterval: false
  });

  const aiImprovement = improveData?.value;
  const aiImproveStatus = aiImprovement?.status?.toLowerCase();
  const isAiImproving = aiImproveStatus === 'submitted' || aiImproveStatus === 'processing';
  const isAiImproveDone = aiImproveStatus === 'completed';

  const post = data?.value;
  const isShowPublish = post && post.status === 'draft' ? true : false;

  useEffect(() => {
    if (post && improvePlatform === null) {
      const platform = post.publications?.[0]?.socialMediaType?.toLowerCase() || 'facebook';
      setImprovePlatform(platform);
      setDefaultPlatform(post.publications?.[0]?.socialMediaType ? platform : 'none');
    }
  }, [post, improvePlatform]);

  const PLATFORM_CONFIG: Record<string, { color: string, label: string }> = {
    facebook: { color: 'bg-[#1877F2]', label: 'Facebook' },
    instagram: { color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]', label: 'Instagram' },
    tiktok: { color: 'bg-black border border-white/20', label: 'TikTok' },
    threads: { color: 'bg-white', label: 'Threads' },
    none: { color: 'bg-slate-500', label: 'Not Specified' }
  };

  useEffect(() => {
    if (resourcesData?.value) {
      const postResourceIds = new Set(post?.content?.resource_list || []);
      const filteredResources = resourcesData.value.filter((resource) => !postResourceIds.has(resource.id));

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

  useEffect(() => {
    if (post?.content) {
      setEditContent([post.content.content || '', post.content.hashtag || ''].filter(Boolean).join('\n\n'));
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

  const handleSaveChanges = useCallback(() => {
    if (!post) return;

    updatePostMutation.mutate({
      content: {
        ...post.content,
        content: editContent,
        hashtag: null
      }
    });
  }, [post, editContent, updatePostMutation]);

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

  const handleMediaConfirm = useCallback(() => {
    if (!post) return;

    const newMediaIds = draftMediaSelections.map((m) => m.id);
    const newMediaList = [...(post.content?.resource_list || []), ...newMediaIds];

    updatePostMutation.mutate({
      content: {
        ...post.content,
        content: editContent,
        resource_list: newMediaList
      }
    });

    setIsMediaModalOpen(false);
    setDraftMediaSelections([]);
  }, [post, editContent, draftMediaSelections, updatePostMutation]);

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
        resource_list: remaining
      }
    });

    setIsRemoveDialogOpen(false);
    setRemoveTarget(null);
  }, [post, removeTarget, updatePostMutation, editContent]);

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
              <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Edit Product</h1>
              <p className='text-sm leading-relaxed text-slate-400'>Modify your product content and media below.</p>
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


        </div>

        {/* Content Editor Section */}
        <section className='rounded-[28px] border border-white/12 bg-white/4 px-6 py-6 space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-2xl font-semibold text-white'>Edit Content</h2>
            <div className='flex items-center gap-2'>
              <Popover open={isImprovePopoverOpen} onOpenChange={setIsImprovePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    disabled={isAiImproving}
                    className={cn(
                      'rounded-2xl border-amber-500/20 text-amber-100 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:text-white px-6 relative z-10 transition-all duration-300',
                      isAiImproving 
                        ? 'bg-slate-800 border-white/10 opacity-80 cursor-not-allowed' 
                        : 'bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30'
                    )}
                  >
                    {isAiImproving ? (
                      <>
                        <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                        Improving...
                      </>
                    ) : (
                      <>
                        <Sparkles className='h-4 w-4 mr-2' />
                        Improve
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[340px] border-white/10 bg-[#080A12] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.05)] rounded-[24px]" align="end" sideOffset={8}>
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-white text-base flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-amber-500/10">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                        </div>
                        AI Configurations
                      </h4>
                      <p className="text-[11px] leading-relaxed text-slate-400">Our AI will analyze your draft and suggest optimizations for engagement and clarity.</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="instruction" className="text-xs font-medium text-slate-300">Custom Instruction</Label>
                        <span className="text-[10px] text-slate-500 italic">Optional</span>
                      </div>
                      <Input
                        id="instruction"
                        value={improveInstruction}
                        onChange={(e) => setImproveInstruction(e.target.value)}
                        placeholder="e.g. Write in a storytelling style..."
                        className="h-10 text-xs rounded-xl border-white/8 bg-white/[0.03] text-white placeholder:text-slate-600 outline-none focus-visible:ring-amber-500/30 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:border-amber-500/40 transition-all shadow-inner"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {PRESET_PROMPTS.map(prompt => (
                          <button
                            key={prompt}
                            onClick={() => {
                              const newInstruction = improveInstruction
                                ? `${improveInstruction.trim()}, ${prompt}`
                                : prompt;
                              setImproveInstruction(newInstruction);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] text-slate-400 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label htmlFor="style" className="text-xs font-medium text-slate-300">Target Audience & Tone</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full h-10 justify-between rounded-xl border-white/8 bg-white/[0.03] px-3 text-xs text-white font-normal outline-none focus-visible:ring-amber-500/30 focus-visible:ring-1 focus-visible:ring-offset-0 transition-all hover:bg-white/5"
                          >
                            <span className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                              <span className="capitalize">{improveStyle}</span>
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-40" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 border-white/10 bg-[#0A0D1A] text-white rounded-xl shadow-2xl p-1">
                          <DropdownMenuRadioGroup value={improveStyle} onValueChange={setImproveStyle}>
                            <DropdownMenuRadioItem value="branded" className="text-xs py-2 rounded-lg focus:bg-amber-500/10 focus:text-amber-500 cursor-pointer">Branded</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="creative" className="text-xs py-2 rounded-lg focus:bg-amber-500/10 focus:text-amber-500 cursor-pointer">Creative</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="marketing" className="text-xs py-2 rounded-lg focus:bg-amber-500/10 focus:text-amber-500 cursor-pointer">Marketing</DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2.5">
                      <Label htmlFor="platform" className="text-xs font-medium text-slate-300">Target Platform</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full h-10 justify-between rounded-xl border-white/8 bg-white/[0.03] px-3 text-xs text-white font-normal outline-none focus-visible:ring-amber-500/30 focus-visible:ring-1 focus-visible:ring-offset-0 transition-all hover:bg-white/5"
                          >
                            <span className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]", PLATFORM_CONFIG[improvePlatform || 'facebook']?.color)} />
                              <span className="capitalize">{improvePlatform || 'facebook'}</span>
                              {improvePlatform === defaultPlatform && (
                                <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-slate-400 font-medium ml-1">Default</span>
                              )}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-40" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 border-white/10 bg-[#0A0D1A] text-white rounded-xl shadow-2xl p-1">
                          {['facebook', 'instagram', 'tiktok', 'threads'].map((p) => (
                            <DropdownMenuItem
                              key={p}
                              onClick={() => setImprovePlatform(p)}
                              className={cn(
                                "text-xs py-2.5 px-3 rounded-lg focus:bg-white/5 focus:text-white cursor-pointer group flex items-center justify-between transition-colors",
                                improvePlatform === p && "bg-white/[0.03] text-amber-500"
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={cn(
                                  "w-2 h-2 rounded-full transition-transform duration-200",
                                  PLATFORM_CONFIG[p].color,
                                  improvePlatform === p ? "scale-110 shadow-[0_0_8px_rgba(255,255,255,0.3)]" : "opacity-60 group-hover:opacity-100"
                                )} />
                                <span className={cn("capitalize font-medium", improvePlatform === p ? "text-white" : "text-slate-400")}>
                                  {PLATFORM_CONFIG[p].label}
                                </span>
                              </div>
                              {p === defaultPlatform && (
                                <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-slate-500 font-medium group-hover:text-slate-300 transition-colors uppercase tracking-wider">Default</span>
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-3 pt-1">
                      <Label className="text-xs font-medium text-slate-300">Refinement Scope</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            if (improveCaption && !improveImage) return;
                            setImproveCaption(!improveCaption);
                          }}
                          className={cn(
                            "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200",
                            improveCaption
                              ? "bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                              : "bg-white/[0.02] border-white/5 text-slate-500 hover:bg-white/5"
                          )}
                        >
                          <Package className="h-3.5 w-3.5" />
                          Content
                        </button>
                        <button
                          onClick={() => {
                            if (improveImage && !improveCaption) return;
                            setImproveImage(!improveImage);
                          }}
                          className={cn(
                            "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200",
                            improveImage
                              ? "bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                              : "bg-white/[0.02] border-white/5 text-slate-500 hover:bg-white/5"
                          )}
                        >
                          <Image className="h-3.5 w-3.5" />
                          Media
                        </button>
                      </div>
                    </div>

                    <Button
                      onClick={() => improvePostMutation.mutate()}
                      disabled={isImproving || improvePostMutation.isPending || (!improveCaption && !improveImage)}
                      className="w-full h-11 mt-2 text-sm font-semibold bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.3)] active:scale-[0.98] transition-all disabled:opacity-70"
                    >
                      {isImproving ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Improving...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Improve
                        </span>
                      )}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

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
          </div>

          <div className='space-y-3'>
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
              <Image className='h-4 w-4 mr-2' />
              Import Media
            </Button>
          </div>

          {post?.media && post.media.length > 0 ? (
            <div className='flex flex-wrap gap-4'>
              {post.media.map((media) => {
                const isVideo = media.contentType?.includes('video');
                return (
                  <div
                    key={media.resourceId}
                    className='relative h-24 w-24 rounded-lg overflow-hidden border border-white/10'
                  >
                    <button
                      type='button'
                      onClick={() => setPreviewMedia({ url: media.presignedUrl, isVideo })}
                      onMouseEnter={() => { }}
                      className='h-full w-full block'
                      aria-label='Preview media'
                    >
                      {isVideo ? (
                        <video src={media.presignedUrl} muted className='h-full w-full object-cover' />
                      ) : (
                        <img src={media.presignedUrl} alt='Post media' className='h-full w-full object-cover' />
                      )}
                    </button>

                    {/* Trash icon */}
                    <Button
                      type='button'
                      size='icon-xs'
                      variant='destructive'
                      onClick={() => {
                        setRemoveTarget(media.resourceId);
                        setIsRemoveDialogOpen(true);
                      }}
                      className='absolute top-1 right-1 z-20 '
                      aria-label='Remove media'
                    >
                      <Trash2 className='size-4 ' />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-12 rounded-lg border border-dashed border-white/10 bg-white/2'>
              <Image className='h-8 w-8 text-slate-500 mb-2' />
              <p className='text-slate-400 text-sm'>No media added yet</p>
              <p className='text-slate-500 text-xs mt-1'>Click "Import Media" button to add images or videos</p>
            </div>
          )}
        </section>
      </div>

      {/* Dialogs */}
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
        onUploadClick={() => { }}
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

      {/* Remove media confirm */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent className='border-white/15 bg-[#060912] text-white'>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Media</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to remove this media from the post?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='border-white/10 bg-white/4 text-white/85 hover:bg-white/8 hover:text-white'>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveConfirm} className='bg-red-600 hover:bg-red-700 text-white'>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={Boolean(previewMedia)} onOpenChange={(open: boolean) => !open && setPreviewMedia(null)}>
        <DialogContent className='flex items-center justify-center min-w-[40vw] max-w-[80vw] max-h-[80vh] p-0'>
          {previewMedia && (
            <div className='w-full h-full flex items-center justify-center bg-black/60 p-4'>
              {previewMedia.isVideo ? (
                <video src={previewMedia.url} controls className='max-h-full max-w-full' />
              ) : (
                <img src={previewMedia.url} alt='Preview' className='max-h-full max-w-full' />
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
