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

function OpenAILogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.74 11.91c0-1.12-.52-2.14-1.34-2.83a4.04 4.04 0 0 0 .15-1.1c0-2.24-1.82-4.06-4.06-4.06c-.63 0-1.22.14-1.75.4a4.03 4.03 0 0 0-3.32-1.74c-2.24 0-4.06 1.82-4.06 4.06c0 .19.01.37.04.55A4.05 4.05 0 0 0 4.6 10.05c-1.75.83-2.92 2.62-2.92 4.63c0 2.24 1.82 4.06 4.06 4.06.45 0 .89-.07 1.3-.2a4.06 4.06 0 0 0 6.64 2.11c.54.34 1.18.54 1.87.54c2.24 0 4.06-1.82 4.06-4.06c0-.07 0-.15-.01-.22a4.06 4.06 0 0 0 2.24-5zm-2.07 1.39l-3.37-1.95a.49.49 0 0 1-.25-.43v-4.75a2.26 2.26 0 0 1 3.39-1.96l.11.06c.92.53 1.5 1.52 1.5 2.58v2.48c0 .73-.39 1.4-1.02 1.77l-.36.2zm-2.31 3.99a2.26 2.26 0 0 1-3.39 0l-.11-.06c-.92-.53-1.5-1.52-1.5-2.58v-1.19c0-.27.22-.49.49-.49h4.75a2.26 2.26 0 0 1 2.26 2.26v2.06zm-7.61.9l-3.37-1.95a2.26 2.26 0 0 1-1.13-1.96v-3.89c0-1.06.58-2.05 1.5-2.58l.11-.06a2.26 2.26 0 0 1 3.39 1.96v4.75a.49.49 0 0 1-.25.43l-3.37 1.95a.46.46 0 0 1-.25.07l-.63-.37zm-2.31-7.68a2.26 2.26 0 0 1 0-3.92l.11-.06a2.26 2.26 0 0 1 3.39 1.96v1.19c0 .27-.22.49-.49.49H6.18a2.26 2.26 0 0 1-2.26-2.26V6.75l.18-.08zm6.56-4.52l3.37 1.95a2.26 2.26 0 0 1 1.13 1.96v3.89c0 1.06-.58 2.05-1.5 2.58l-.11.06a2.26 2.26 0 0 1-3.39-1.96V5.45a.49.49 0 0 1 .25-.43l3.37-1.95c.1-.06.21-.08.31-.08zm2.31 7.68a2.26 2.26 0 0 1 0 3.92l-.11.06a2.26 2.26 0 0 1-3.39-1.96v-1.19c0-.27.22-.49.49-.49h4.25a2.26 2.26 0 0 1 2.26 2.26v2.06l-.25-.09zM12 13.62l-2.01-1.16V10.13L12 8.97l2.01 1.16v2.33L12 13.62z" />
    </svg>
  );
}

function GeminiLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 0c-.55 0-1 .45-1 1c0 5.5-4.5 10-10 10c-.55 0-1 .45-1 1s.45 1 1 1c5.5 0 10 4.5 10 10c0 .55.45 1 1 1s1-.45 1-1c0-5.5 4.5-10 10-10c.55 0 1-4.5 1-1s-.45-1-1-1c-5.5 0-10-4.5-10-10c0-.55-.45-1-1-1z" />
    </svg>
  );
}

function ClaudeLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2L2 22h4.5l2-4.5h7l2 4.5H22L12 2zm-2 13l2-4.5 2 4.5h-4z" />
    </svg>
  );
}

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

function formatProcessingTime(seconds: number | null) {
  if (seconds == null) return 'N/A';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
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

function getProviderDetails(model: string, providerStr?: string | null) {
  const normalized = (providerStr || model || '').toLowerCase();
  if (normalized.includes('openai') || normalized.includes('gpt')) {
    return {
      label: 'OpenAI',
      icon: OpenAILogo,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20'
    };
  }
  if (normalized.includes('anthropic') || normalized.includes('claude')) {
    return {
      label: 'Claude',
      icon: ClaudeLogo,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10 border-orange-500/20'
    };
  }
  if (normalized.includes('google') || normalized.includes('gemini')) {
    return {
      label: 'Gemini',
      icon: GeminiLogo,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20'
    };
  }
  return {
    label: providerStr || 'AI Provider',
    icon: Coins,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10 border-slate-500/20'
  };
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
      <td className='px-4 py-4'><div className='h-4 w-10 animate-pulse rounded bg-white/[0.04]' /></td>
      <td className='px-4 py-4'><div className='h-4 w-16 animate-pulse rounded bg-white/[0.04]' /></td>
    </tr>
  );
}

function UsageRow({ record }: { record: AiSpendRecord }) {
  const providerDetails = getProviderDetails(record.model, record.provider);
  const ProviderIcon = providerDetails.icon;

  return (
    <tr className='border-b border-white/[0.03] transition-colors hover:bg-white/[0.01]'>
      <td className='px-4 py-4'>
        <ActionTypeBadge actionType={record.actionType} />
      </td>
      <td className='px-4 py-4'>
        <div className='flex items-center gap-2'>
          <div className={cn('flex size-6 items-center justify-center rounded-md border', providerDetails.bgColor)}>
            <ProviderIcon className={cn('size-3.5', providerDetails.color)} />
          </div>
          <div className='flex flex-col'>
            <span className='text-xs font-semibold text-white/90'>{providerDetails.label}</span>
            <span className='text-[10px] text-slate-500 font-mono'>{record.model}</span>
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
        <span className={cn('font-mono text-xs', record.processingDurationSeconds != null ? 'text-white/80' : 'text-slate-600')}>
          {formatProcessingTime(record.processingDurationSeconds)}
        </span>
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
      setNextCursor(
        data.value.nextCursorCreatedAt && data.value.nextCursorId
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
        setNextCursor(
          response.value.nextCursorCreatedAt && response.value.nextCursorId
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
      if (isFetching) return; // Prevent spamming API when quickly switching filters
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
                  <th className='px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500'>Duration</th>
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
                    <td colSpan={6} className='px-4 py-16 text-center'>
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
