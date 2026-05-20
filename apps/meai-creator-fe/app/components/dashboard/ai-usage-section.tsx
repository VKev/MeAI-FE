import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Coins,
  Clock,
  Image as ImageIcon,
  Video,
  MessageSquare,
  ChevronDown,
  Timer,
  Zap,
  Filter,
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
    className: 'bg-red-500/10 text-red-400 border-red-500/20'
  }
};

const ACTION_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
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


function ActionTypeBadge({ actionType }: { actionType: string }) {
  const config = ACTION_TYPE_CONFIG[actionType] ?? {
    label: actionType.replace(/_/g, ' '),
    icon: Zap,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10'
  };
  const Icon = config.icon;

  return (
    <div className={cn('inline-flex items-center gap-1.5 rounded-lg px-2 py-1', config.bgColor)}>
      <Icon className={cn('size-3', config.color)} />
      <span className={cn('text-[11px] font-semibold', config.color)}>{config.label}</span>
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

function SummaryMetric({
  icon,
  label,
  value,
  accent = 'text-white'
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className='flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3'>
      <div className='flex size-8 items-center justify-center rounded-lg bg-white/[0.04]'>{icon}</div>
      <div className='flex flex-col leading-none'>
        <span className='text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1'>{label}</span>
        <span className={cn('font-mono text-sm font-bold', accent)}>{value}</span>
      </div>
    </div>
  );
}

function UsageRowSkeleton() {
  return (
    <tr className='border-b border-white/[0.04]'>
      <td className='px-4 py-3.5'>
        <div className='h-6 w-16 animate-pulse rounded-lg bg-white/[0.05]' />
      </td>
      <td className='px-4 py-3.5'>
        <div className='h-4 w-24 animate-pulse rounded bg-white/[0.05]' />
      </td>
      <td className='px-4 py-3.5'>
        <div className='h-4 w-12 animate-pulse rounded bg-white/[0.05]' />
      </td>
      <td className='px-4 py-3.5'>
        <div className='h-5 w-16 animate-pulse rounded-full bg-white/[0.05]' />
      </td>
      <td className='px-4 py-3.5'>
        <div className='h-4 w-10 animate-pulse rounded bg-white/[0.05]' />
      </td>
      <td className='px-4 py-3.5'>
        <div className='h-4 w-16 animate-pulse rounded bg-white/[0.05]' />
      </td>
    </tr>
  );
}

function UsageRow({ record }: { record: AiSpendRecord }) {
  return (
    <tr className='border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]'>
      <td className='px-4 py-3.5'>
        <ActionTypeBadge actionType={record.actionType} />
      </td>
      <td className='px-4 py-3.5'>
        <div className='flex flex-col'>
          <span className='text-xs font-medium text-white/90'>{record.model}</span>
          {record.variant && (
            <span className='text-[10px] text-slate-500 mt-0.5'>{record.variant}</span>
          )}
        </div>
      </td>
      <td className='px-4 py-3.5'>
        <span className='font-mono text-xs font-bold text-amber-400'>{formatCoins(record.totalCoins)}</span>
      </td>
      <td className='px-4 py-3.5'>
        <StatusBadge status={record.status} />
      </td>
      <td className='px-4 py-3.5'>
        <span
          className={cn(
            'font-mono text-xs',
            record.processingDurationSeconds != null ? 'text-white/80' : 'text-slate-600'
          )}
        >
          {formatProcessingTime(record.processingDurationSeconds)}
        </span>
      </td>
      <td className='px-4 py-3.5'>
        <span className='text-xs text-slate-400' title={formatFullDate(record.createdAt)}>
          {formatRelativeDate(record.createdAt)}
        </span>
      </td>
    </tr>
  );
}


export function AiUsageSection() {
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const [allItems, setAllItems] = useState<AiSpendRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<{ createdAt: string; id: string } | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const queryParams: AiUsageHistoryParams = useMemo(
    () => ({
      limit: PAGE_SIZE,
      ...(actionTypeFilter ? { actionType: actionTypeFilter } : {})
    }),
    [actionTypeFilter]
  );

  const { isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [...AI_USAGE_QUERY_KEYS.history(), queryParams],
    queryFn: async () => {
      const response = await fetchAiUsageHistory(queryParams);
      if (response.isSuccess && response.value) {
        setAllItems(response.value.items);
        setNextCursor(
          response.value.nextCursorCreatedAt && response.value.nextCursorId
            ? { createdAt: response.value.nextCursorCreatedAt, id: response.value.nextCursorId }
            : null
        );
        setHasInitialized(true);
      }
      return response;
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false
  });

  const [isLoadingMore, setIsLoadingMore] = useState(false);

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
      setActionTypeFilter(value);
      setAllItems([]);
      setNextCursor(null);
      setHasInitialized(false);
    },
    []
  );

  const summary = useMemo(() => {
    const totalCoins = allItems.reduce((sum, item) => sum + item.totalCoins, 0);
    const totalRequests = allItems.length;
    const timingRecords = allItems.filter((item) => item.processingDurationSeconds != null);
    const avgProcessingTime =
      timingRecords.length > 0
        ? Math.round(
          timingRecords.reduce((sum, item) => sum + (item.processingDurationSeconds ?? 0), 0) /
          timingRecords.length
        )
        : null;

    return { totalCoins, totalRequests, avgProcessingTime };
  }, [allItems]);

  const [tablePage, setTablePage] = useState(0);
  const TABLE_PAGE_SIZE = 10;
  const paginatedItems = allItems.slice(tablePage * TABLE_PAGE_SIZE, (tablePage + 1) * TABLE_PAGE_SIZE);
  const totalTablePages = Math.ceil(allItems.length / TABLE_PAGE_SIZE);

  const isFirstLoad = isLoading && !hasInitialized;
  const isBackgroundRefresh = isFetching && hasInitialized;

  return (
    <section className='relative'>
      <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex size-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-inner'>
            <Coins size={18} className='text-amber-400' />
          </div>
          <h2 className='text-lg font-bold tracking-tight text-white/90'>AI Usage</h2>
          {hasInitialized && (
            <span className='ml-2 rounded-md bg-white/5 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500'>
              {allItems.length} RECORDS
            </span>
          )}
          {isBackgroundRefresh && (
            <RotateCw size={14} className='text-slate-500 animate-spin' />
          )}
        </div>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setShowFilter(!showFilter)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] transition-colors',
              showFilter || actionTypeFilter
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white'
            )}
          >
            <Filter className='size-3.5' />
            Filter
            {actionTypeFilter && (
              <span className='flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white'>
                !
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Filter Row ──────────────────────────────────────────────────────── */}
      {showFilter && (
        <div className='mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <div>
              <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>Action Type</label>
              <select
                value={actionTypeFilter}
                onChange={(e) => handleActionTypeChange(e.target.value)}
                className='h-8 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[12px] text-white outline-none focus:border-violet-500/30'
              >
                {ACTION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className='bg-[#13131e]'>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Future: date range, status, provider filters */}
          </div>

          <div className='mt-3 flex items-center gap-2'>
            <button
              type='button'
              onClick={() => {
                handleActionTypeChange('');
                setShowFilter(false);
              }}
              className='h-7 rounded-lg px-3 text-[12px] text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors'
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* ── Summary Metrics ─────────────────────────────────────────────────── */}
      {hasInitialized && allItems.length > 0 && (
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6'>
          <SummaryMetric
            icon={<Coins className='size-4 text-amber-400' />}
            label='Coins Spent'
            value={formatCoins(summary.totalCoins)}
            accent='text-amber-400'
          />
          <SummaryMetric
            icon={<Zap className='size-4 text-indigo-400' />}
            label='Total Requests'
            value={String(summary.totalRequests)}
            accent='text-indigo-400'
          />
          <SummaryMetric
            icon={<Timer className='size-4 text-emerald-400' />}
            label='Avg. Processing'
            value={formatProcessingTime(summary.avgProcessingTime)}
            accent='text-emerald-400'
          />
        </div>
      )}

      {/* ── Chart Placeholder (for future summary API) ──────────────────────── */}
      {/* 
        TODO: When BE provides GET /api/Ai/usage/summary, add a Recharts BarChart here
        showing daily coin spending breakdown by action type.
        
        Import pattern:
        import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
        import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
      */}

      {/* ── Data Table ──────────────────────────────────────────────────────── */}
      <div className='overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.01]'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-white/[0.06]'>
                <th className='px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500'>
                  Type
                </th>
                <th className='px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500'>
                  Model
                </th>
                <th className='px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500'>
                  Coins
                </th>
                <th className='px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500'>
                  Status
                </th>
                <th className='px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500'>
                  <div className='flex items-center gap-1'>
                    <Clock className='size-3' />
                    Time
                  </div>
                </th>
                <th className='px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500'>
                  Date
                </th>
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
                paginatedItems.map((record) => <UsageRow key={record.spendRecordId} record={record} />)
              ) : (
                <tr>
                  <td colSpan={6} className='px-4 py-16 text-center'>
                    <div className='flex flex-col items-center justify-center'>
                      <div className='flex size-12 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/5 text-slate-600 mb-3'>
                        <Coins size={22} />
                      </div>
                      <p className='text-sm font-medium text-slate-400'>No AI usage recorded yet</p>
                      <p className='text-xs text-slate-500 mt-1'>
                        Your AI generation history will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Pagination + Load More ──────────────────────────────────── */}
        {allItems.length > 0 && (
          <div className='flex items-center justify-between border-t border-white/[0.06] px-4 py-3'>
            <div className='flex items-center gap-2'>
              {totalTablePages > 1 && (
                <>
                  <button
                    type='button'
                    disabled={tablePage === 0}
                    onClick={() => setTablePage((p) => p - 1)}
                    className='rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-30 transition-colors'
                  >
                    Prev
                  </button>
                  <span className='text-[11px] font-mono text-slate-500'>
                    {tablePage + 1} / {totalTablePages}
                  </span>
                  <button
                    type='button'
                    disabled={tablePage >= totalTablePages - 1}
                    onClick={() => setTablePage((p) => p + 1)}
                    className='rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-30 transition-colors'
                  >
                    Next
                  </button>
                </>
              )}
            </div>

            {nextCursor && (
              <button
                type='button'
                onClick={loadMore}
                disabled={isLoadingMore}
                className='flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-50 transition-colors'
              >
                {isLoadingMore ? (
                  <RotateCw size={12} className='animate-spin' />
                ) : (
                  <ChevronDown size={12} />
                )}
                Load More
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Error State ─────────────────────────────────────────────────────── */}
      {error && (
        <div className='mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3'>
          <p className='text-xs font-medium text-red-400'>
            Failed to load AI usage history. Please try again.
          </p>
          <button
            type='button'
            onClick={() => refetch()}
            className='mt-2 text-[11px] font-medium text-red-300 underline hover:text-red-200'
          >
            Retry
          </button>
        </div>
      )}
    </section>
  );
}
