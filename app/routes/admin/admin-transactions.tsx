import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Filter, CreditCard, MoreVertical, ArrowUp, ArrowDown, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

type TxStatus = 'succeeded' | 'pending' | 'failed' | 'refunded';

type AdminTransaction = {
  id: string;
  userName: string;
  userEmail: string;
  subscriptionName: string;
  amount: number;
  currency: string;
  status: TxStatus;
  paymentMethod: string;
  stripePaymentIntentId: string;
  createdAt: string;
  meAiCoinAwarded: number;
};

const MOCK_TRANSACTIONS: AdminTransaction[] = [
  { id: 'txn_001', userName: 'Nguyễn Văn A', userEmail: 'a.nguyen@email.com', subscriptionName: 'Pro Plan', amount: 199_000, currency: 'VND', status: 'succeeded', paymentMethod: 'Visa •••• 4242', stripePaymentIntentId: 'pi_3Ox1a2b3c4d5e6f', createdAt: '2026-03-13T14:23:00Z', meAiCoinAwarded: 500 },
  { id: 'txn_002', userName: 'Trần Thị B', userEmail: 'b.tran@email.com', subscriptionName: 'Pro Plan', amount: 199_000, currency: 'VND', status: 'succeeded', paymentMethod: 'Visa •••• 4242', stripePaymentIntentId: 'pi_2Nw9x8y7z6a5b4', createdAt: '2026-03-12T10:15:00Z', meAiCoinAwarded: 500 },
  { id: 'txn_003', userName: 'Lê Văn C', userEmail: 'c.le@email.com', subscriptionName: 'Starter Plan', amount: 99_000, currency: 'VND', status: 'succeeded', paymentMethod: 'Mastercard •••• 8888', stripePaymentIntentId: 'pi_1Mv8w7x6y5z4a3', createdAt: '2026-03-10T08:30:00Z', meAiCoinAwarded: 200 },
  { id: 'txn_004', userName: 'Phạm Thị D', userEmail: 'd.pham@email.com', subscriptionName: 'Pro Plan', amount: 199_000, currency: 'VND', status: 'refunded', paymentMethod: 'Visa •••• 4242', stripePaymentIntentId: 'pi_0Lu7v6w5x4y3z2', createdAt: '2026-03-08T16:45:00Z', meAiCoinAwarded: 0 },
  { id: 'txn_005', userName: 'Hoàng Văn E', userEmail: 'e.hoang@email.com', subscriptionName: 'Starter Plan', amount: 99_000, currency: 'VND', status: 'failed', paymentMethod: 'Visa •••• 1234', stripePaymentIntentId: 'pi_9Kt6u5v4w3x2y1', createdAt: '2026-03-06T12:00:00Z', meAiCoinAwarded: 0 },
  { id: 'txn_006', userName: 'Vũ Thị F', userEmail: 'f.vu@email.com', subscriptionName: 'Pro Plan', amount: 199_000, currency: 'VND', status: 'succeeded', paymentMethod: 'Visa •••• 5678', stripePaymentIntentId: 'pi_8Js5t4u3v2w1x0', createdAt: '2026-03-04T09:10:00Z', meAiCoinAwarded: 500 },
  { id: 'txn_007', userName: 'Đặng Văn G', userEmail: 'g.dang@email.com', subscriptionName: 'Starter Plan', amount: 99_000, currency: 'VND', status: 'pending', paymentMethod: 'Mastercard •••• 3333', stripePaymentIntentId: 'pi_7Ir4s3t2u1v0w9', createdAt: '2026-03-02T15:30:00Z', meAiCoinAwarded: 0 },
  { id: 'txn_008', userName: 'Bùi Thị H', userEmail: 'h.bui@email.com', subscriptionName: 'Pro Plan', amount: 199_000, currency: 'VND', status: 'succeeded', paymentMethod: 'Visa •••• 9999', stripePaymentIntentId: 'pi_6Hq3r2s1t0u9v8', createdAt: '2026-02-28T11:00:00Z', meAiCoinAwarded: 500 },
  { id: 'txn_009', userName: 'Đỗ Văn I', userEmail: 'i.do@email.com', subscriptionName: 'Starter Plan', amount: 99_000, currency: 'VND', status: 'succeeded', paymentMethod: 'Visa •••• 7777', stripePaymentIntentId: 'pi_5Gp2q1r0s9t8u7', createdAt: '2026-02-25T14:20:00Z', meAiCoinAwarded: 200 },
  { id: 'txn_010', userName: 'Ngô Thị K', userEmail: 'k.ngo@email.com', subscriptionName: 'Pro Plan', amount: 199_000, currency: 'VND', status: 'failed', paymentMethod: 'Mastercard •••• 1111', stripePaymentIntentId: 'pi_4Fo1p0q9r8s7t6', createdAt: '2026-02-20T08:45:00Z', meAiCoinAwarded: 0 },
];

const ITEMS_PER_PAGE = 8;
const ALL_PLANS = ['Pro Plan', 'Starter Plan'];
const ALL_STATUSES: TxStatus[] = ['succeeded', 'pending', 'failed', 'refunded'];

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const STATUS_CONFIG: Record<TxStatus, { label: string; cls: string }> = {
  succeeded: { label: 'Paid', cls: 'bg-emerald-500/10 text-emerald-400' },
  pending: { label: 'Scheduled', cls: 'bg-amber-500/10 text-amber-400' },
  failed: { label: 'Failed', cls: 'bg-red-500/10 text-red-400' },
  refunded: { label: 'Refunded', cls: 'bg-slate-500/10 text-slate-400' },
};

const STATUS_ORDER: Record<TxStatus, number> = { succeeded: 0, pending: 1, failed: 2, refunded: 3 };

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

export default function AdminTransactions() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  // Filters
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Sort
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
    let result = MOCK_TRANSACTIONS.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch = t.userName.toLowerCase().includes(q) || t.userEmail.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
      const matchPlan = filterPlan === 'all' || t.subscriptionName === filterPlan;
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      const created = new Date(t.createdAt);
      const matchDateFrom = !dateFrom || created >= dateFrom;
      const matchDateTo = !dateTo || created <= new Date(dateTo.getTime() + 86400000 - 1);
      return matchSearch && matchPlan && matchStatus && matchDateFrom && matchDateTo;
    });

    if (sort) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        switch (sort.key) {
          case 'invoice': cmp = a.id.localeCompare(b.id); break;
          case 'customer': cmp = a.userName.localeCompare(b.userName); break;
          case 'plan': cmp = a.subscriptionName.localeCompare(b.subscriptionName); break;
          case 'amount': cmp = a.amount - b.amount; break;
          case 'status': cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]; break;
          case 'date': cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
        }
        return sort.dir === 'desc' ? -cmp : cmp;
      });
    }

    return result;
  }, [search, filterPlan, filterStatus, dateFrom, dateTo, sort]);

  const totalPages = Math.ceil(processed.length / ITEMS_PER_PAGE);
  const paginated = processed.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Summary stats (always from full data)
  const succeededTx = MOCK_TRANSACTIONS.filter((t) => t.status === 'succeeded');
  const totalRevenue = succeededTx.reduce((s, t) => s + t.amount, 0);
  const failedCount = MOCK_TRANSACTIONS.filter((t) => t.status === 'failed').length;

  return (
    <div>
      <h1 className='mb-6 text-xl font-bold text-white'>Billing</h1>

      {/* Summary Row */}
      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <div className='rounded-xl border border-white/[0.06] bg-[#13131e] p-5'>
          <p className='mb-3 text-[13px] text-slate-400'>Total Revenue</p>
          <p className='text-[24px] font-bold text-white'>{fmtCurrency(totalRevenue)}</p>
          <p className='mt-1 text-[11px] text-slate-500'>{succeededTx.length} successful transactions</p>
        </div>
        <div className='rounded-xl border border-white/[0.06] bg-[#13131e] p-5'>
          <p className='mb-3 text-[13px] text-slate-400'>Total Transactions</p>
          <p className='text-[24px] font-bold text-white'>{MOCK_TRANSACTIONS.length}</p>
          <p className='mt-1 text-[11px] text-slate-500'>All statuses</p>
        </div>
        <div className='rounded-xl border border-white/[0.06] bg-[#13131e] p-5'>
          <p className='mb-3 text-[13px] text-slate-400'>Failed Transactions</p>
          <p className='text-[24px] font-bold text-white'>{failedCount}</p>
          <p className='mt-1 text-[11px] text-slate-500'>Requires attention</p>
        </div>
      </div>

      {/* Table Card */}
      <div className='overflow-hidden rounded-xl border border-white/[0.06] bg-[#13131e]'>
        {/* Toolbar */}
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

        {/* Filter Panel */}
        {showFilter && (
          <div className='border-b border-white/[0.06] bg-white/[0.01] px-5 py-4'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              {/* Plan */}
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

              {/* Status */}
              <div>
                <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                  className='h-8 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[12px] text-white outline-none focus:border-violet-500/30'
                >
                  <option value='all' className='bg-[#13131e]'>All Status</option>
                  {ALL_STATUSES.map((s) => <option key={s} value={s} className='bg-[#13131e]'>{STATUS_CONFIG[s].label}</option>)}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>From</label>
                <DateInput value={dateFrom} onChange={(d) => { setDateFrom(d); setPage(1); }} placeholder='MM/DD/YYYY' />
              </div>

              {/* Date To */}
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

        {/* Table */}
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-white/[0.06]'>
                <th className='w-10 px-5 py-3'>
                  <input type='checkbox' className='size-3.5 rounded border-white/20 bg-transparent accent-violet-500' />
                </th>
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
              {paginated.length > 0 ? paginated.map((t) => (
                <tr key={t.id} className='border-b border-white/[0.03] transition-colors last:border-0 hover:bg-white/[0.015]'>
                  <td className='px-5 py-3'>
                    <input type='checkbox' className='size-3.5 rounded border-white/20 bg-transparent accent-violet-500' />
                  </td>
                  <td className='px-4 py-3'>
                    <span className='text-[12px] font-medium text-violet-400'>{t.id}</span>
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-3'>
                      <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[11px] font-bold text-violet-300'>
                        {t.userName.charAt(0)}
                      </div>
                      <div>
                        <p className='text-[13px] font-medium text-white'>{t.userName}</p>
                        <p className='text-[11px] text-slate-500'>{t.userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className='px-4 py-3 text-[12px] text-slate-300'>{t.subscriptionName}</td>
                  <td className='px-4 py-3 text-[13px] font-medium text-white'>{fmtCurrency(t.amount)}</td>
                  <td className='px-4 py-3'>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_CONFIG[t.status].cls}`}>
                      {STATUS_CONFIG[t.status].label}
                    </span>
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-1.5 text-[12px] text-slate-400'>
                      <CreditCard className='size-3.5' />
                      <span>{t.paymentMethod}</span>
                    </div>
                  </td>
                  <td className='px-4 py-3 text-[12px] text-slate-400'>{format(new Date(t.createdAt), 'dd MMM yyyy')}</td>
                  <td className='px-4 py-3'>
                    <button type='button' className='rounded p-1 text-slate-500 hover:bg-white/[0.05] hover:text-white'>
                      <MoreVertical className='size-4' />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={9} className='py-12 text-center text-[13px] text-slate-500'>No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='flex items-center justify-between border-t border-white/[0.06] px-5 py-3'>
            <p className='text-[12px] text-slate-500'>
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, processed.length)} of {processed.length}
            </p>
            <div className='flex items-center gap-1'>
              <Button variant='ghost' size='sm' disabled={page === 1} onClick={() => setPage((p) => p - 1)} className='h-7 w-7 p-0 text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-30'>
                <ChevronLeft className='size-4' />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button key={p} variant='ghost' size='sm' onClick={() => setPage(p)} className={`h-7 w-7 p-0 text-xs ${page === p ? 'bg-violet-600 text-white hover:bg-violet-700' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'}`}>
                  {p}
                </Button>
              ))}
              <Button variant='ghost' size='sm' disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className='h-7 w-7 p-0 text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-30'>
                <ChevronRight className='size-4' />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
