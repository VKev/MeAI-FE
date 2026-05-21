import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Coins,
  Image as ImageIcon,
  Video,
  MessageSquare,
  ChevronDown,
  Zap,
  RotateCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_USAGE_QUERY_KEYS } from '@/lib/query-keys';
import { fetchAiUsageHistory } from '@/services/client/ai-usage.client';
import type { AiSpendRecord, AiUsageHistoryParams } from '@/models/ai-usage.model';

const PAGE_SIZE = 20;



const ACTION_TYPE_CONFIG: Record<string, { label: string; icon: typeof Coins; color: string; bgColor: string }> = {
  image_generation: {
    label: 'Image',
    icon: ImageIcon,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10'
  },
  video_generation: {
    label: 'Video',
    icon: Video,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10'
  },
  caption_generation: {
    label: 'Caption',
    icon: MessageSquare,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10'
  }
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  debited: {
    label: 'Debited',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  },
  refunded: {
    label: 'Refunded',
    className: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
  }
};

const ACTION_TYPE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'image_generation', label: 'Image' },
  { value: 'video_generation', label: 'Video' },
  { value: 'caption_generation', label: 'Caption' }
];

function formatCoins(value: number) {
  return new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value);
}

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

function formatFullDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatModelName(model: string): string {
  if (!model) return 'AI Model';

  let cleaned = model;
  const prefixes = [
    'openai/',
    'anthropic/',
    'google/',
    'meta-llama/',
    'stability-ai/',
    'cohere/',
    'mistralai/',
    'perplexity/',
    'deepseek/',
    'bytedance/',
    'qwen/'
  ];

  for (const prefix of prefixes) {
    if (cleaned.toLowerCase().startsWith(prefix)) {
      cleaned = cleaned.substring(prefix.length);
      break;
    }
  }

  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    if (parts[1]) cleaned = parts[1];
  }

  const lower = cleaned.toLowerCase();

  if (lower.includes('dall-e')) {
    return cleaned.toUpperCase().replace(/-E-/i, '-E ');
  }

  if (lower.startsWith('gpt-')) {
    const afterGpt = cleaned.substring(4);
    return 'GPT-' + afterGpt
      .replace(/-/g, ' ')
      .replace(/\b[a-z]/g, (c) => c.toUpperCase());
  }

  if (lower.startsWith('claude-')) {
    const afterClaude = cleaned.substring(7);
    return 'Claude ' + afterClaude
      .replace(/-/g, ' ')
      .replace(/\b[a-z]/g, (c) => c.toUpperCase())
      .replace(/(\d) (\d)/g, '$1.$2');
  }

  if (lower.startsWith('gemini-')) {
    const afterGemini = cleaned.substring(7);
    return 'Gemini ' + afterGemini
      .replace(/-/g, ' ')
      .replace(/\b[a-z]/g, (c) => c.toUpperCase())
      .replace(/(\d) (\d)/g, '$1.$2');
  }

  if (lower.startsWith('llama-')) {
    const afterLlama = cleaned.substring(6);
    return 'Llama ' + afterLlama
      .replace(/-/g, ' ')
      .replace(/\b[a-z]/g, (c) => c.toUpperCase());
  }

  return cleaned
    .replace(/[-_]/g, ' ')
    .replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

function getProviderDetails(model: string, providerStr?: string | null): string {
  const normalizedModel = (model || '').toLowerCase();
  const normalizedProvider = (providerStr || '').toLowerCase();
  const combined = `${normalizedProvider} ${normalizedModel}`;

  if (combined.includes('openai') || combined.includes('gpt')) {
    return 'OpenAI';
  }
  if (combined.includes('anthropic') || combined.includes('claude')) {
    return 'Claude';
  }
  if (combined.includes('google') || combined.includes('gemini')) {
    return 'Gemini';
  }
  if (combined.includes('deepseek')) {
    return 'DeepSeek';
  }
  if (combined.includes('meta') || combined.includes('llama')) {
    return 'Meta Llama';
  }
  if (combined.includes('stability') || combined.includes('sdxl') || combined.includes('stable-diffusion')) {
    return 'Stability AI';
  }

  // Capitalize fallback provider name
  const fallbackLabel = providerStr || 'AI Provider';
  if (fallbackLabel.toLowerCase() === 'openrouter') {
    return 'OpenRouter';
  }
  
  return fallbackLabel
    .replace(/[-_]/g, ' ')
    .replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

function ActionTypeBadge({ actionType }: { actionType: string }) {
  const config = ACTION_TYPE_CONFIG[actionType] ?? {
    label: actionType.replace(/_/g, ' '),
    icon: Zap,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10'
  };
  const Icon = config.icon;

  return (
    <div className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1', config.bgColor)}>
      <Icon className={cn('size-3', config.color)} />
      <span className={cn('text-[11px] font-bold tracking-wide uppercase', config.color)}>{config.label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status.toLowerCase()] ?? {
    label: status,
    className: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

function UsageRowSkeleton() {
  return (
    <tr className='border-b border-white/[0.03]'>
      <td className='px-4 py-4'><div className='h-6 w-16 animate-pulse rounded-lg bg-white/[0.04]' /></td>
      <td className='px-4 py-4'><div className='h-4 w-32 animate-pulse rounded bg-white/[0.04]' /></td>
      <td className='px-4 py-4'><div className='h-4 w-12 animate-pulse rounded bg-white/[0.04]' /></td>
      <td className='px-4 py-4'><div className='h-5 w-16 animate-pulse rounded-full bg-white/[0.04]' /></td>
      <td className='px-4 py-4'><div className='h-4 w-16 animate-pulse rounded bg-white/[0.04]' /></td>
    </tr>
  );
}

function UsageRow({ record }: { record: AiSpendRecord }) {
  const providerLabel = getProviderDetails(record.model, record.provider);

  return (
    <tr className='border-b border-white/[0.03] transition-colors hover:bg-white/[0.01]'>
      <td className='px-4 py-4'>
        <ActionTypeBadge actionType={record.actionType} />
      </td>
      <td className='px-4 py-4'>
        <div className='flex items-center gap-2'>
          <div className='flex flex-col'>
            <span className='text-xs font-semibold text-white/90'>{providerLabel}</span>
            <span className='text-[10px] text-slate-500 font-mono'>{formatModelName(record.model)}</span>
          </div>
        </div>
      </td>
      <td className='px-4 py-4'>
        <span className='font-mono text-xs font-bold text-amber-400'>{formatCoins(record.totalCoins)}</span>
      </td>
      <td className='px-4 py-4'>
        <StatusBadge status={record.status} />
      </td>
      <td className='px-4 py-4'>
        <span className='text-xs text-slate-400' title={formatFullDate(record.createdAt)}>
          {formatRelativeDate(record.createdAt)}
        </span>
      </td>
    </tr>
  );
}

export function AiUsageSection() {
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [allItems, setAllItems] = useState<AiSpendRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<{ createdAt: string; id: string } | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const queryParams: AiUsageHistoryParams = useMemo(
    () => ({
      limit: PAGE_SIZE,
      ...(actionTypeFilter ? { actionType: actionTypeFilter } : {})
    }),
    [actionTypeFilter]
  );

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [...AI_USAGE_QUERY_KEYS.history(), queryParams],
    queryFn: async () => {
      const response = await fetchAiUsageHistory(queryParams);
      return response;
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData
  });

  // Safely sync initial page load into list to avoid race conditions
  useEffect(() => {
    if (data?.isSuccess && data.value) {
      setAllItems(data.value.items);
      const hasMore = data.value.items.length >= PAGE_SIZE;
      setNextCursor(
        hasMore && data.value.nextCursorCreatedAt && data.value.nextCursorId
          ? { createdAt: data.value.nextCursorCreatedAt, id: data.value.nextCursorId }
          : null
      );
      setHasInitialized(true);
    }
  }, [data]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const response = await fetchAiUsageHistory({
        ...queryParams,
        cursorCreatedAt: nextCursor.createdAt,
        cursorId: nextCursor.id
      });

      if (response.isSuccess && response.value) {
        setAllItems((prev) => [...prev, ...response.value.items]);
        const hasMore = response.value.items.length >= PAGE_SIZE;
        setNextCursor(
          hasMore && response.value.nextCursorCreatedAt && response.value.nextCursorId
            ? { createdAt: response.value.nextCursorCreatedAt, id: response.value.nextCursorId }
            : null
        );
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore, queryParams]);

  const handleActionTypeChange = useCallback(
    (value: string) => {
      if (isFetching) return;
      setActionTypeFilter(value);
    },
    [isFetching]
  );

  const [tablePage, setTablePage] = useState(0);
  const TABLE_PAGE_SIZE = 10;
  const paginatedItems = allItems.slice(tablePage * TABLE_PAGE_SIZE, (tablePage + 1) * TABLE_PAGE_SIZE);
  const totalTablePages = Math.ceil(allItems.length / TABLE_PAGE_SIZE);

  const isFirstLoad = isLoading && !hasInitialized;
  const isBackgroundRefresh = isFetching && hasInitialized;

  return (
    <div className='space-y-8'>
      {/* ── Section Title ── */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.04] pb-5'>
        <div className='flex items-center gap-3'>
          <div className='flex size-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-inner'>
            <Coins size={18} className='text-amber-400' />
          </div>
          <div className='space-y-0.5'>
            <h2 className='text-lg font-bold tracking-tight text-white/90'>AI Usage & Spend</h2>
            <p className='text-xs text-slate-400'>Track your AI generation history and coin usage.</p>
          </div>
          {isBackgroundRefresh && (
            <RotateCw size={14} className='text-slate-500 animate-spin ml-2' />
          )}
        </div>
      </div>

      {/* ── Request History Section ── */}
      <div className='space-y-4'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <h3 className='text-xs font-bold uppercase tracking-wider text-slate-400'>Usage History</h3>

          {/* Segmented control for filtering */}
          <div className='flex items-center gap-1 rounded-lg bg-white/[0.02] border border-white/[0.06] p-0.5 self-start sm:self-auto'>
            {ACTION_TYPE_OPTIONS.map((opt) => {
              const isActive = actionTypeFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type='button'
                  disabled={isFetching}
                  onClick={() => handleActionTypeChange(opt.value)}
                  className={cn(
                    'rounded-md px-3 py-1 text-[11px] font-bold transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed',
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className='overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.01]'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-white/[0.05]'>
                  <th className='px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500'>Action</th>
                  <th className='px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500'>AI Model</th>
                  <th className='px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500'>Coins</th>
                  <th className='px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500'>Status</th>
                  <th className='px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500'>Date</th>
                </tr>
              </thead>
              <tbody>
                {isFirstLoad ? (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <UsageRowSkeleton key={`skeleton-${i}`} />
                    ))}
                  </>
                ) : paginatedItems.length > 0 ? (
                  paginatedItems.map((record) => (
                    <UsageRow
                      key={record.spendRecordId}
                      record={record}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className='px-4 py-16 text-center'>
                      <div className='flex flex-col items-center justify-center'>
                        <div className='flex size-12 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 text-slate-600 mb-3'>
                          <Coins size={22} />
                        </div>
                        <p className='text-xs font-semibold text-slate-400'>No AI usage history yet</p>
                        <p className='text-[10px] text-slate-500 mt-1'>Your generated images, videos, and captions will appear here.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Centered Pagination Panel */}
          {allItems.length > 0 && (
            <div className='flex flex-col sm:flex-row items-center justify-between border-t border-white/[0.05] px-6 py-4 gap-4'>
              <div className='flex items-center gap-1.5 order-2 sm:order-1'>
                {totalTablePages > 1 && (
                  <>
                    <button
                      type='button'
                      disabled={tablePage === 0}
                      onClick={() => setTablePage((p) => p - 1)}
                      className='rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white disabled:opacity-30 transition-colors border border-white/5 bg-white/[0.02]'
                    >
                      Previous
                    </button>
                    <span className='text-[11px] font-mono text-slate-500 px-2'>
                      Page {tablePage + 1} of {totalTablePages}
                    </span>
                    <button
                      type='button'
                      disabled={tablePage >= totalTablePages - 1}
                      onClick={() => setTablePage((p) => p + 1)}
                      className='rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white disabled:opacity-30 transition-colors border border-white/5 bg-white/[0.02]'
                    >
                      Next
                    </button>
                  </>
                )}
              </div>

              {nextCursor && (
                <div className='flex justify-center w-full sm:w-auto order-1 sm:order-2'>
                  <button
                    type='button'
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className='flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-[11px] font-bold text-amber-400 hover:bg-amber-500/10 disabled:opacity-50 transition-all shadow-sm'
                  >
                    {isLoadingMore ? (
                      <RotateCw size={12} className='animate-spin' />
                    ) : (
                      <ChevronDown size={12} />
                    )}
                    Load More History
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className='rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3'>
          <p className='text-xs font-semibold text-red-400'>Failed to load AI usage history.</p>
          <button
            type='button'
            onClick={() => refetch()}
            className='mt-2 text-[11px] font-medium text-red-300 underline hover:text-red-200'
          >
            Retry Sync
          </button>
        </div>
      )}
    </div>
  );
}
