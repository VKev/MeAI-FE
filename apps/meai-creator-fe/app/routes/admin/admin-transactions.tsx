import { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  CreditCard,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  CalendarIcon,
  Trash2,
  AlertTriangle,
  Pencil,
  Eye,
  Plus,
  Loader2,
  CoinsIcon,
  DollarSignIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast, Toaster } from 'sonner';
import { type LoaderFunctionArgs } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requireUser, hasRole } from '@/services/server/session.server';
import {
  fetchAdminTransactions,
  createAdminTransaction,
  updateAdminTransaction,
  deleteAdminTransaction
} from '@/services/client/admin.client';
import type { AdminTransaction } from '@/models/admin.model';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (!hasRole(user, 'admin')) {
    throw new Response('Forbidden', { status: 403 });
  }

  return null;
}

const ITEMS_PER_PAGE = 8;
const ALL_PLANS = [
  'Subscription 10000',
  'Subscription 50000',
  'Subscription 100000',
  'Subscription 500000',
  'Subscription 2000000'
];
const ALL_STATUSES = ['succeeded', 'incomplete', 'failed', 'pending'];
const ALL_TX_TYPES = ['Subscription', 'Payment'];
const ALL_PAYMENT_METHODS = ['Stripe'];

const fmtCurrency = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  succeeded: { label: 'Succeeded', cls: 'bg-emerald-500/10 text-emerald-400' },
  paid: { label: 'Succeeded', cls: 'bg-emerald-500/10 text-emerald-400' },
  active: { label: 'Succeeded', cls: 'bg-emerald-500/10 text-emerald-400' },
  complete: { label: 'Succeeded', cls: 'bg-emerald-500/10 text-emerald-400' },
  completed: { label: 'Succeeded', cls: 'bg-emerald-500/10 text-emerald-400' },
  incomplete: { label: 'Incomplete', cls: 'bg-amber-500/10 text-amber-400' },
  pending: { label: 'Pending', cls: 'bg-amber-500/10 text-amber-400' },
  failed: { label: 'Failed', cls: 'bg-red-500/10 text-red-400' }
};

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status.toLowerCase()] || { label: status, cls: 'bg-slate-500/10 text-slate-400' };

const STATUS_ORDER: Record<string, number> = {
  succeeded: 0,
  paid: 0,
  active: 0,
  complete: 0,
  completed: 0,
  incomplete: 1,
  pending: 1,
  failed: 2
};

function isSuccessfulTransactionStatus(status: string) {
  const normalized = status.toLowerCase();
  return (
    normalized === 'succeeded' ||
    normalized === 'paid' ||
    normalized === 'active' ||
    normalized === 'complete' ||
    normalized === 'completed'
  );
}

type SortKey = 'invoice' | 'customer' | 'plan' | 'amount' | 'status' | 'date';
type SortDir = 'asc' | 'desc';

const getInputCls = (hasError?: boolean) =>
  `h-9 w-full rounded-lg border px-3 text-[13px] text-white placeholder:text-slate-500 outline-none transition-colors ${hasError ? 'border-red-500/50 bg-red-500/5 focus:border-red-500/50' : 'border-white/[0.08] bg-white/[0.04] focus:border-violet-500/40'}`;

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

function getVisiblePages(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export default function AdminTransactions() {
  const queryClient = useQueryClient();

  const { data: txData, isLoading } = useQuery({
    queryKey: ['admin', 'transactions'],
    queryFn: () => fetchAdminTransactions()
  });

  const transactions = txData?.value ?? [];
  const error = txData?.error?.description;

  const createMutation = useMutation({
    mutationFn: (data: any) => createAdminTransaction(data),
    onSuccess: (res) => {
      if (res.isSuccess) {
        setShowCreate(false);
        setCreateForm({
          userId: '',
          cost: '',
          transactionType: 'Payment',
          paymentMethod: 'Stripe',
          status: 'succeeded',
          relationType: '',
          tokenUsed: ''
        });
        setCreateError(null);
        setCreateFieldErrors({});
        toast.success('Transaction created successfully');
        queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] });
      } else {
        setCreateError(res.error?.description || 'Failed to create transaction');
        toast.error(res.error?.description || 'Failed to create transaction');
      }
    },
    onError: (err: any) => {
      setCreateError(err?.response?.data?.error?.description || err.message || 'Failed to create transaction');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAdminTransaction(id, data),
    onSuccess: (res) => {
      if (res.isSuccess) {
        setEditTarget(null);
        setEditError(null);
        setEditFieldErrors({});
        toast.success('Transaction updated successfully');
        queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] });
      } else {
        setEditError(res.error?.description || 'Failed to update transaction');
        toast.error(res.error?.description || 'Failed to update transaction');
      }
    },
    onError: (err: any) => {
      setEditError(err?.response?.data?.error?.description || err.message || 'Failed to update transaction');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminTransaction(id),
    onSuccess: (res) => {
      if (res.isSuccess) {
        setDeleteTarget(null);
        setDeleteError(null);
        toast.success('Transaction deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] });
      } else {
        setDeleteError(res.error?.description || 'Failed to delete transaction');
        toast.error(res.error?.description || 'Failed to delete transaction');
      }
    },
    onError: (err: any) => {
      setDeleteError(err?.response?.data?.error?.description || err.message || 'Failed to delete transaction');
    }
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);

  // ── CRUD State ──
  const [viewTarget, setViewTarget] = useState<AdminTransaction | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    userId: '',
    cost: '',
    transactionType: 'Payment',
    paymentMethod: 'Stripe',
    status: 'succeeded',
    relationType: '',
    tokenUsed: ''
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});
  const [editTarget, setEditTarget] = useState<AdminTransaction | null>(null);
  const [editForm, setEditForm] = useState({
    cost: '',
    transactionType: '',
    paymentMethod: '',
    status: '',
    tokenUsed: ''
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<AdminTransaction | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const openEdit = (t: AdminTransaction) => {
    setEditForm({
      cost: String(t.cost || 0),
      transactionType: t.transactionType || '',
      paymentMethod: t.paymentMethod || '',
      status: t.status || '',
      tokenUsed: t.tokenUsed != null ? String(t.tokenUsed) : ''
    });
    setEditError(null);
    setEditTarget(t);
  };

  const validateUUID = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

  const handleCreate = () => {
    // Client-side validation
    const errors: Record<string, string> = {};
    if (!createForm.userId.trim()) errors.userId = 'User ID is required.';
    else if (!validateUUID(createForm.userId.trim())) errors.userId = 'Invalid UUID format (e.g. 58ce1c7a-4234...).';

    if (!createForm.cost || isNaN(Number(createForm.cost)) || Number(createForm.cost) < 0)
      errors.cost = 'Invalid amount.';
    if (createForm.tokenUsed && (isNaN(Number(createForm.tokenUsed)) || Number(createForm.tokenUsed) < 0))
      errors.tokenUsed = 'Invalid token amount.';
    if (!createForm.transactionType) errors.transactionType = 'Required.';
    if (!createForm.paymentMethod) errors.paymentMethod = 'Required.';
    if (!createForm.status) errors.status = 'Required.';

    if (Object.keys(errors).length > 0) {
      setCreateFieldErrors(errors);
      return;
    }

    setCreateFieldErrors({});
    setCreateError(null);
    createMutation.mutate({
      userId: createForm.userId.trim(),
      cost: Number(createForm.cost),
      transactionType: createForm.transactionType,
      paymentMethod: createForm.paymentMethod,
      status: createForm.status,
      relationType: createForm.relationType || null,
      tokenUsed: createForm.tokenUsed ? Number(createForm.tokenUsed) : null
    });
  };

  const handleEdit = () => {
    if (!editTarget) return;
    // Client-side validation
    const errors: Record<string, string> = {};
    if (editForm.cost && (isNaN(Number(editForm.cost)) || Number(editForm.cost) < 0)) errors.cost = 'Invalid amount.';
    if (editForm.tokenUsed && (isNaN(Number(editForm.tokenUsed)) || Number(editForm.tokenUsed) < 0))
      errors.tokenUsed = 'Invalid token amount.';
    if (!editForm.transactionType) errors.transactionType = 'Required.';
    if (!editForm.status) errors.status = 'Required.';

    if (Object.keys(errors).length > 0) {
      setEditFieldErrors(errors);
      return;
    }

    setEditFieldErrors({});
    setEditError(null);
    updateMutation.mutate({
      id: editTarget.id,
      data: {
        userId: editTarget.userId,
        relationId: editTarget.relationId || null,
        relationType: editTarget.relationType || null,
        providerReferenceId: editTarget.providerReferenceId || null,
        cost: Number(editForm.cost),
        transactionType: editForm.transactionType,
        paymentMethod: editForm.paymentMethod,
        status: editForm.status,
        tokenUsed: editForm.tokenUsed ? Number(editForm.tokenUsed) : null
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    deleteMutation.mutate(deleteTarget.id);
  };

  const processed = useMemo(() => {
    let result = transactions.filter((t) => {
      const q = search.toLowerCase();
      const userName = t.user?.fullName || t.user?.username || 'Unknown';
      const userEmail = t.user?.email || '';
      const planName = t.relation?.subscription?.name || t.transactionType || 'Unknown';

      const matchSearch =
        userName.toLowerCase().includes(q) || userEmail.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
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
          case 'invoice':
            cmp = a.id.localeCompare(b.id);
            break;
          case 'customer':
            cmp = aName.localeCompare(bName);
            break;
          case 'plan':
            cmp = aPlan.localeCompare(bPlan);
            break;
          case 'amount':
            cmp = a.cost - b.cost;
            break;
          case 'status':
            cmp = (STATUS_ORDER[a.status.toLowerCase()] ?? 99) - (STATUS_ORDER[b.status.toLowerCase()] ?? 99);
            break;
          case 'date':
            cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
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
  const failedCount = transactions.filter(
    (t) => t.status.toLowerCase() !== 'succeeded' && t.status.toLowerCase() !== 'completed'
  ).length;

  return (
    <div>
      <Toaster
        position='top-right'
        theme='dark'
        richColors
        closeButton
        duration={3000}
        toastOptions={{
          classNames: {
            toast: 'border border-white/[0.08] backdrop-blur-md shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]',
            title: 'text-[13px] font-medium',
            description: 'text-[12px]',
            success: 'bg-emerald-950/90 border-emerald-500/20 text-emerald-300',
            error: 'bg-red-950/90 border-red-500/20 text-red-300',
            info: 'bg-[rgba(19,19,30,0.95)] text-white'
          },
          style: {
            borderRadius: '0.75rem',
            padding: '12px 16px',
            gap: '10px'
          }
        }}
      />
      {isLoading ? (
        <div className='flex h-[50vh] flex-col items-center justify-center gap-3'>
          <Loader2 className='size-8 animate-spin text-violet-500' />
          <p className='text-sm text-slate-400'>Loading transactions...</p>
        </div>
      ) : (
        <>
          <div className='mb-6 flex items-center justify-between'>
            <h1 className='text-xl font-bold text-white'>Manage Transactions</h1>
            {/* <Button
          onClick={() => {
            setShowCreate(true);
            setCreateError(null);
          }}
          className='h-9 bg-violet-600 px-4 text-[13px] font-medium text-white hover:bg-violet-700'
        >
          <Plus className='mr-1.5 size-4' />
          Add Transaction
        </Button> */}
          </div>

          {error && (
            <div className='mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-400'>
              {error}
            </div>
          )}

          <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <div className='relative overflow-hidden rounded-xl border border-emerald-500/10 bg-[#13131e] p-5'>
              <div className='mb-3 flex items-center gap-2'>
                <div className='flex size-8 items-center justify-center rounded-lg bg-emerald-500/10'>
                  <DollarSignIcon className='size-4 text-emerald-400' />
                </div>
                <p className='text-[13px] font-medium text-slate-400'>Total Revenue</p>
              </div>
              <p className='text-[26px] font-bold tracking-tight text-white'>{fmtCurrency(totalRevenue)}</p>
            </div>
            <div className='relative overflow-hidden rounded-xl border border-violet-500/10 bg-[#13131e] p-5'>
              <div className='mb-3 flex items-center gap-2'>
                <div className='flex size-8 items-center justify-center rounded-lg bg-violet-500/10'>
                  <CreditCard className='size-4 text-violet-400' />
                </div>
                <p className='text-[13px] font-medium text-slate-400'>Total Transactions</p>
              </div>
              <p className='text-[26px] font-bold tracking-tight text-white'>{transactions.length}</p>
            </div>
            <div className='relative overflow-hidden rounded-xl border border-red-500/10 bg-[#13131e] p-5'>
              <div className='mb-3 flex items-center gap-2'>
                <div className='flex size-8 items-center justify-center rounded-lg bg-red-500/10'>
                  <AlertTriangle className='size-4 text-red-400' />
                </div>
                <p className='text-[13px] font-medium text-slate-400'>Incomplete</p>
              </div>
              <p className='text-[26px] font-bold tracking-tight text-white'>{failedCount}</p>
            </div>
          </div>

          <div className='overflow-hidden rounded-xl border border-white/[0.06] bg-[#13131e]'>
            <div className='flex items-center justify-between border-b border-white/[0.06] px-5 py-3'>
              <div className='relative w-64'>
                <Search className='absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-500' />
                <Input
                  placeholder='Search here'
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
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
                {hasActiveFilters && (
                  <span className='flex size-4 items-center justify-center rounded-full bg-violet-500 text-[9px] font-bold text-white'>
                    !
                  </span>
                )}
              </button>
            </div>

            {showFilter && (
              <div className='border-b border-white/[0.06] bg-white/[0.01] px-5 py-4'>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                  <div>
                    <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>Plan</label>
                    <select
                      value={filterPlan}
                      onChange={(e) => {
                        setFilterPlan(e.target.value);
                        setPage(1);
                      }}
                      className='h-8 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[12px] text-white outline-none focus:border-violet-500/30'
                    >
                      <option value='all' className='bg-[#13131e]'>
                        All Plans
                      </option>
                      {ALL_PLANS.map((p) => (
                        <option key={p} value={p} className='bg-[#13131e]'>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setPage(1);
                      }}
                      className='h-8 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[12px] text-white outline-none focus:border-violet-500/30'
                    >
                      <option value='all' className='bg-[#13131e]'>
                        All Status
                      </option>
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s} className='bg-[#13131e]'>
                          {getStatusConfig(s).label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>From</label>
                    <DateInput
                      value={dateFrom}
                      onChange={(d) => {
                        setDateFrom(d);
                        setPage(1);
                      }}
                      placeholder='MM/DD/YYYY'
                    />
                  </div>

                  <div>
                    <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>To</label>
                    <DateInput
                      value={dateTo}
                      onChange={(d) => {
                        setDateTo(d);
                        setPage(1);
                      }}
                      placeholder='MM/DD/YYYY'
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
                    onClick={() => setShowFilter(false)}
                    className='h-7 bg-violet-600 text-[12px] text-white hover:bg-violet-700'
                  >
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
                    <th className='px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>
                      Payment
                    </th>
                    <SortableHeader label='Date' sortKey='date' currentSort={sort} onSort={handleSort} />
                    <th className='px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? (
                    paginated.map((t) => {
                      const displayName = t.user?.fullName || t.user?.username || 'Unknown';
                      const planName = t.relation?.subscription?.name || t.transactionType || 'Unknown';
                      const statusConfig = getStatusConfig(t.status);

                      return (
                        <tr
                          key={t.id}
                          className='border-b border-white/[0.03] transition-colors last:border-0 hover:bg-white/[0.015]'
                        >
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
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusConfig.cls}`}
                            >
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className='px-4 py-3'>
                            <div className='flex items-center gap-1.5 text-[12px] text-slate-400'>
                              <CreditCard className='size-3.5' />
                              <span className='capitalize'>{t.paymentMethod || 'N/A'}</span>
                            </div>
                          </td>
                          <td className='px-4 py-3 text-[12px] text-slate-400'>
                            {format(new Date(t.createdAt), 'dd MMM yyyy')}
                          </td>
                          <td className='px-4 py-3'>
                            <button
                              type='button'
                              onClick={() => setViewTarget(t)}
                              className='rounded-md px-2.5 py-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white'
                            >
                              <Eye className='size-4' />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className='py-12 text-center text-[13px] text-slate-500'>
                        No transactions found
                      </td>
                    </tr>
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

          {/* ── View Detail Dialog ── */}
          <Dialog open={!!viewTarget} onOpenChange={(open) => !open && setViewTarget(null)}>
            <DialogContent className='max-w-lg'>
              <DialogHeader>
                <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-violet-500/10'>
                  <Eye className='size-6 text-violet-400' />
                </div>
                <DialogTitle className='text-center'>Transaction Detail</DialogTitle>
                <DialogDescription className='text-center'>Full details of this transaction record</DialogDescription>
              </DialogHeader>
              {viewTarget && (
                <div className='mt-2 space-y-3'>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='rounded-lg border border-white/[0.06] bg-white/[0.02] p-3'>
                      <p className='text-[10px] font-medium uppercase tracking-wider text-slate-500'>Transaction ID</p>
                      <p className='mt-1 break-all text-[12px] font-medium text-violet-400'>{viewTarget.id}</p>
                    </div>
                    <div className='rounded-lg border border-white/[0.06] bg-white/[0.02] p-3'>
                      <p className='text-[10px] font-medium uppercase tracking-wider text-slate-500'>Status</p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getStatusConfig(viewTarget.status).cls}`}
                      >
                        {getStatusConfig(viewTarget.status).label}
                      </span>
                    </div>
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='rounded-lg border border-white/[0.06] bg-white/[0.02] p-3'>
                      <p className='text-[10px] font-medium uppercase tracking-wider text-slate-500'>Customer</p>
                      <p className='mt-1 text-[13px] font-medium text-white'>
                        {viewTarget.user?.fullName || viewTarget.user?.username || 'Unknown'}
                      </p>
                      <p className='text-[11px] text-slate-500'>{viewTarget.user?.email || '—'}</p>
                    </div>
                    <div className='rounded-lg border border-white/[0.06] bg-white/[0.02] p-3'>
                      <p className='text-[10px] font-medium uppercase tracking-wider text-slate-500'>Amount</p>
                      <p className='mt-1 text-[18px] font-bold text-white'>{fmtCurrency(viewTarget.cost)}</p>
                    </div>
                  </div>
                  <div className='grid grid-cols-3 gap-3'>
                    <div className='rounded-lg border border-white/[0.06] bg-white/[0.02] p-3'>
                      <p className='text-[10px] font-medium uppercase tracking-wider text-slate-500'>Type</p>
                      <p className='mt-1 text-[12px] text-white'>{viewTarget.transactionType || '—'}</p>
                    </div>
                    <div className='rounded-lg border border-white/[0.06] bg-white/[0.02] p-3'>
                      <p className='text-[10px] font-medium uppercase tracking-wider text-slate-500'>Payment Method</p>
                      <div className='mt-1 flex items-center gap-1.5'>
                        <CreditCard className='size-3.5 text-slate-400' />
                        <p className='text-[12px] capitalize text-white'>{viewTarget.paymentMethod || '—'}</p>
                      </div>
                    </div>
                    <div className='rounded-lg border border-white/[0.06] bg-white/[0.02] p-3'>
                      <p className='text-[10px] font-medium uppercase tracking-wider text-slate-500'>Tokens Used</p>
                      <p className='mt-1 text-[12px] text-white'>{viewTarget.tokenUsed ?? '—'}</p>
                    </div>
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='rounded-lg border border-white/[0.06] bg-white/[0.02] p-3'>
                      <p className='text-[10px] font-medium uppercase tracking-wider text-slate-500'>Plan / Relation</p>
                      <p className='mt-1 text-[12px] text-white'>
                        {viewTarget.relation?.subscription?.name || viewTarget.relationType || '—'}
                      </p>
                    </div>
                    <div className='rounded-lg border border-white/[0.06] bg-white/[0.02] p-3'>
                      <p className='text-[10px] font-medium uppercase tracking-wider text-slate-500'>Created</p>
                      <p className='mt-1 text-[12px] text-white'>
                        {format(new Date(viewTarget.createdAt), 'dd MMM yyyy, HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter className='mt-4'>
                <Button
                  variant='ghost'
                  onClick={() => setViewTarget(null)}
                  className='h-9 text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-white'
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ── Create Transaction Dialog ── */}
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogContent className='max-w-md'>
              <DialogHeader>
                <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-violet-500/10'>
                  <Plus className='size-6 text-violet-400' />
                </div>
                <DialogTitle className='text-center'>Create Transaction</DialogTitle>
                <DialogDescription className='text-center'>
                  Add a new transaction record to the system.
                </DialogDescription>
              </DialogHeader>
              <div className='mt-2 space-y-3'>
                {createError && (
                  <div className='rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-400'>
                    {createError}
                  </div>
                )}
                <div>
                  <label
                    className={`mb-1 block text-[11px] font-medium ${createFieldErrors.userId ? 'text-red-400' : 'text-slate-500'}`}
                  >
                    User ID *
                  </label>
                  <input
                    value={createForm.userId}
                    onChange={(e) => setCreateForm((f) => ({ ...f, userId: e.target.value }))}
                    className={getInputCls(!!createFieldErrors.userId)}
                    placeholder='e.g. 58ce1c7a-4234-47aa-...'
                  />
                  {createFieldErrors.userId && (
                    <p className='mt-1 text-[11px] text-red-400'>{createFieldErrors.userId}</p>
                  )}
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-medium ${createFieldErrors.cost ? 'text-red-400' : 'text-slate-500'}`}
                    >
                      Amount (VNĐ) *
                    </label>
                    <input
                      type='number'
                      value={createForm.cost}
                      onChange={(e) => setCreateForm((f) => ({ ...f, cost: e.target.value }))}
                      className={getInputCls(!!createFieldErrors.cost)}
                      placeholder='100000'
                    />
                    {createFieldErrors.cost && (
                      <p className='mt-1 text-[11px] text-red-400'>{createFieldErrors.cost}</p>
                    )}
                  </div>
                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-medium ${createFieldErrors.tokenUsed ? 'text-red-400' : 'text-slate-500'}`}
                    >
                      Tokens Used
                    </label>
                    <input
                      type='number'
                      value={createForm.tokenUsed}
                      onChange={(e) => setCreateForm((f) => ({ ...f, tokenUsed: e.target.value }))}
                      className={getInputCls(!!createFieldErrors.tokenUsed)}
                      placeholder='0'
                    />
                    {createFieldErrors.tokenUsed && (
                      <p className='mt-1 text-[11px] text-red-400'>{createFieldErrors.tokenUsed}</p>
                    )}
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-medium ${createFieldErrors.transactionType ? 'text-red-400' : 'text-slate-500'}`}
                    >
                      Type *
                    </label>
                    <select
                      value={createForm.transactionType}
                      onChange={(e) => setCreateForm((f) => ({ ...f, transactionType: e.target.value }))}
                      className={getInputCls(!!createFieldErrors.transactionType)}
                    >
                      {ALL_TX_TYPES.map((t) => (
                        <option key={t} value={t} className='bg-[#13131e]'>
                          {t}
                        </option>
                      ))}
                    </select>
                    {createFieldErrors.transactionType && (
                      <p className='mt-1 text-[11px] text-red-400'>{createFieldErrors.transactionType}</p>
                    )}
                  </div>
                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-medium ${createFieldErrors.paymentMethod ? 'text-red-400' : 'text-slate-500'}`}
                    >
                      Payment Method *
                    </label>
                    <select
                      value={createForm.paymentMethod}
                      onChange={(e) => setCreateForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                      className={getInputCls(!!createFieldErrors.paymentMethod)}
                    >
                      {ALL_PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m} className='bg-[#13131e]'>
                          {m}
                        </option>
                      ))}
                    </select>
                    {createFieldErrors.paymentMethod && (
                      <p className='mt-1 text-[11px] text-red-400'>{createFieldErrors.paymentMethod}</p>
                    )}
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-medium ${createFieldErrors.status ? 'text-red-400' : 'text-slate-500'}`}
                    >
                      Status *
                    </label>
                    <select
                      value={createForm.status}
                      onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
                      className={getInputCls(!!createFieldErrors.status)}
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s} className='bg-[#13131e] capitalize'>
                          {s}
                        </option>
                      ))}
                    </select>
                    {createFieldErrors.status && (
                      <p className='mt-1 text-[11px] text-red-400'>{createFieldErrors.status}</p>
                    )}
                  </div>
                  <div>
                    <label className='mb-1 block text-[11px] font-medium text-slate-500'>Relation Type</label>
                    <input
                      value={createForm.relationType}
                      onChange={(e) => setCreateForm((f) => ({ ...f, relationType: e.target.value }))}
                      className={getInputCls(false)}
                      placeholder='Subscription'
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className='mt-4 gap-2'>
                <Button
                  variant='ghost'
                  onClick={() => setShowCreate(false)}
                  disabled={isSubmitting}
                  className='h-9 text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-50'
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={isSubmitting || !createForm.userId || !createForm.cost}
                  className='h-9 bg-violet-600 text-[13px] text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='mr-2 size-4 animate-spin' /> Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ── Edit Transaction Dialog ── */}
          <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
            <DialogContent className='max-w-md'>
              <DialogHeader>
                <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-violet-500/10'>
                  <Pencil className='size-6 text-violet-400' />
                </div>
                <DialogTitle className='text-center'>Edit Transaction</DialogTitle>
                <DialogDescription className='text-center'>
                  Update transaction{' '}
                  <span className='font-medium text-violet-400'>{editTarget?.id.slice(0, 13)}...</span>
                </DialogDescription>
              </DialogHeader>
              <div className='mt-2 space-y-3'>
                {editError && (
                  <div className='rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-400'>
                    {editError}
                  </div>
                )}
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-medium ${editFieldErrors.cost ? 'text-red-400' : 'text-slate-500'}`}
                    >
                      Amount (VNĐ)
                    </label>
                    <input
                      type='number'
                      value={editForm.cost}
                      onChange={(e) => setEditForm((f) => ({ ...f, cost: e.target.value }))}
                      className={getInputCls(!!editFieldErrors.cost)}
                    />
                    {editFieldErrors.cost && <p className='mt-1 text-[11px] text-red-400'>{editFieldErrors.cost}</p>}
                  </div>
                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-medium ${editFieldErrors.tokenUsed ? 'text-red-400' : 'text-slate-500'}`}
                    >
                      Tokens Used
                    </label>
                    <input
                      type='number'
                      value={editForm.tokenUsed}
                      onChange={(e) => setEditForm((f) => ({ ...f, tokenUsed: e.target.value }))}
                      className={getInputCls(!!editFieldErrors.tokenUsed)}
                    />
                    {editFieldErrors.tokenUsed && (
                      <p className='mt-1 text-[11px] text-red-400'>{editFieldErrors.tokenUsed}</p>
                    )}
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-medium ${editFieldErrors.transactionType ? 'text-red-400' : 'text-slate-500'}`}
                    >
                      Type
                    </label>
                    <select
                      value={editForm.transactionType}
                      onChange={(e) => setEditForm((f) => ({ ...f, transactionType: e.target.value }))}
                      className={getInputCls(!!editFieldErrors.transactionType)}
                    >
                      {ALL_TX_TYPES.map((t) => (
                        <option key={t} value={t} className='bg-[#13131e]'>
                          {t}
                        </option>
                      ))}
                    </select>
                    {editFieldErrors.transactionType && (
                      <p className='mt-1 text-[11px] text-red-400'>{editFieldErrors.transactionType}</p>
                    )}
                  </div>
                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-medium ${editFieldErrors.paymentMethod ? 'text-red-400' : 'text-slate-500'}`}
                    >
                      Payment Method
                    </label>
                    <select
                      value={editForm.paymentMethod}
                      onChange={(e) => setEditForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                      className={getInputCls(!!editFieldErrors.paymentMethod)}
                    >
                      {ALL_PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m} className='bg-[#13131e]'>
                          {m}
                        </option>
                      ))}
                    </select>
                    {editFieldErrors.paymentMethod && (
                      <p className='mt-1 text-[11px] text-red-400'>{editFieldErrors.paymentMethod}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label
                    className={`mb-1 block text-[11px] font-medium ${editFieldErrors.status ? 'text-red-400' : 'text-slate-500'}`}
                  >
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                    className={getInputCls(!!editFieldErrors.status)}
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s} className='bg-[#13131e] capitalize'>
                        {s}
                      </option>
                    ))}
                  </select>
                  {editFieldErrors.status && <p className='mt-1 text-[11px] text-red-400'>{editFieldErrors.status}</p>}
                </div>
              </div>
              <DialogFooter className='mt-4 gap-2'>
                <Button
                  variant='ghost'
                  onClick={() => setEditTarget(null)}
                  disabled={isSubmitting}
                  className='h-9 text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-50'
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEdit}
                  disabled={isSubmitting}
                  className='h-9 bg-violet-600 text-[13px] text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='mr-2 size-4 animate-spin' /> Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ── Delete Transaction Dialog ── */}
          <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
            <DialogContent className='max-w-sm'>
              <DialogHeader>
                <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-red-500/10'>
                  <AlertTriangle className='size-6 text-red-400' />
                </div>
                <DialogTitle className='text-center'>Delete Transaction</DialogTitle>
                <DialogDescription className='text-center'>
                  Are you sure you want to delete transaction{' '}
                  <span className='font-medium text-violet-400'>{deleteTarget?.id.slice(0, 13)}...</span>? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              {deleteError && (
                <div className='mt-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-400 text-center'>
                  {deleteError}
                </div>
              )}
              <DialogFooter className='mt-2 gap-2 sm:justify-center'>
                <Button
                  variant='ghost'
                  onClick={() => setDeleteTarget(null)}
                  disabled={isSubmitting}
                  className='h-9 text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-40'
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                  className='h-9 bg-red-600 text-[13px] text-white hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed'
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='mr-2 size-4 animate-spin' /> Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
