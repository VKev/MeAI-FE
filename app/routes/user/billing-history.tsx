import { useState } from 'react';
import {
  Receipt,
  TrendingUp,
  Calendar as CalendarIconLucide,
  CreditCard,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUp,
  ArrowDown,
  CalendarIcon,
  RotateCwIcon
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchTransactionsClient } from '@/services/client/transaction.client';
import type { Transaction } from '@/models/transaction.model';
import { formatCurrency, formatDate, formatDateToLocaleString } from '@/utils';
import { format } from 'date-fns';

// Map of UI status categories (4 states) and their styles
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  succeeded: {
    label: 'Succeeded',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-sky-500/15 text-sky-300 border-sky-500/30'
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-500/15 text-red-400 border-red-500/30'
  },
  refunded: {
    label: 'Refunded',
    className: 'bg-slate-500/15 text-slate-400 border-slate-500/30'
  }
};

const DOT_COLOR: Record<string, string> = {
  succeeded: 'bg-emerald-400',
  scheduled: 'bg-sky-300',
  failed: 'bg-red-400',
  refunded: 'bg-slate-400'
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

function mapStatusToCategory(status: string | null | undefined): string {
  const normalized = (status || '').toLowerCase();
  if (['succeeded', 'paid', 'active', 'complete'].includes(normalized)) return 'succeeded';
  if (normalized === 'scheduled') return 'scheduled';
  if (['pending', 'incomplete', 'failed'].includes(normalized)) return 'failed';
  if (normalized === 'refunded') return 'refunded';
  return normalized || 'unknown';
}

const ITEMS_PER_PAGE = 10;

function isSuccessfulTransactionStatus(status: string | null | undefined) {
  return mapStatusToCategory(status) === 'succeeded';
}

function StatusBadge({ status }: { status: string }) {
  const key = mapStatusToCategory(status);
  const config = STATUS_CONFIG[key] ?? {
    label: status,
    className: 'bg-slate-500/15 text-slate-400 border-slate-500/30'
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      <span className={`size-1.5 rounded-full ${DOT_COLOR[key] ?? 'bg-slate-400'}`} />
      {config.label}
    </span>
  );
}

type SortKey = 'type' | 'date' | 'amount' | 'status';
type SortDir = 'asc' | 'desc';

function SortableHeader({
  label,
  sortKey,
  currentSort,
  onSort
}: {
  label: string;
  sortKey: SortKey;
  currentSort: { key: SortKey; dir: SortDir } | null;
  onSort: (key: SortKey) => void;
}) {
  const active = currentSort?.key === sortKey;
  return (
    <th className='px-4 py-3 text-left'>
      <button
        type='button'
        onClick={() => onSort(sortKey)}
        className='flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-500 hover:text-slate-300'
      >
        {label}
        <span className='flex flex-col'>
          <ArrowUp
            className={`size-2.5 ${active && currentSort?.dir === 'asc' ? 'text-violet-400' : 'text-slate-600'}`}
          />
          <ArrowDown
            className={`-mt-0.5 size-2.5 ${active && currentSort?.dir === 'desc' ? 'text-violet-400' : 'text-slate-600'}`}
          />
        </span>
      </button>
    </th>
  );
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

function SummaryCard({
  icon,
  label,
  value,
  subtext
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className='rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%),linear-gradient(180deg,rgba(11,13,24,0.92)_0%,rgba(7,9,16,0.98)_100%)] p-5 transition-all duration-300 hover:border-white/15 hover:shadow-[0_20px_40px_rgba(0,0,0,0.45)]'>
      <div className='flex items-center gap-3 mb-3'>
        <div className='flex size-9 items-center justify-center rounded-lg bg-violet-500/15'>{icon}</div>
        <span className='text-sm text-slate-400'>{label}</span>
      </div>
      <p className='text-2xl font-bold text-white'>{value}</p>
      {subtext && <p className='mt-1 text-xs text-slate-500'>{subtext}</p>}
    </div>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const displayType =
    transaction.relation?.subscription?.name || transaction.transactionType?.replace(/([A-Z])/g, ' $1').trim() || '—';

  return (
    <tr className='border-b border-white/10 transition-colors hover:bg-white/2'>
      <td className='px-4 py-4'>
        <div>
          <p className='text-sm font-medium text-white'>{displayType}</p>
          <p className='text-xs text-slate-500 mt-0.5'>{transaction.id.slice(0, 8)}...</p>
        </div>
      </td>
      <td className='px-4 py-4 text-sm text-slate-300'>
        {transaction.createdAt ? formatDate(transaction.createdAt) : '—'}
      </td>
      <td className='px-4 py-4'>
        <span className='text-sm font-semibold text-white'>
          {transaction.cost != null ? formatCurrency(transaction.cost) : '—'}
        </span>
      </td>
      <td className='px-4 py-4'>
        {transaction.status ? (
          <StatusBadge status={transaction.status} />
        ) : (
          <span className='text-sm text-slate-500'>—</span>
        )}
      </td>
      <td className='px-4 py-4'>
        {transaction.paymentMethod ? (
          <div className='flex items-center gap-2 text-sm text-slate-400'>
            <CreditCard className='size-3.5' />
            <span>{transaction.paymentMethod}</span>
          </div>
        ) : (
          <span className='text-sm text-slate-500'>—</span>
        )}
      </td>
    </tr>
  );
}

function TransactionRowSkeleton() {
  return (
    <tr className='border-b border-white/10'>
      <td className='px-4 py-4'>
        <div className='space-y-1.5'>
          <div className='h-4 w-24 animate-pulse rounded bg-white/[0.05]' />
          <div className='h-3 w-16 animate-pulse rounded bg-white/[0.05]' />
        </div>
      </td>
      <td className='px-4 py-4'>
        <div className='h-4 w-24 animate-pulse rounded bg-white/[0.05]' />
      </td>
      <td className='px-4 py-4'>
        <div className='h-4 w-20 animate-pulse rounded bg-white/[0.05]' />
      </td>
      <td className='px-4 py-4'>
        <div className='h-6 w-24 animate-pulse rounded-full bg-white/[0.05]' />
      </td>
      <td className='px-4 py-4'>
        <div className='h-4 w-20 animate-pulse rounded bg-white/[0.05]' />
      </td>
    </tr>
  );
}

function TransactionTableSkeleton() {
  return (
    <>
      {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
        <TransactionRowSkeleton key={`skeleton-${index}`} />
      ))}
    </>
  );
}

export default function BillingHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const [appliedFilterStatus, setAppliedFilterStatus] = useState<string>('all');
  const [appliedDateFrom, setAppliedDateFrom] = useState<Date | undefined>();
  const [appliedDateTo, setAppliedDateTo] = useState<Date | undefined>();

  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>({ key: 'date', dir: 'desc' });

  const resetFilters = () => {
    setFilterStatus('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setAppliedFilterStatus('all');
    setAppliedDateFrom(undefined);
    setAppliedDateTo(undefined);
    setSearchQuery('');
    setCurrentPage(1);
    setShowFilter(false);
  };

  const applyFilters = () => {
    setAppliedFilterStatus(filterStatus);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setCurrentPage(1);
    setShowFilter(false);
  };

  const handleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev?.key === key) return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
      return { key, dir: 'asc' };
    });
  };

  const { data, error, refetch, isFetching } = useQuery({
    queryKey: ['user-transactions'],
    queryFn: () => fetchTransactionsClient()
  });

  const transactions = data?.value ?? [];

  const filteredTransactions = transactions.filter((t) => {
    const typeStr = t.relation?.subscription?.name || t.transactionType || '';
    const matchesSearch =
      typeStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.paymentMethod ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const txnCategory = mapStatusToCategory(t.status);
    const matchesStatus = appliedFilterStatus === 'all' || txnCategory === appliedFilterStatus;

    const tDate = t.createdAt ? new Date(t.createdAt).getTime() : 0;
    const fromTime = appliedDateFrom ? appliedDateFrom.getTime() : 0;
    const toTime = appliedDateTo ? appliedDateTo.getTime() + 86400000 : Infinity;
    const matchesDate = (!appliedDateFrom || tDate >= fromTime) && (!appliedDateTo || tDate <= toTime);

    return matchesSearch && matchesStatus && matchesDate;
  });

  if (sort) {
    filteredTransactions.sort((a, b) => {
      let cmp = 0;
      switch (sort.key) {
        case 'type':
          const aName = a.relation?.subscription?.name || a.transactionType || '';
          const bName = b.relation?.subscription?.name || b.transactionType || '';
          cmp = aName.localeCompare(bName);
          break;
        case 'amount':
          cmp = (a.cost ?? 0) - (b.cost ?? 0);
          break;
        case 'status':
          const aCat = mapStatusToCategory(a.status);
          const bCat = mapStatusToCategory(b.status);
          const aStatus = STATUS_CONFIG[aCat]?.label || a.status || '';
          const bStatus = STATUS_CONFIG[bCat]?.label || b.status || '';
          cmp = aStatus.localeCompare(bStatus);
          break;
        case 'date':
          cmp =
            (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          break;
      }
      return sort.dir === 'desc' ? -cmp : cmp;
    });
  }

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalSpent = transactions
    .filter((t) => isSuccessfulTransactionStatus(t.status))
    .reduce((sum, t) => sum + (t.cost ?? 0), 0);

  const totalSucceeded = transactions.filter((t) => isSuccessfulTransactionStatus(t.status)).length;

  const lastPayment = transactions
    .filter((t) => isSuccessfulTransactionStatus(t.status))
    .sort(
      (a, b) =>
        (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)
    )[0];

  const hasActiveFilters =
    appliedFilterStatus !== 'all' || appliedDateFrom !== undefined || appliedDateTo !== undefined || searchQuery !== '';

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className='min-h-screen py-8 px-6'>
      <section className='mb-10 flex items-center justify-between overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8'>
        <div className='flex items-center gap-4'>
          <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'>
            <Receipt className='h-7 w-7' />
          </div>

          <div className='space-y-1'>
            <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Transaction History</h1>
            <p className='text-sm leading-relaxed text-slate-400'>View your payment transaction records.</p>
          </div>
        </div>
        <Button
          variant='outline'
          size={'lg'}
          className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'
          onClick={() => refetch()}
        >
          <RotateCwIcon className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
          Sync Now
        </Button>
      </section>

      {error && (
        <div className='mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center'>
          Failed to load transactions. Please try again later.
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
        <SummaryCard
          icon={<TrendingUp className='size-4 text-violet-400' />}
          label='Total Spent'
          value={formatCurrency(totalSpent)}
          subtext={`${totalSucceeded} successful payments`}
        />
        <SummaryCard
          icon={<Receipt className='size-4 text-violet-400' />}
          label='Total Transactions'
          value={String(transactions.length)}
          subtext='All time'
        />
        <SummaryCard
          icon={<CalendarIconLucide className='size-4 text-violet-400' />}
          label='Last Payment'
          value={lastPayment?.createdAt ? formatDateToLocaleString(lastPayment.createdAt) : 'N/A'}
          subtext={
            lastPayment?.relation?.subscription?.name ||
            lastPayment?.transactionType?.replace(/([A-Z])/g, ' $1').trim() ||
            ''
          }
        />
      </div>

      <div className='rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] overflow-hidden'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-white/12'>
          <div className='relative w-full sm:w-72'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500' />
            <Input
              placeholder='Search transactions...'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className='pl-9 bg-neutral-900/50 border-neutral-700 text-white placeholder:text-slate-500 h-9'
            />
          </div>
          <div className='flex items-center gap-2'>
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
        </div>

        {showFilter && (
          <div className='border-b border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-4'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {/* Status */}
              <div>
                <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                  }}
                  className='h-8 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[12px] text-white outline-none focus:border-violet-500/30'
                >
                  <option value='all' className='bg-[#13131e]'>
                    All Status
                  </option>
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s} className='bg-[#13131e]'>
                      {STATUS_CONFIG[s].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>From</label>
                <DateInput
                  value={dateFrom}
                  onChange={(d) => {
                    setDateFrom(d);
                  }}
                  placeholder='DD/MM/YYYY'
                />
              </div>

              {/* Date To */}
              <div>
                <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>To</label>
                <DateInput
                  value={dateTo}
                  onChange={(d) => {
                    setDateTo(d);
                  }}
                  placeholder='DD/MM/YYYY'
                />
              </div>
            </div>

            <div className='mt-4 flex items-center gap-2'>
              <Button
                variant='ghost'
                size='sm'
                onClick={resetFilters}
                className='h-7 text-[12px] text-slate-400 hover:text-white'
              >
                Reset
              </Button>
              <Button
                size='sm'
                onClick={applyFilters}
                className='h-7 bg-violet-600 text-[12px] text-white hover:bg-violet-700'
              >
                Apply
              </Button>
            </div>
          </div>
        )}

        {isFetching ? (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-neutral-700/50'>
                  <SortableHeader label='Type' sortKey='type' currentSort={sort} onSort={handleSort} />
                  <SortableHeader label='Date' sortKey='date' currentSort={sort} onSort={handleSort} />
                  <SortableHeader label='Amount' sortKey='amount' currentSort={sort} onSort={handleSort} />
                  <SortableHeader label='Status' sortKey='status' currentSort={sort} onSort={handleSort} />
                  <th className='px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody>
                <TransactionTableSkeleton />
              </tbody>
            </table>
          </div>
        ) : paginatedTransactions.length > 0 ? (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-neutral-700/50'>
                  <SortableHeader label='Type' sortKey='type' currentSort={sort} onSort={handleSort} />
                  <SortableHeader label='Date' sortKey='date' currentSort={sort} onSort={handleSort} />
                  <SortableHeader label='Amount' sortKey='amount' currentSort={sort} onSort={handleSort} />
                  <SortableHeader label='Status' sortKey='status' currentSort={sort} onSort={handleSort} />
                  <th className='px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <div className='flex size-14 items-center justify-center rounded-full border border-white/12 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] mb-4'>
              <Receipt className='h-7 w-7' />
            </div>

            <p className='text-sm font-medium text-slate-400'>No transactions found</p>
            <p className='text-xs text-slate-500 mt-1'>
              {searchQuery || hasActiveFilters
                ? 'Try adjusting your search or filter.'
                : "You haven't made any transactions yet."}
            </p>
          </div>
        )}

        {totalPages > 0 && (
          <div className='flex items-center justify-center border-t border-white/[0.06] px-5 py-4'>
            <div className='flex items-center gap-1.5'>
              <button
                type='button'
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className='flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-30 transition-colors'
              >
                <ChevronLeft className='size-4' />
              </button>
              {getPageNumbers().map((p, i) => (
                <button
                  key={`${p}-${i}`}
                  type='button'
                  disabled={p === '...'}
                  onClick={() => typeof p === 'number' && setCurrentPage(p)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-semibold transition-all ${
                    p === '...'
                      ? 'text-slate-500 cursor-default'
                      : currentPage === p
                        ? 'bg-[#7e3af2] text-white ring-[4px] ring-white/[0.08]'
                        : 'text-[#60a5fa] hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type='button'
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className='flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-30 transition-colors'
              >
                <ChevronRight className='size-4' />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
