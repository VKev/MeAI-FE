import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import WorkspaceTabNavigator from '@/components/workspace/common/WorkspaceTabNavigator';
import WorkspaceContentItem from '@/components/workspace/common/WorkspaceContentItem';
import PromptInput from '@/components/workspace/common/PromptInput';
import DialogConfirmDelete from '@/components/workspace/common/DialogConfirmDelete';
import { ArrowRightIcon, Filter } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { TChat, TCreateImageChat, TCreateVideoChat } from '@/models/chat.model';
import { chatApi } from '@/services/client/chat.client';
import { toast } from 'react-toastify';
import DialogError from '@/components/common/DialogError';
import type { GenerationMode, ImageGenerationConfig, VideoGenerationConfig } from '@/routes/workspace/type';
import type { TPostPreparePayload } from '@/models/post-prepare.model';
import { PostPrepareClientApi } from '@/services/client/post-prepare.client';
import { estimateCoinCost, type CoinCostQuote } from '@/services/client/coin-pricing.client';
import DialogInsufficientCoins from '@/components/common/DialogInsufficientCoins';
import { useUserStore } from '@/store/user.store';
import { useOptimisticCoinDebit } from '@/hooks/useOptimisticCoinDebit';
import { AUTH_QUERY_KEYS } from '@/lib/query-keys';
import { useEffect } from 'react';

const RESOURCE_TYPE_OPTIONS = ['ALL', 'IMAGE', 'VIDEO'] as const;

function parseResourceIds(raw: string | string[] | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface WorkspaceBuilderContentProps {
  prompt: string;
  setPrompt: (text: string) => void;
  generationMode: GenerationMode;
  imageConfig: ImageGenerationConfig;
  videoConfig: VideoGenerationConfig;
}

export function WorkspaceBuilderContent({
  prompt,
  setPrompt,
  generationMode,
  imageConfig,
  videoConfig
}: WorkspaceBuilderContentProps) {
  const navigate = useNavigate();
  const { workspaceId, sessionId } = useParams();
  const queryClient = useQueryClient();

  // Coin debit hook for optimistic updates
  const { onMutate: debitCoins, onSuccess: refetchUser, onError: rollbackCoins } = useOptimisticCoinDebit();

  const [resourceTypeFilter, setResourceTypeFilter] = useState<(typeof RESOURCE_TYPE_OPTIONS)[number]>('ALL');
  const [selectedItems, setSelectedItems] = useState<TChat[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [costQuote, setCostQuote] = useState<CoinCostQuote | null>(null);
  const [isInsufficientOpen, setIsInsufficientOpen] = useState(false);
  const userBalance = useUserStore((s) => s.user?.meAiCoin ?? 0);

  const currentTab = generationMode === 'video' ? 'video' : 'image';

  const queryKey = useMemo(() => ['workspace-chats', sessionId], [sessionId]);

  if (!sessionId || !workspaceId) {
    return null;
  }

  const {
    data: chatResponse,
    isLoading,
    isError
  } = useQuery({
    queryKey,
    queryFn: () => {
      return chatApi.getAllChatByChatSessionId(sessionId);
    },
    enabled: Boolean(sessionId)
  });

  const { mutateAsync: generateMutation, isPending } = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Missing session id.');
      }

      if (generationMode === 'video') {
        const payload: TCreateVideoChat = {
          chatSessionId: sessionId,
          prompt,
          model: videoConfig.model.id,
          aspectRatio: videoConfig.dimension,
          watermark: videoConfig.watermark.trim() || undefined
        };

        return chatApi.createVideoChat(payload);
      }

      const payload: TCreateImageChat = {
        chatSessionId: sessionId,
        prompt,
        model: imageConfig.model.id,
        aspectRatio: imageConfig.ratio,
        resolution: imageConfig.imageQuality,
        socialTargets: imageConfig.socialTargets.length > 0 ? imageConfig.socialTargets : undefined
      };

      return chatApi.createImageChat(payload);
    },
    onMutate: () => {
      // Optimistic debit coins from store
      const cost = costQuote?.totalCoins ?? 0;
      return debitCoins(cost);
    },
    onSuccess: () => {
      setPrompt('');
      void queryClient.invalidateQueries({ queryKey });
      // Refetch user profile to reconcile coin balance
      refetchUser();
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic debit on error
      rollbackCoins(context);

      // Handle specific error cases
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('Billing.InsufficientFunds') || message.toLowerCase().includes('insufficient')) {
        setIsInsufficientOpen(true);
        return;
      }
      console.error('Generation failed:', error);
      toast.error('Something went wrong! Please try again later.');
    }
  });

  // Cost preview for the Generate button. We quote on every config/mode change so the
  // label updates live as the user toggles model / resolution / social target count.
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        if (generationMode === 'video') {
          const res = await estimateCoinCost(
            {
              actionType: 'video_generation',
              model: videoConfig.model.id,
              variant: null,
              quantity: 1
            },
            controller.signal
          );
          if (res.isSuccess) setCostQuote(res.value);
          return;
        }
        // Image: cost scales with expected result count (source + distinct extra ratios).
        const uniqueRatios = new Set<string>();
        for (const t of imageConfig.socialTargets) uniqueRatios.add(t.ratio);
        const expected = Math.max(1, 1 + Math.max(0, uniqueRatios.size - (uniqueRatios.size > 0 ? 1 : 0)));
        const res = await estimateCoinCost(
          {
            actionType: 'image_generation',
            model: imageConfig.model.id,
            variant: imageConfig.imageQuality,
            quantity: expected
          },
          controller.signal
        );
        if (res.isSuccess) setCostQuote(res.value);
      } catch {
        // Non-fatal; Generate button just won't show the badge.
      }
    };
    void run();
    return () => controller.abort();
  }, [
    generationMode,
    imageConfig.model.id,
    imageConfig.imageQuality,
    imageConfig.socialTargets,
    videoConfig.model.id
  ]);

  const deleteMutation = useMutation({
    mutationFn: async (chatId: string) => {
      return chatApi.deleteChatById(chatId);
    },
    onMutate: (chatId) => {
      setDeletingId(chatId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      toast.success('Deleted successfully.');
    },
    onError: (error) => {
      console.error('Delete failed:', error);
      toast.error('Failed to delete chat. Please try again.');
    },
    onSettled: () => {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  });

  const { mutateAsync: preparePostMutation, isPending: isPreparingPost } = useMutation({
    mutationFn: async (payload: TPostPreparePayload) => {
      return await PostPrepareClientApi.createPostPrepare(payload);
    },
    onSuccess: (data) => {
      console.log('Post Prepare Success:', data);
      const postBuilderId = data.value.postBuilderId;
      toast.success('Post preparation successful! Redirecting to Post Builder...');
      navigate(`/workspace/${workspaceId}/post-builder/${postBuilderId}`);
    },
    onError: (error) => {
      console.error('Post Prepare Failed:', error);
      toast.error('Failed to prepare post. Please try again.');
    }
  });

  const chats = chatResponse?.value ?? [];
  const sortedChats = useMemo(() => {
    return [...chats].sort((left, right) => {
      const leftTime = left.createdAt ? Date.parse(left.createdAt) : 0;
      const rightTime = right.createdAt ? Date.parse(right.createdAt) : 0;
      return rightTime - leftTime;
    });
  }, [chats]);

  const skeletonItems = useMemo<TChat[]>(
    () =>
      Array.from({ length: 3 }, (_, index) => ({
        id: `skeleton-${index}`,
        sessionId: '',
        prompt: '',
        config: null,
        referenceResourceIds: null,
        resultResourceIds: null,
        referenceResourceUrls: null,
        resultResourceUrls: null,
        status: null,
        errorMessage: null,
        createdAt: null,
        updatedAt: null
      })),
    []
  );

  const isListLoading = isLoading && chats.length === 0;

  const visibleItems = isListLoading ? skeletonItems : sortedChats;

  const handleGenerate = () => {
    if (!sessionId || !prompt.trim() || isPending) {
      return;
    }

    generateMutation();
  };

  const handleReusePrompt = (text: string) => {
    setPrompt(text);
  };

  const handleDeleteRequest = (itemId: string) => {
    if (!itemId || deleteMutation.isPending) {
      return;
    }

    setPendingDeleteId(itemId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteId || deleteMutation.isPending) {
      return;
    }

    deleteMutation.mutate(pendingDeleteId);
    setIsDeleteDialogOpen(false);
  };

  const handleCloseDeleteDialog = () => {
    if (deleteMutation.isPending) {
      return;
    }

    setIsDeleteDialogOpen(false);
    setPendingDeleteId(null);
  };

  const handleToggleSelect = (item: TChat) => {
    setSelectedItems((prev) =>
      prev.some((s) => s.id === item.id) ? prev.filter((s) => s.id !== item.id) : [...prev, item]
    );
  };

  const handleProcessPostBuilder = () => {
    console.log('Process to Post Builder:', selectedItems);
    const allResourceIds = selectedItems.flatMap((item) => parseResourceIds(item.resultResourceIds));
    const payload: TPostPreparePayload = {
      workspaceId: workspaceId,
      instruction: null,
      language: 'vi',
      postType: null,
      resourceIds: allResourceIds,
      socialMedia: [
        {
          socialMediaId: null,
          type: 'reel',
          platform: 'tiktok',
          resourceIds: allResourceIds
        },
        {
          socialMediaId: null,
          type: 'post',
          platform: 'facebook',
          resourceIds: allResourceIds
        },
        {
          socialMediaId: null,
          type: 'post',
          platform: 'instagram',
          resourceIds: allResourceIds
        },
        {
          socialMediaId: null,
          type: 'post',
          platform: 'threads',
          resourceIds: allResourceIds
        }
      ]
    };

    preparePostMutation(payload);
  };

  const handleTabChange = (value: string) => {
    if (!workspaceId || !sessionId) return;

    if (value === 'video') {
      navigate(`/workspace/${workspaceId}/ai-generation/${sessionId}/video`);
      return;
    }

    navigate(`/workspace/${workspaceId}/ai-generation/${sessionId}`);
  };

  const renderItem = useCallback(
    (item: TChat) => {
      return (
        <WorkspaceContentItem
          key={item.id}
          item={item}
          isSelected={selectedItems.some((s) => s.id === item.id)}
          onToggleSelect={handleToggleSelect}
          handleDelete={handleDeleteRequest}
          handleReusePrompt={handleReusePrompt}
          isLoading={isListLoading}
          isDeleting={deletingId === item.id}
        />
      );
    },
    [deletingId, handleDeleteRequest, handleReusePrompt, handleToggleSelect, isListLoading, selectedItems]
  );

  const noItemWorkspace = useCallback(
    () => (
      <div className='flex h-full items-center justify-center'>
        <div className='bg-gray-900 border border-gray-800 rounded-lg p-8 text-center'>
          <p className='text-gray-300'>
            You still have yet to make your first AI generation. Please type a prompt above to create your first AI
            generation set.
          </p>
        </div>
      </div>
    ),
    []
  );

  return (
    <>
      <div className='flex-1 h-full overflow-auto bg-zinc-950 text-white border border-zinc-900'>
        {/* Header Section */}
        <div className='border-b border-zinc-900 p-5 space-y-4'>
          {/* Prompt Input */}
          <PromptInput
            prompt={prompt}
            setPrompt={setPrompt}
            handleGenerate={handleGenerate}
            isGenerating={isPending}
            costCoins={costQuote?.totalCoins}
          />

          <DialogInsufficientCoins
            isOpen={isInsufficientOpen}
            onClose={() => setIsInsufficientOpen(false)}
            requiredCoins={costQuote?.totalCoins}
            currentBalance={typeof userBalance === 'number' ? userBalance : Number(userBalance ?? 0)}
            message='This generation requires more MeAI coins than you currently have.'
          />

          {/* Tabs */}
          <WorkspaceTabNavigator currentTab={currentTab} handleTabChange={handleTabChange} />
        </div>

        {/* Main Content Area */}
        <div className='p-6 space-y-5'>
          <section className='rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,20,0.82)_0%,rgba(8,10,16,0.9)_100%)] p-4 sm:p-5'>
            <div className='flex items-center justify-between'>
              <div className='flex flex-wrap items-center gap-2'>
                <Label className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium tracking-wide text-slate-300 uppercase'>
                  <Filter className='h-3.5 w-3.5' />
                  Filter Type
                </Label>

                {RESOURCE_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type='button'
                    onClick={() => setResourceTypeFilter(option)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      resourceTypeFilter === option
                        ? 'bg-violet-500/25 text-violet-100 ring-1 ring-violet-300/40'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <Button
                variant={'default'}
                onClick={handleProcessPostBuilder}
                disabled={selectedItems.length === 0}
                className='cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Process to Post Builder ({selectedItems.length})
                <ArrowRightIcon className='w-5 h-5' />
              </Button>
            </div>
          </section>
          {!isListLoading && chats.length === 0 ? (
            noItemWorkspace()
          ) : (
            <div className='space-y-5'>{visibleItems.map(renderItem)}</div>
          )}
        </div>
      </div>

      {isError && <DialogError isOpen={isError} />}
      <DialogConfirmDelete
        isOpen={isDeleteDialogOpen}
        isLoading={deleteMutation.isPending}
        onCancel={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
