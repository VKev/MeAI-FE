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
import type {
  GenerationMode,
  ImageGenerationConfig,
  VideoGenerationConfig
} from '@/routes/workspace/hooks/useGeneration';
import { toast } from 'react-toastify';
import DialogError from '@/components/common/DialogError';

const RESOURCE_TYPE_OPTIONS = ['ALL', 'IMAGE', 'VIDEO'] as const;

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

  const [resourceTypeFilter, setResourceTypeFilter] = useState<(typeof RESOURCE_TYPE_OPTIONS)[number]>('ALL');
  const [selectedItems, setSelectedItems] = useState<TChat[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
        const seedValue = Number.parseInt(videoConfig.seed, 10);
        const payload: TCreateVideoChat = {
          chatSessionId: sessionId,
          prompt,
          model: videoConfig.model.id,
          aspectRatio: videoConfig.dimension,
          seeds: Number.isNaN(seedValue) ? undefined : [seedValue],
          watermark: Boolean(videoConfig.watermark.trim())
        };

        return chatApi.createVideoChat(payload);
      }

      const payload: TCreateImageChat = {
        chatSessionId: sessionId,
        prompt,
        model: imageConfig.model.id,
        resolution: imageConfig.imageQuality,
        outputFormat: imageConfig.outputFormat
      };

      return chatApi.createImageChat(payload);
    },
    onSuccess: () => {
      setPrompt('');
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      console.error('Generation failed:', error);
      toast.error('Something went wrong! Please try again later.');
    }
  });

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
          <PromptInput prompt={prompt} setPrompt={setPrompt} handleGenerate={handleGenerate} isGenerating={isPending} />

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
