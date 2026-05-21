import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { type LoaderFunctionArgs } from 'react-router';
import {
  Coins,
  Zap,
  Image as ImageIcon,
  Video,
  MessageSquare,
  Cpu,
  Loader2,
  RotateCw,
  Filter,
  CalendarIcon,
  ChevronDown,
  Sparkles,
  FileText
} from 'lucide-react';
import { requireUser, hasRole } from '@/services/server/session.server';
import {
  fetchAdminAiUsageHistory,
  fetchAdminAiUsageSummary,
  fetchAdminUsers
} from '@/services/client/admin.client';
import type { AiSpendRecord } from '@/models/ai-usage.model';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (!hasRole(user, 'admin')) {
    throw new Response('Forbidden', { status: 403 });
  }
  return null;
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
  },
  draft_post_generation: {
    label: 'Draft Post',
    icon: FileText,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10'
  },
  improve_post: {
    label: 'Improve Post',
    icon: Sparkles,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10'
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
  },
  pending: {
    label: 'Processing',
    className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 before:content-[""] before:w-1.5 before:h-1.5 before:rounded-full before:bg-cyan-400 before:animate-[pulse_2s_ease-in-out_infinite]'
  }
};

const ALL_ACTION_TYPES = ['image_generation', 'video_generation', 'caption_generation', 'draft_post_generation', 'improve_post'];
const ALL_STATUSES = ['debited', 'refunded', 'pending'];

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
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    cleaned = parts[parts.length - 1] || cleaned;
  }
  const lower = cleaned.toLowerCase();
  if (lower.includes('dall-e')) return cleaned.toUpperCase().replace(/-E-/i, '-E ');
  if (lower.startsWith('gpt-')) return 'GPT-' + cleaned.substring(4).replace(/-/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase());
  if (lower.startsWith('claude-')) return 'Claude ' + cleaned.substring(7).replace(/-/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase()).replace(/(\d) (\d)/g, '$1.$2');
  if (lower.startsWith('gemini-')) return 'Gemini ' + cleaned.substring(7).replace(/-/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase()).replace(/(\d) (\d)/g, '$1.$2');
  if (lower.startsWith('llama-')) return 'Llama ' + cleaned.substring(6).replace(/-/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase());
  return cleaned.replace(/[-_]/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase());
}

function getProviderDetails(model: string, providerStr?: string | null): string {
  const normalizedProvider = (providerStr || '').toLowerCase();
  if (normalizedProvider === 'kie' && model && model.includes('/')) {
    const parts = model.split('/');
    return parts[0].replace(/[-_]/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase());
  }
  const combined = `${normalizedProvider} ${model || ''}`.toLowerCase();
  if (combined.includes('openai') || combined.includes('gpt')) return 'OpenAI';
  if (combined.includes('anthropic') || combined.includes('claude')) return 'Claude';
  if (combined.includes('google') || combined.includes('gemini')) return 'Gemini';
  if (combined.includes('meta') || combined.includes('llama')) return 'Meta Llama';
  if (combined.includes('stability') || combined.includes('sdxl')) return 'Stability AI';
  if ((providerStr || '').toLowerCase() === 'openrouter') return 'OpenRouter';
  return (providerStr || 'AI Provider').replace(/[-_]/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase());
}

function DateInput({
  value,
  onChange,
  placeholder
}: {
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          className='flex h-8 w-full items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[12px] text-slate-400 hover:border-white/[0.12]'
        >
          <CalendarIcon className='size-3.5 text-slate-500' />
          <span className={value ? 'text-white' : ''}>{value ? format(value, 'dd/MM/yyyy') : placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start' sideOffset={4}>
        <Calendar
          mode='single'
          selected={value}
          onSelect={(d) => {
            onChange(d);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

const PAGE_SIZE = 20;

export default function AdminAiSpending() {
  const { data: usersRes } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => fetchAdminUsers({ includeDeleted: true }),
    staleTime: 5 * 60_000,
  });

  const users = usersRes?.value || [];
  const usersMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const u of users) {
      map.set(u.id, u);
    }
    return map;
  }, [users]);

  // --- Filter States ---
  const [showFilter, setShowFilter] = useState(false);
  const [filterUserId, setFilterUserId] = useState<string>('all');
  const [filterActionType, setFilterActionType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterModel, setFilterModel] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  const resetFilters = () => {
    setFilterUserId('all');
    setFilterActionType('all');
    setFilterStatus('all');
    setFilterProvider('all');
    setFilterModel('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearchQuery('');
  };

  const hasActiveFilters =
    filterUserId !== 'all' ||
    filterActionType !== 'all' ||
    filterStatus !== 'all' ||
    filterProvider !== 'all' ||
    filterModel !== 'all' ||
    dateFrom ||
    dateTo ||
    searchQuery;

  const queryParams = useMemo(() => ({
    limit: PAGE_SIZE,
    ...(filterUserId !== 'all' ? { userId: filterUserId } : {}),
    ...(filterActionType !== 'all' ? { actionType: filterActionType } : {}),
    ...(filterStatus !== 'all' ? { status: filterStatus } : {}),
    ...(filterProvider !== 'all' ? { provider: filterProvider } : {}),
    ...(filterModel !== 'all' ? { model: filterModel } : {}),
    ...(dateFrom ? { fromUtc: dateFrom.toISOString() } : {}),
    ...(dateTo ? { toUtc: new Date(dateTo.getTime() + 86400000 - 1).toISOString() } : {})
  }), [filterUserId, filterActionType, filterStatus, filterProvider, filterModel, dateFrom, dateTo]);


  // --- Cursor Pagination States ---
  const [allItems, setAllItems] = useState<AiSpendRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<{ createdAt: string; id: string } | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data: summaryRes, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['admin', 'ai-summary'],
    queryFn: () => fetchAdminAiUsageSummary(),
    staleTime: 5 * 60_000,
  });

  const summaryData = summaryRes?.isSuccess ? summaryRes.value : null;

  const { data: historyRes, isLoading: isLoadingHistory, isFetching } = useQuery({
    queryKey: ['admin', 'ai-history', queryParams],
    queryFn: () => fetchAdminAiUsageHistory(queryParams),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    placeholderData: keepPreviousData
  });

  useEffect(() => {
    if (historyRes?.isSuccess && historyRes.value) {
      setAllItems(historyRes.value.items);
      const hasMore = historyRes.value.items.length >= PAGE_SIZE;
      setNextCursor(
        hasMore && historyRes.value.nextCursorCreatedAt && historyRes.value.nextCursorId
          ? { createdAt: historyRes.value.nextCursorCreatedAt, id: historyRes.value.nextCursorId }
          : null
      );
      setHasInitialized(true);
    }
  }, [historyRes]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const response = await fetchAdminAiUsageHistory({
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

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const query = searchQuery.trim().toLowerCase();
    return allItems.filter((record) => {
      const user = usersMap.get(record.userId);
      const displayName = (user?.fullName || user?.username || 'Unknown User').toLowerCase();
      const email = (user?.email || '').toLowerCase();
      const model = (record.model || '').toLowerCase();
      const provider = (record.provider || '').toLowerCase();
      return (
        displayName.includes(query) ||
        email.includes(query) ||
        record.userId.toLowerCase().includes(query) ||
        model.includes(query) ||
        provider.includes(query)
      );
    });
  }, [allItems, searchQuery, usersMap]);

  const uniqueProviders = useMemo(() => {
    const set = new Set<string>();
    if (summaryData?.externalProviderCredits) {
      summaryData.externalProviderCredits.forEach((c) => {
        if (c.provider) set.add(c.provider);
      });
    }
    allItems.forEach((item) => {
      if (item.provider) set.add(item.provider);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [summaryData, allItems]);

  const uniqueModels = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    const seen = new Set<string>();

    if (summaryData?.spendByModel) {
      summaryData.spendByModel.forEach((item) => {
        if (item.key && !seen.has(item.key)) {
          seen.add(item.key);
          list.push({
            key: item.key,
            label: item.label || formatModelName(item.key)
          });
        }
      });
    }

    allItems.forEach((item) => {
      if (item.model && !seen.has(item.model)) {
        seen.add(item.model);
        list.push({
          key: item.model,
          label: formatModelName(item.model)
        });
      }
    });

    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [summaryData, allItems]);

  const formatProviderName = useCallback((provider: string): string => {
    if (!provider) return '';
    const lower = provider.toLowerCase();
    if (lower === 'openai') return 'OpenAI';
    if (lower === 'openrouter') return 'OpenRouter';
    if (lower === 'kie') return 'KIE';
    return provider.replace(/[-_]/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase());
  }, []);

  const totalItem = summaryData?.totals?.[0];
  const netCoins = totalItem?.totalCoins || 0;
  const refundedCoins = totalItem?.refundedCoins || 0;
  const totalRequests = summaryData?.spendByAction?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  if (isLoadingSummary) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-violet-500" />
        <p className="text-sm text-slate-400">Loading AI spending data...</p>
      </div>
    );
  }

  const isFirstLoad = isLoadingHistory && !hasInitialized;
  const isBackgroundRefresh = isFetching && hasInitialized;

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <h1 className='text-xl font-bold text-white'>AI Spending</h1>
          {isBackgroundRefresh && (
            <RotateCw size={14} className='text-slate-500 animate-spin ml-1' />
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        {/* Total Coins Spent Card */}
        <div className='relative overflow-hidden rounded-xl border border-amber-500/10 bg-[#13131e] p-5 flex flex-col justify-between min-h-[105px] shadow-sm'>
          <div className='flex items-center gap-2.5'>
            <div className='flex size-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20'>
              <Coins className='size-4 text-amber-400' />
            </div>
            <p className='text-[13px] font-medium text-slate-400'>Total Coins Spent</p>
          </div>
          <div className='mt-4 flex items-baseline gap-2'>
            <p className='text-[26px] font-bold tracking-tight text-white font-mono'>{formatCoins(netCoins)}</p>
            <span className='text-[12px] text-slate-500'>coins</span>
            {totalItem?.estimatedUsd !== undefined && (
              <span className='text-[13px] text-emerald-400/90 font-medium ml-1' title='Estimated USD cost of spent coins'>
                (≈ ${totalItem.estimatedUsd.toFixed(2)})
              </span>
            )}
          </div>
        </div>

        {/* Total Requests Card */}
        <div className='relative overflow-hidden rounded-xl border border-violet-500/10 bg-[#13131e] p-5 flex flex-col justify-between min-h-[105px] shadow-sm'>
          <div className='flex items-center gap-2.5'>
            <div className='flex size-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20'>
              <Zap className='size-4 text-violet-400' />
            </div>
            <p className='text-[13px] font-medium text-slate-400'>Total Requests</p>
          </div>
          <div className='mt-4 flex items-baseline gap-2'>
            <p className='text-[26px] font-bold tracking-tight text-white font-mono'>{totalRequests}</p>
            <span className='text-[12px] text-slate-500'>requests</span>
          </div>
        </div>

        {/* Refunded Card */}
        <div className='relative overflow-hidden rounded-xl border border-orange-500/10 bg-[#13131e] p-5 flex flex-col justify-between min-h-[105px] shadow-sm'>
          <div className='flex items-center gap-2.5'>
            <div className='flex size-8 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20'>
              <RotateCw className='size-4 text-orange-400' />
            </div>
            <p className='text-[13px] font-medium text-slate-400'>Refunded</p>
          </div>
          <div className='mt-4 flex items-baseline gap-2'>
            <p className='text-[26px] font-bold tracking-tight text-orange-500/80 font-mono'>{formatCoins(refundedCoins)}</p>
            <span className='text-[12px] text-slate-500'>coins</span>
            {refundedCoins > 0 && summaryData?.coinUsdRate !== undefined && (
              <span className='text-[13px] text-orange-400/80 font-medium ml-1' title='Estimated USD value of refunded coins'>
                (≈ ${(refundedCoins * summaryData.coinUsdRate).toFixed(2)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* External Providers Balance / Credits */}
      {summaryData?.externalProviderCredits && summaryData.externalProviderCredits.length > 0 && (
        <div className='rounded-xl border border-white/[0.06] bg-[#13131e] p-4 shadow-sm'>
          <div className='text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5'>External Provider Status</div>
          <div className='flex flex-wrap gap-3'>
            {summaryData.externalProviderCredits.map((cred) => (
              <div key={cred.provider} className='flex items-center gap-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] px-3 py-1.5 shadow-inner' title={cred.message || undefined}>
                <div className={cn("size-2 rounded-full", cred.isAvailable ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]")} />
                <div className='flex flex-col gap-0.5'>
                  <span className='text-[12px] font-bold text-white/90 leading-none'>{cred.provider}</span>
                  <span className='text-[10px] text-slate-400 font-mono leading-none'>
                    {cred.remainingCredits != null 
                      ? `${cred.remainingCredits.toLocaleString('en')} ${cred.currency || 'USD'}`
                      : 'Available'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='overflow-hidden rounded-xl border border-white/[0.06] bg-[#13131e]'>
        <div className='flex items-center justify-between border-b border-white/[0.06] px-5 py-3'>
          <div className='flex items-center gap-4'>
             <span className='text-[14px] font-semibold text-white'>Usage Log</span>
             <div className='relative w-48 sm:w-60'>
               <input
                 type='text'
                 placeholder='Search user, model, provider...'
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className='h-8 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-[12px] text-white placeholder-slate-500 outline-none focus:border-violet-500/30'
               />
               {searchQuery && (
                 <button
                   type='button'
                   onClick={() => setSearchQuery('')}
                   className='absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-[11px]'
                 >
                   ✕
                 </button>
               )}
             </div>
          </div>
          <button
            type='button'
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] transition-colors ${showFilter || hasActiveFilters ? 'border-violet-500/30 bg-violet-500/10 text-violet-400' : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white'}`}
          >
            <Filter className='size-3.5' />
            Filter
            {hasActiveFilters && (
              <span className='flex size-4 items-center justify-center rounded-full bg-violet-500 text-[9px] font-bold text-white'>
                !
              </span>
            )}
          </button>
        </div>

        {showFilter && (
          <div className='border-b border-white/[0.06] bg-white/[0.01] px-5 py-4'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
              <div>
                <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>User</label>
                <select
                  value={filterUserId}
                  onChange={(e) => setFilterUserId(e.target.value)}
                  className='h-8 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[12px] text-white outline-none focus:border-violet-500/30'
                >
                  <option value='all' className='bg-[#13131e]'>All Users</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id} className='bg-[#13131e]'>
                      {u.fullName || u.username || u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>Action Type</label>
                <select
                  value={filterActionType}
                  onChange={(e) => setFilterActionType(e.target.value)}
                  className='h-8 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[12px] text-white outline-none focus:border-violet-500/30'
                >
                  <option value='all' className='bg-[#13131e]'>All Actions</option>
                  {ALL_ACTION_TYPES.map((a) => (
                    <option key={a} value={a} className='bg-[#13131e]'>
                      {ACTION_TYPE_CONFIG[a]?.label || a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className='h-8 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[12px] text-white outline-none focus:border-violet-500/30'
                >
                  <option value='all' className='bg-[#13131e]'>All Status</option>
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s} className='bg-[#13131e] uppercase'>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>Provider</label>
                <select
                  value={filterProvider}
                  onChange={(e) => setFilterProvider(e.target.value)}
                  className='h-8 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[12px] text-white outline-none focus:border-violet-500/30'
                >
                  <option value='all' className='bg-[#13131e]'>All Providers</option>
                  {uniqueProviders.map((p) => (
                    <option key={p} value={p} className='bg-[#13131e]'>
                      {formatProviderName(p)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>Model</label>
                <select
                  value={filterModel}
                  onChange={(e) => setFilterModel(e.target.value)}
                  className='h-8 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[12px] text-white outline-none focus:border-violet-500/30'
                >
                  <option value='all' className='bg-[#13131e]'>All Models</option>
                  {uniqueModels.map((m) => (
                    <option key={m.key} value={m.key} className='bg-[#13131e]'>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>From</label>
                <DateInput value={dateFrom} onChange={setDateFrom} placeholder='MM/DD/YYYY' />
              </div>

              <div>
                <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>To</label>
                <DateInput value={dateTo} onChange={setDateTo} placeholder='MM/DD/YYYY' />
              </div>
            </div>

            <div className='mt-4 flex items-center gap-2'>
              <Button
                variant='ghost'
                size='sm'
                onClick={resetFilters}
                className='h-7 text-[12px] text-slate-400 hover:text-white hover:bg-white/[0.04]'
              >
                Reset Filters
              </Button>
            </div>
          </div>
        )}
        
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-white/[0.04] bg-white/[0.01]'>
                <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Record ID</th>
                <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>User</th>
                <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Action & Model</th>
                <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Coins</th>
                <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Status</th>
                <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Processing</th>
                <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Date</th>
              </tr>
            </thead>
            <tbody>
              {isFirstLoad ? (
                 <tr>
                  <td colSpan={7} className='py-12 text-center text-slate-500'>
                    <Loader2 className='mx-auto size-6 animate-spin text-violet-500 mb-2' />
                    Loading records...
                  </td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((record: AiSpendRecord) => {
                  const user = usersMap.get(record.userId);
                  const displayName = user?.fullName || user?.username || 'Unknown User';
                  
                  const actionConfig = ACTION_TYPE_CONFIG[record.actionType] ?? {
                    label: record.actionType.replace(/_/g, ' '),
                    icon: Cpu,
                    color: 'text-slate-400',
                    bgColor: 'bg-slate-500/10'
                  };
                  const ActionIcon = actionConfig.icon;
                  
                  const statusConfig = STATUS_CONFIG[record.status.toLowerCase()] ?? {
                    label: record.status,
                    className: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  };

                  return (
                    <tr key={record.spendRecordId} className='border-b border-white/[0.03] transition-colors last:border-0 hover:bg-white/[0.015]'>
                      <td className='px-5 py-3'>
                         <span className='text-[12px] font-medium text-violet-400 font-mono'>{record.spendRecordId.slice(0, 8)}...</span>
                      </td>
                      <td className='px-5 py-3'>
                        <div className='flex items-center gap-3'>
                          {user?.avatarPresignedUrl ? (
                            <img src={user.avatarPresignedUrl} alt={displayName} className='size-8 shrink-0 rounded-full object-cover' />
                          ) : (
                            <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[11px] font-bold text-violet-300'>
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <p className='text-[13px] font-medium text-white'>{displayName}</p>
                            <p className='text-[11px] text-slate-500'>{user?.email || record.userId.slice(0,10)}</p>
                          </div>
                        </div>
                      </td>
                      <td className='px-5 py-3'>
                        <div className="flex items-center gap-2.5">
                          <div className={cn('flex size-7 shrink-0 items-center justify-center rounded-md', actionConfig.bgColor)}>
                            <ActionIcon className={cn('size-3.5', actionConfig.color)} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12px] font-medium text-white/90 leading-tight">{getProviderDetails(record.model, record.provider)}</span>
                            <span className="text-[10px] text-slate-500 font-mono leading-tight mt-0.5">{formatModelName(record.model)}</span>
                          </div>
                        </div>
                      </td>
                      <td className='px-5 py-3'>
                        <span className='font-mono text-[13px] font-bold text-amber-400'>{formatCoins(record.totalCoins)}</span>
                      </td>
                      <td className='px-5 py-3'>
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusConfig.className)}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className='px-5 py-3'>
                        <span className='text-[12px] text-slate-400 font-mono'>
                          {record.processingDurationSeconds != null ? `${record.processingDurationSeconds}s` : '—'}
                        </span>
                      </td>
                      <td className='px-5 py-3'>
                         <div className="flex flex-col">
                           <span className='text-[12px] text-slate-300'>{formatRelativeDate(record.createdAt)}</span>
                           <span className='text-[10px] text-slate-500'>{formatFullDate(record.createdAt)}</span>
                         </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className='py-12 text-center'>
                    <div className='flex flex-col items-center justify-center'>
                      <div className='flex size-12 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 text-slate-600 mb-3'>
                        <Cpu size={22} />
                      </div>
                      <p className='text-[13px] font-semibold text-slate-400'>No records matched your filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Load More Pagination */}
        {allItems.length > 0 && nextCursor && (
          <div className='flex items-center justify-center border-t border-white/[0.06] px-5 py-4'>
            <button
              type='button'
              onClick={loadMore}
              disabled={isLoadingMore}
              className='flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/10 px-5 py-2 text-[12px] font-bold text-violet-400 hover:bg-violet-500/20 disabled:opacity-50 transition-all shadow-sm'
            >
              {isLoadingMore ? (
                <RotateCw size={14} className='animate-spin' />
              ) : (
                <ChevronDown size={14} />
              )}
              Load More History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
