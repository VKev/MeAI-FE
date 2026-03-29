import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Filter, CreditCard, MoreVertical, ArrowUp, ArrowDown, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { requireUser, hasRole } from '@/services/server/session.server';
import { fetchAdminTransactions } from '@/services/server/admin.server';
import type { AdminTransaction } from '@/models/admin.model';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (!hasRole(user, 'admin')) {
    throw new Response('Forbidden', { status: 403 });
  }

  try {
    const data = await fetchAdminTransactions(request);
    return { transactions: data.value || [], error: null };
  } catch (error: any) {
    console.error('[Admin Transactions] fetch error:', error?.response?.data || error.message);
    return { transactions: [], error: 'Failed to fetch transactions' };
  }
}

const ITEMS_PER_PAGE = 8;
const ALL_PLANS = ['Subscription 10000', 'Subscription 50000', 'Subscription 100000', 'Subscription 500000', 'Subscription 2000000'];
const ALL_STATUSES = ['incomplete', 'succeeded', 'paid', 'active', 'complete'];

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  succeeded: { label: 'Paid', cls: 'bg-emerald-500/10 text-emerald-400' },
  paid: { label: 'Paid', cls: 'bg-emerald-500/10 text-emerald-400' },
  active: { label: 'Paid', cls: 'bg-emerald-500/10 text-emerald-400' },
  complete: { label: 'Paid', cls: 'bg-emerald-500/10 text-emerald-400' },
  incomplete: { label: 'Incomplete', cls: 'bg-amber-500/10 text-amber-400' },
};

const getStatusConfig = (status: string) => STATUS_CONFIG[status.toLowerCase()] || { label: status, cls: 'bg-slate-500/10 text-slate-400' };

const STATUS_ORDER: Record<string, number> = { succeeded: 0, paid: 0, active: 0, complete: 0, incomplete: 1 };

function isSuccessfulTransactionStatus(status: string) {
  const normalized = status.toLowerCase();
  return normalized === 'succeeded' || normalized === 'paid' || normalized === 'active' || normalized === 'complete';
}

type SortKey = 'invoice' | 'customer' | 'plan' | 'amount' | 'status' | 'date';
type SortDir = 'asc' | 'desc';

function SortableHeader({ label, sortKey, currentSort, onSort }: { label: string; sortKey: SortKey; currentSort: { key: SortKey; dir: SortDir } | null; onSort: (key: SortKey) => void }) {
  const active = currentSort?.key === sortKey;
  return (
    <th className='px-4 py-3 text-left'>
      <button type='button' onClick={() => onSort(sortKey)} className='flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-500 hover:text-slate-300'>
        {label}
        <span className='flex flex-col'>
          <ArrowUp className={`size-2.5 ${active && currentSort?.dir === 'asc' ? 'text-violet-400' : 'text-slate-600'}`} />
          <ArrowDown className={`-mt-0.5 size-2.5 ${active && currentSort?.dir === 'desc' ? 'text-violet-400' : 'text-slate-600'}`} />
        </span>
      </button>
    </th>
  );
}

function DateInput({ value, onChange, placeholder }: { value: Date | undefined; onChange: (d: Date | undefined) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type='button' className='flex h-8 w-full items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[12px] text-slate-400 hover:border-white/[0.12]'>
          <CalendarIcon className='size-3.5 text-slate-500' />
          <span className={value ? 'text-white' : ''}>{value ? format(value, 'dd/MM/yyyy') : placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start' sideOffset={4}>
        <Calendar mode='single' selected={value} onSelect={(d) => { onChange(d); setOpen(false); }} />
      </PopoverContent>
    </Popover>
  );
}

function getVisiblePages(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export default function AdminTransactions() {
  const { transactions, error } = useLoaderData<typeof loader>();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);

  const handleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev?.key === key) return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
      return { key, dir: 'asc' };
    });
  };

  const resetFilters = () => {
    setFilterPlan('all');
    setFilterStatus('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  const hasActiveFilters = filterPlan !== 'all' || filterStatus !== 'all' || dateFrom || dateTo;

  const processed = useMemo(() => {
    let result = transactions.filter((t) => {
      const q = search.toLowerCase();
      const userName = t.user?.fullName || t.user?.username || 'Unknown';
      const userEmail = t.user?.email || '';
      const planName = t.relation?.subscription?.name || t.transactionType || 'Unknown';
      
      const matchSearch = userName.toLowerCase().includes(q) || userEmail.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
      const matchPlan = filterPlan === 'all' || planName.toLowerCase().includes(filterPlan.toLowerCase());
      const matchStatus = filterStatus === 'all' || t.status.toLowerCase() === filterStatus.toLowerCase();
      const created = new Date(t.createdAt);
      const matchDateFrom = !dateFrom || created >= dateFrom;
      const matchDateTo = !dateTo || created <= new Date(dateTo.getTime() + 86400000 - 1);
      return matchSearch && matchPlan && matchStatus && matchDateFrom && matchDateTo;
    });

    if (sort) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        const aName = a.user?.fullName || a.user?.username || '';
        const bName = b.user?.fullName || b.user?.username || '';
        const aPlan = a.relation?.subscription?.name || a.transactionType || '';
        const bPlan = b.relation?.subscription?.name || b.transactionType || '';

        switch (sort.key) {
          case 'invoice': cmp = a.id.localeCompare(b.id); break;
          case 'customer': cmp = aName.localeCompare(bName); break;
          case 'plan': cmp = aPlan.localeCompare(bPlan); break;
          case 'amount': cmp = a.cost - b.cost; break;
          case 'status': cmp = (STATUS_ORDER[a.status.toLowerCase()] ?? 99) - (STATUS_ORDER[b.status.toLowerCase()] ?? 99); break;
          case 'date': cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
        }
        return sort.dir === 'desc' ? -cmp : cmp;
      });
    }

    return result;
  }, [transactions, search, filterPlan, filterStatus, dateFrom, dateTo, sort]);

  const totalPages = Math.ceil(processed.length / ITEMS_PER_PAGE);
  const paginated = processed.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const succeededTx = transactions.filter((t) => isSuccessfulTransactionStatus(t.status));
  const totalRevenue = succeededTx.reduce((s, t) => s + (t.cost || 0), 0);
  const failedCount = transactions.filter((t) => t.status.toLowerCase() === 'failed' || t.status.toLowerCase() === 'incomplete').length;

  return (
    <div>
      <h1 className='mb-6 text-xl font-bold text-white'>Billing</h1>

      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <div className='rounded-xl border border-white/[0.06] bg-[#13131e] p-5'>
          <p className='mb-3 text-[13px] text-slate-400'>Total Revenue</p>
          <p className='text-[24px] font-bold text-white'>{fmtCurrency(totalRevenue)}</p>
          <p className='mt-1 text-[11px] text-slate-500'>{succeededTx.length} successful transactions</p>
        </div>
        <div className='rounded-xl border border-white/[0.06] bg-[#13131e] p-5'>
          <p className='mb-3 text-[13px] text-slate-400'>Total Transactions</p>
          <p className='text-[24px] font-bold text-white'>{transactions.length}</p>
          <p className='mt-1 text-[11px] text-slate-500'>All statuses</p>
        </div>
        <div className='rounded-xl border border-white/[0.06] bg-[#13131e] p-5'>
          <p className='mb-3 text-[13px] text-slate-400'>Failed Transactions</p>
          <p className='text-[24px] font-bold text-white'>{failedCount}</p>
          <p className='mt-1 text-[11px] text-slate-500'>Requires attention</p>
        </div>
      </div>

      <div className='overflow-hidden rounded-xl border border-white/[0.06] bg-[#13131e]'>
        <div className='flex items-center justify-between border-b border-white/[0.06] px-5 py-3'>
          <div className='relative w-64'>
            <Search className='absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-500' />
            <Input
              placeholder='Search here'
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className='h-8 border-white/[0.08] bg-white/[0.03] pl-9 text-[13px] text-white placeholder:text-slate-500'
            />
          </div>
          <button
            type='button'
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] transition-colors ${showFilter || hasActiveFilters ? 'border-violet-500/30 bg-violet-500/10 text-violet-400' : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white'}`}
          >
            <Filter className='size-3.5' />
            Filter
            {hasActiveFilters && <span className='flex size-4 items-center justify-center rounded-full bg-violet-500 text-[9px] font-bold text-white'>!</span>}
          </button>
        </div>

        {showFilter && (
          <div className='border-b border-white/[0.06] bg-white/[0.01] px-5 py-4'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <div>
                <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>Plan</label>
                <select
                  value={filterPlan}
                  onChange={(e) => { setFilterPlan(e.target.value); setPage(1); }}
                  className='h-8 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[12px] text-white outline-none focus:border-violet-500/30'
                >
                  <option value='all' className='bg-[#13131e]'>All Plans</option>
                  {ALL_PLANS.map((p) => <option key={p} value={p} className='bg-[#13131e]'>{p}</option>)}
                </select>
              </div>

              <div>
                <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                  className='h-8 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[12px] text-white outline-none focus:border-violet-500/30'
                >
                  <option value='all' className='bg-[#13131e]'>All Status</option>
                  {ALL_STATUSES.map((s) => <option key={s} value={s} className='bg-[#13131e]'>{getStatusConfig(s).label}</option>)}
                </select>
              </div>

              <div>
                <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>From</label>
                <DateInput value={dateFrom} onChange={(d) => { setDateFrom(d); setPage(1); }} placeholder='MM/DD/YYYY' />
              </div>

              <div>
                <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>To</label>
                <DateInput value={dateTo} onChange={(d) => { setDateTo(d); setPage(1); }} placeholder='MM/DD/YYYY' />
              </div>
            </div>

            <div className='mt-4 flex items-center gap-2'>
              <Button variant='ghost' size='sm' onClick={resetFilters} className='h-7 text-[12px] text-slate-400 hover:text-white'>
                Reset
              </Button>
              <Button size='sm' onClick={() => setShowFilter(false)} className='h-7 bg-violet-600 text-[12px] text-white hover:bg-violet-700'>
                Apply
              </Button>
            </div>
          </div>
        )}

        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-white/[0.06]'>
                <SortableHeader label='Invoice' sortKey='invoice' currentSort={sort} onSort={handleSort} />
                <SortableHeader label='Customer' sortKey='customer' currentSort={sort} onSort={handleSort} />
                <SortableHeader label='Plan' sortKey='plan' currentSort={sort} onSort={handleSort} />
                <SortableHeader label='Amount' sortKey='amount' currentSort={sort} onSort={handleSort} />
                <SortableHeader label='Status' sortKey='status' currentSort={sort} onSort={handleSort} />
                <th className='px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Payment</th>
                <SortableHeader label='Date' sortKey='date' currentSort={sort} onSort={handleSort} />
                <th className='w-10 px-4 py-3'></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? paginated.map((t) => {
                const displayName = t.user?.fullName || t.user?.username || 'Unknown';
                const planName = t.relation?.subscription?.name || t.transactionType || 'Unknown';
                const statusConfig = getStatusConfig(t.status);
                
                return (
                  <tr key={t.id} className='border-b border-white/[0.03] transition-colors last:border-0 hover:bg-white/[0.015]'>
                    <td className='px-4 py-3'>
                      <span className='text-[12px] font-medium text-violet-400'>{t.id.slice(0, 13)}...</span>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[11px] font-bold text-violet-300'>
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className='text-[13px] font-medium text-white'>{displayName}</p>
                          <p className='text-[11px] text-slate-500'>{t.user?.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-3 text-[12px] text-slate-300'>{planName}</td>
                    <td className='px-4 py-3 text-[13px] font-medium text-white'>{fmtCurrency(t.cost)}</td>
                    <td className='px-4 py-3'>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusConfig.cls}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-1.5 text-[12px] text-slate-400'>
                        <CreditCard className='size-3.5' />
                        <span className='capitalize'>{t.paymentMethod || 'N/A'}</span>
                      </div>
                    </td>
                    <td className='px-4 py-3 text-[12px] text-slate-400'>{format(new Date(t.createdAt), 'dd MMM yyyy')}</td>
                    <td className='px-4 py-3'>
                      <button type='button' className='rounded p-1 text-slate-500 hover:bg-white/[0.05] hover:text-white'>
                        <MoreVertical className='size-4' />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={8} className='py-12 text-center text-[13px] text-slate-500'>No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <div className='flex items-center justify-center border-t border-white/[0.06] px-5 py-4'>
            <div className='flex items-center gap-1.5'>
              <button
                type='button'
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className='flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-30 transition-colors'
              >
                <ChevronLeft className='size-4' />
              </button>
              {getVisiblePages(page, totalPages).map((p, i) => (
                <button
                  key={`${p}-${i}`}
                  type='button'
                  disabled={p === '...'}
                  onClick={() => typeof p === 'number' && setPage(p)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-semibold transition-all ${
                    p === '...'
                      ? 'text-slate-500 cursor-default'
                      : page === p
                        ? 'bg-[#7e3af2] text-white ring-[4px] ring-white/[0.08]'
                        : 'text-[#60a5fa] hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type='button'
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
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
