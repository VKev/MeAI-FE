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
import AiLoadingState from '@/components/ui/ai-loading-state';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchPostById, updatePost, startAiPostImprove, fetchAiPostImprove, approveAiPostImprove, rejectAiPostImprove } from '@/services/client/post.client';
import { fetchResources } from '@/services/client/resource.client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, CheckCircle2, Package, RefreshCw, Save, Sparkles, X, Image as ImageIcon, Trash2, ChevronDown, ThumbsUp, ThumbsDown, GitCompare, PlusCircle } from 'lucide-react';
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

  const [isImproveModalOpen, setIsImproveModalOpen] = useState(false);
  const [improveInstruction, setImproveInstruction] = useState('');
  const [improveStyle, setImproveStyle] = useState('branded');
  const [improvePlatform, setImprovePlatform] = useState<string | null>(null);
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

  const updatePostMutation = useMutation({
    mutationFn: (payload: any) => updatePost(postId!, payload),
    onSuccess: () => {
      setHasChanges(false);
      setDraftMediaSelections([]);
      toast.success('Update successfully');
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
      platform: improvePlatform || 'facebook',
      userInstruction: improveInstruction || null
    }),
    onSuccess: () => {
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

  // Sync local isImproving with server status
  useEffect(() => {
    if (isAiImproving) {
      setIsImproving(true);
    } else if (aiImproveStatus === 'completed' || aiImproveStatus === 'failed' || !aiImproveStatus) {
      setIsImproving(false);
    }
  }, [isAiImproving, aiImproveStatus]);

  const post = data?.value;
  const isShowPublish = post && post.status === 'draft' ? true : false;

  useEffect(() => {
    if (post && improvePlatform === null) {
      const platform = post.publications?.[0]?.socialMediaType?.toLowerCase() || 'facebook';
      setImprovePlatform(platform);
    }
  }, [post, improvePlatform]);

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

  const handleRegenerate = useCallback(() => {
    setIsImproveModalOpen(true);
  }, []);

  const handleAiImprove = useCallback(() => {
    improvePostMutation.mutate();
  }, [improvePostMutation]);

  if (isFetching) {
    return (
      <div className='space-y-8'>
        <section className='overflow-hidden rounded-[28px] border border-white/12 bg-white/2 px-5 py-6 sm:px-7 sm:py-8'>
          <div className='flex items-center gap-4'>
            <div className='h-14 w-14 rounded-2xl bg-white/4 animate-pulse' />
            <div className='flex-1 space-y-2'>
              <div className='h-8 w-48 bg-white/4 rounded-lg animate-pulse' />
              <div className='h-4 w-96 bg-white/4 rounded-lg animate-pulse' />
            </div>
          </div>
        </section>
        <section className='rounded-[28px] border border-white/12 bg-white/2 px-6 py-6 space-y-4'>
          <div className='h-8 w-48 bg-white/4 rounded-lg animate-pulse' />
          <div className='w-full h-48 bg-white/4 rounded-2xl animate-pulse' />
        </section>
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

  return (
    <>
      <div className='space-y-8'>
        {/* Header */}
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
          <div className='flex items-center gap-2 relative z-10'>
            <Button
              type='button'
              variant='outline'
              onClick={() => void refetch()}
              disabled={isFetching}
              className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white px-6'
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
            {isShowPublish && (
              <Button
                type='button'
                variant='outline'
                className='rounded-2xl text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:text-white px-6 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/30 border-none'
              >
                <CheckCircle2 className={`h-4 w-4 mr-2`} />
                Publish
              </Button>
            )}
          </div>
        </section>

        {/* Breadcrumb */}
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
              <BreadcrumbPage className="text-slate-400">{post?.id}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <main className='max-w-6xl mx-auto px-0 py-2 space-y-12 relative'>
          {/* Background Ambient Glows */}
          <div className="absolute top-20 -left-20 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-20 -right-20 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

          {/* Content Editor Section */}
          <section className='relative group'>
            <div className="absolute -inset-0.5 bg-linear-to-r from-white/10 to-transparent rounded-[32px] blur opacity-10 group-hover:opacity-20 transition duration-1000" />
            <div className='relative rounded-[32px] border border-white/10 bg-[#0A0C14]/80 backdrop-blur-xl px-8 py-8 space-y-8 shadow-2xl'>
              <div className='flex items-center justify-between'>
                <div className="space-y-1">
                  <h2 className='text-xl font-bold text-white flex items-center gap-3'>
                    <div className="w-2 h-6 bg-amber-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.4)]" />
                    Caption & Context
                  </h2>
                  <p className="text-xs text-slate-500 ml-5 font-medium tracking-wide">Refine your post's narrative and messaging.</p>
                </div>

                <div className="flex items-center gap-3">
                  <Dialog open={isImproveModalOpen} onOpenChange={setIsImproveModalOpen}>
                    <DialogTrigger asChild>
                      {!isAiImproveDone && (
                        <Button
                          type='button'
                          variant='outline'
                          disabled={isImproving || !editContent.trim()}
                          className='rounded-xl h-10 px-6 border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 gap-2 shadow-[0_0_20px_rgba(245,158,11,0.05)] transition-all active:scale-95'
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
                    <DialogContent className="sm:max-w-[400px] border-white/10 bg-[#080A12] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.05)] rounded-[32px] overflow-hidden" >
                      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-amber-500 via-orange-500 to-amber-500" />
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h4 className="font-bold text-white text-xl flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-amber-500/10">
                              <Sparkles className="h-5 w-5 text-amber-500" />
                            </div>
                            AI Configs
                          </h4>
                          <p className="text-xs leading-relaxed text-slate-400">Define how MeAI should optimize your content for maximum impact.</p>
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
                        className="h-10 text-xs rounded-xl border-white/8 bg-white/[0.03] text-white placeholder:text-slate-600 outline-none focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0 focus-visible:border-white/15 transition-all"
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
                        <DropdownMenuContent className="w-64 border-white/10 bg-[#0A0D1A] text-white rounded-xl shadow-2xl p-1 z-[110]">
                          <DropdownMenuRadioGroup value={improveStyle} onValueChange={setImproveStyle}>
                            <DropdownMenuRadioItem value="branded" className="text-xs py-2 rounded-lg focus:bg-amber-500/10 focus:text-amber-500 cursor-pointer">Branded</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="creative" className="text-xs py-2 rounded-lg focus:bg-amber-500/10 focus:text-amber-500 cursor-pointer">Creative</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="marketing" className="text-xs py-2 rounded-lg focus:bg-amber-500/10 focus:text-amber-500 cursor-pointer">Marketing</DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-medium text-slate-300">Target Platform</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between bg-white/5 border-white/10 rounded-xl h-11 px-4 text-sm font-normal capitalize">
                            {improvePlatform || "facebook"}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 bg-[#0A0C14] border-white/10 rounded-2xl shadow-2xl p-2 z-[100]">
                          <DropdownMenuRadioGroup value={improvePlatform || "facebook"} onValueChange={setImprovePlatform}>
                            <DropdownMenuRadioItem value="facebook" className="rounded-xl focus:bg-white/5 cursor-pointer text-[#1877F2]">
                              Facebook {post?.publications?.[0]?.socialMediaType?.toLowerCase() === 'facebook' && <span className="ml-2 px-1.5 py-0.5 rounded-md bg-[#1877F2]/20 text-[#1877F2] text-[9px] font-bold uppercase">Default</span>}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="instagram" className="rounded-xl focus:bg-white/5 cursor-pointer text-pink-400">
                              Instagram {post?.publications?.[0]?.socialMediaType?.toLowerCase() === 'instagram' && <span className="ml-2 px-1.5 py-0.5 rounded-md bg-pink-400/20 text-pink-400 text-[9px] font-bold uppercase">Default</span>}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="tiktok" className="rounded-xl focus:bg-white/5 cursor-pointer text-slate-200">
                              TikTok {post?.publications?.[0]?.socialMediaType?.toLowerCase() === 'tiktok' && <span className="ml-2 px-1.5 py-0.5 rounded-md bg-slate-200/20 text-slate-200 text-[9px] font-bold uppercase">Default</span>}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="threads" className="rounded-xl focus:bg-white/5 cursor-pointer text-white">
                              Threads {post?.publications?.[0]?.socialMediaType?.toLowerCase() === 'threads' && <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/20 text-white text-[9px] font-bold uppercase">Default</span>}
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
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
                          <ImageIcon className="h-3.5 w-3.5" />
                          Media
                        </button>
                      </div>
                    </div>

                    <Button 
                      onClick={handleAiImprove}
                      className="w-full bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-bold h-12 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
                    >
                      Start Optimization
                    </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {!isImproving && !isAiImproveDone && (
                    <Button
                      type='button'
                      onClick={handleSaveChanges}
                      disabled={!hasChanges || updatePostMutation.isPending}
                      className='rounded-xl h-10 px-6 bg-violet-600 hover:bg-violet-500 text-white font-bold gap-2 shadow-lg shadow-violet-500/20 transition-all active:scale-95'
                    >
                      <Save className='h-4 w-4' />
                      Save Changes
                    </Button>
                  )}
                </div>
              </div>

              <div className='relative'>
                {isImproving ? (
                  <div className="py-12 animate-in fade-in zoom-in-95 duration-500">
                    <AiLoadingState />
                  </div>
                ) : isAiImproveDone ? (
                  <div className='space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-700'>
                    {/* Action Row - Pill Style */}
                    <div className="flex justify-center">
                      <div className="flex items-center gap-1 p-1 bg-white/[0.03] backdrop-blur-md rounded-full border border-white/5 shadow-2xl">
                        <button
                          onClick={handleRegenerate}
                          className="flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Regenerate
                        </button>
                        <div className="w-[1px] h-4 bg-white/10 mx-1" />
                        <button
                          onClick={() => rejectMutation.mutate()}
                          disabled={rejectMutation.isPending || approveMutation.isPending}
                          className="flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-bold text-rose-500 hover:bg-rose-500/10 transition-all duration-200"
                        >
                          {rejectMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                          Reject
                        </button>
                        <div className="w-[1px] h-4 bg-white/10 mx-1" />
                        <button
                          onClick={() => approveMutation.mutate()}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          className="flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-bold text-emerald-500 hover:bg-emerald-500/10 transition-all duration-200"
                        >
                          {approveMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
                          Approve
                        </button>
                      </div>
                    </div>

                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                      <div className='space-y-3'>
                        <div className='flex items-center gap-2 px-2'>
                          <div className='w-1.5 h-1.5 rounded-full bg-slate-500' />
                          <span className='text-[10px] font-bold text-slate-500 uppercase tracking-widest'>Original</span>
                        </div>
                        <div className='relative rounded-3xl border border-white/5 bg-black/20 p-8 min-h-[240px]'>
                          <p className='text-[15px] text-slate-500 leading-8 whitespace-pre-wrap'>
                            {post?.content?.content || <span className='italic text-slate-700'>No content</span>}
                          </p>
                        </div>
                      </div>
                      <div className='space-y-3'>
                        <div className='flex items-center gap-2 px-2'>
                          <div className='w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' />
                          <span className='text-[10px] font-bold text-amber-500 uppercase tracking-widest'>AI Suggested</span>
                        </div>
                        <div className='relative rounded-3xl border border-amber-500/20 bg-amber-500/[0.03] p-8 min-h-[240px] shadow-xl'>
                          <p className='text-[15px] text-slate-100 leading-8 whitespace-pre-wrap font-medium'>
                            {aiImprovement?.resultCaption || <span className='italic text-slate-600'>Processing...</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                <div className="animate-in fade-in duration-700 relative">
                  <textarea
                    value={editContent}
                    onChange={(e) => {
                      setEditContent(e.target.value);
                      setHasChanges(true);
                    }}
                    placeholder='Describe your post... MeAI will help you optimize it later.'
                    className='w-full min-h-[280px] resize-none rounded-[32px] border border-white/5 bg-black/40 p-8 pb-16 text-[16px] leading-8 text-slate-200 placeholder-slate-700 transition-all focus:border-amber-500/20 focus:bg-black/50 focus:outline-none shadow-inner'
                  />
                  <div className="absolute bottom-6 right-8 flex items-center gap-3 px-4 py-2 bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
                    <div className="relative flex h-2 w-2">
                      <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></div>
                      <div className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    </div>
                    <span className={cn(
                      "text-[11px] font-mono font-bold tracking-wider transition-colors duration-300",
                      editContent.length > 2000 ? "text-red-400" : "text-slate-300"
                    )}>
                      {editContent.length.toLocaleString()} / 2,000 <span className="text-slate-600 ml-1 font-medium">CHARS</span>
                    </span>
                  </div>
                </div>
                )}
              </div>

              {post?.publications && post.publications.length > 0 && !isImproving && !isAiImproveDone && (
                <div className='pt-6 border-t border-white/5'>
                  <div className="flex items-center gap-3 px-2 mb-3">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    <p className='text-[11px] font-bold text-slate-500 uppercase tracking-widest'>Current Distribution</p>
                  </div>
                  <div className='flex flex-wrap gap-2 px-2'>
                    {post.publications.map((pub) => (
                      <div
                        key={pub.id}
                        className='px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] font-medium text-slate-400 flex items-center gap-2'
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                        {pub.socialMediaType}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Post Media Section */}
          <section className='relative group'>
            <div className="absolute -inset-0.5 bg-linear-to-r from-white/5 to-transparent rounded-[32px] blur opacity-5 group-hover:opacity-10 transition duration-1000" />
            <div className='relative rounded-[32px] border border-white/10 bg-[#0A0C14]/80 backdrop-blur-xl px-8 py-8 space-y-8 shadow-xl'>
              <div className='flex items-center justify-between'>
                <div className="space-y-1">
                  <h2 className='text-xl font-bold text-white flex items-center gap-3'>
                    <div className="w-2 h-6 bg-violet-500 rounded-full shadow-[0_0_12px_rgba(139,92,246,0.4)]" />
                    Media Gallery
                  </h2>
                  <p className="text-xs text-slate-500 ml-5 font-medium tracking-wide">Visual assets and rich media for this post.</p>
                </div>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsMediaModalOpen(true)}
                  className='rounded-xl h-10 px-6 border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2 transition-all active:scale-95'
                >
                  <PlusCircle className='h-4 w-4' />
                  Import Media
                </Button>
              </div>

              <div className='p-8 rounded-[32px] bg-black/40 border border-white/5 min-h-[220px] transition-all hover:bg-black/50'>
                {post?.media && post.media.length > 0 ? (
                  <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6'>
                    {post.media.map((media) => {
                      const isVideo = media.contentType?.includes('video');
                      return (
                        <div
                          key={media.resourceId}
                          className='group/media relative aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-lg'
                        >
                          <button
                            type='button'
                            onClick={() => setPreviewMedia({ url: media.presignedUrl, isVideo })}
                            className='h-full w-full block'
                          >
                            {isVideo ? (
                              <div className="relative h-full w-full bg-black/20 flex items-center justify-center">
                                <video src={media.presignedUrl} muted className='h-full w-full object-cover' />
                                <RefreshCw className="w-5 h-5 text-white/40 absolute" />
                              </div>
                            ) : (
                              <img src={media.presignedUrl} alt='Post media' className='h-full w-full object-cover transition-transform duration-700 group-hover/media:scale-110' />
                            )}
                          </button>
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/media:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => setPreviewMedia({ url: media.presignedUrl, isVideo })}
                              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              type='button'
                              size='icon'
                              variant='destructive'
                              onClick={() => {
                                setRemoveTarget(media.resourceId);
                                setIsRemoveDialogOpen(true);
                              }}
                              className='w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-lg'
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className='flex flex-col items-center justify-center py-16 text-center space-y-4'>
                    <ImageIcon className='h-8 w-8 text-slate-700' />
                    <div className="space-y-1">
                      <p className='text-slate-400 font-bold'>No media attached</p>
                      <p className='text-slate-600 text-xs'>Upload images or videos to make your post more engaging.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
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

      <Dialog open={Boolean(previewMedia)} onOpenChange={(open: boolean) => !open && setPreviewMedia(null)}>
        <DialogContent className='flex items-center justify-center min-w-[40vw] max-w-[80vw] max-h-[80vh] p-0 border-none bg-transparent'>
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
