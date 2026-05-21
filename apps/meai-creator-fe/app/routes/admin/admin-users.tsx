import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  CalendarIcon,
  Trash2,
  Shield,
  AlertTriangle,
  Pencil,
  UserPlus,
  Loader2,
  RotateCcw,
  CheckCircle,
  ChevronDown,
  Check,
  CreditCard as CardIcon,
  Mail,
  Phone,
  Coins,
  Globe,
  Eye,
  X
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
  fetchAdminUsers,
  deleteAdminUser,
  createAdminUser,
  updateAdminUser,
  activateAdminUser,
  fetchAdminSubscriptions,
  fetchAdminUserSubscriptions,
  updateAdminUserSubscriptionStatus,
  type UpdateAdminUserPayload
} from '@/services/client/admin.client';
import type { AdminUser, AdminUserSubscription } from '@/models/admin.model';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (!hasRole(user, 'admin')) {
    throw new Response('Forbidden', { status: 403 });
  }

  return null;
}

type UserStatus = 'Active' | 'Banned';

const ITEMS_PER_PAGE = 8;
const ALL_ROLES = ['Admin', 'User'];
const ALL_STATUSES: UserStatus[] = ['Active', 'Banned'];

const STATUS_STYLES: Record<UserStatus, string> = {
  Active: 'bg-emerald-500/10 text-emerald-400',
  Banned: 'bg-red-500/10 text-red-400'
};

type SortKey = 'profile' | 'date' | 'status';
type SortDir = 'asc' | 'desc';

const STATUS_ORDER: Record<UserStatus, number> = { Active: 0, Banned: 1 };

function getUserStatus(u: AdminUser): UserStatus {
  return u.isDeleted ? 'Banned' : 'Active';
}

function getDisplayName(u: AdminUser): string {
  return u.fullName || u.username || u.email;
}

const getInputCls = (hasError: boolean) =>
  `h-9 w-full rounded-lg border px-3 text-[13px] outline-none transition-colors ${hasError
    ? 'border-red-500/40 bg-red-500/10 text-red-100 placeholder:text-red-400/50 focus:border-red-500'
    : 'border-white/[0.08] bg-white/[0.04] text-white placeholder:text-slate-500 focus:border-violet-500/40'
  }`;

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

function RoleDropdown({
  value,
  onChange,
  classNameStr = '',
  includeAll = false
}: {
  value: string;
  onChange: (v: string) => void;
  classNameStr?: string;
  includeAll?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const options = includeAll
    ? ['all', ...ALL_ROLES.map((r: string) => r.toLowerCase())]
    : ALL_ROLES.map((r: string) => r.toLowerCase());
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          className={`flex w-full items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-white outline-none transition-colors hover:border-violet-500/40 focus:border-violet-500/40 ${classNameStr}`}
        >
          <span className='capitalize'>{value === 'all' ? 'All Roles' : value || 'User'}</span>
          <ChevronDown className='size-4 text-slate-500' />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className='w-[var(--radix-popover-trigger-width)] border border-white/[0.08] bg-[#1a1a24] p-1 shadow-xl'
        align='start'
      >
        {options.map((r) => (
          <div
            key={r}
            onClick={() => {
              onChange(r);
              setOpen(false);
            }}
            className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-[13px] transition-colors hover:bg-white/[0.06] hover:text-white ${value === r ? 'text-white bg-white/[0.03]' : 'text-slate-300'}`}
          >
            <span className='capitalize'>{r === 'all' ? 'All Roles' : r}</span>
            {value === r && <Check className='size-4 text-violet-400' />}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export default function AdminUsers() {
  const queryClient = useQueryClient();

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => fetchAdminUsers({ includeDeleted: true }),
  });

  const { data: subsData, isLoading: isLoadingSubs } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: () => fetchAdminSubscriptions(),
  });

  const { data: userSubsData, isLoading: isLoadingUserSubs } = useQuery({
    queryKey: ['admin', 'user-subscriptions'],
    queryFn: () => fetchAdminUserSubscriptions(),
  });

  const users = usersData?.value ?? [];
  const subscriptions = subsData?.value ?? [];
  const userSubscriptions = userSubsData?.value ?? [];
  const error = usersData?.error?.description || subsData?.error?.description || userSubsData?.error?.description;
  const isLoading = isLoadingUsers || isLoadingSubs || isLoadingUserSubs;

  const createMutation = useMutation({
    mutationFn: (data: any) => createAdminUser(data),
    onSuccess: (res) => {
      if (res.isSuccess) {
        setShowCreate(false);
        setCreateForm({ username: '', email: '', password: '', fullName: '', phoneNumber: '', role: 'user' });
        setCreateError(null);
        setCreateFieldErrors({});
        toast.success('User created successfully');
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      } else {
        setCreateError(res.error?.description || 'Failed to create user');
      }
    },
    onError: (err: any) => {
      setCreateError(err?.response?.data?.error?.description || err.message || 'Failed to create user');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string, data: any }) => updateAdminUser(userId, data),
    onSuccess: (res) => {
      if (res.isSuccess) {
        setEditTarget(null);
        setEditError(null);
        setEditFieldErrors({});
        toast.success('User updated successfully');
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      } else {
        setEditError(res.error?.description || 'Failed to update user');
      }
    },
    onError: (err: any) => {
      setEditError(err?.response?.data?.error?.description || err.message || 'Failed to update user');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteAdminUser(userId),
    onSuccess: (res) => {
      if (res.isSuccess) {
        setDeleteTarget(null);
        setDeleteError(null);
        toast.success('User banned successfully');
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      } else {
        setDeleteError(res.error?.description || 'Failed to ban user');
      }
    },
    onError: (err: any) => {
      setDeleteError(err?.response?.data?.error?.description || err.message || 'Failed to ban user');
    }
  });

  const activateMutation = useMutation({
    mutationFn: (userId: string) => activateAdminUser(userId),
    onSuccess: (res) => {
      if (res.isSuccess) {
        setActivateTarget(null);
        toast.success('User unbanned successfully');
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      } else {
        toast.error(res.error?.description || 'Failed to unban user');
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.description || err.message || 'Failed to unban user');
    }
  });

  const adjustSubMutation = useMutation({
    mutationFn: ({ id, status, reason }: any) => updateAdminUserSubscriptionStatus(id, status, reason),
    onSuccess: (res: any) => {
      if (res.isSuccess) {
        setAdjustTarget(null);
        setSelectedPlanId('');
        setSelectedStatus('');
        toast.success('Subscription status updated successfully');
        queryClient.invalidateQueries({ queryKey: ['admin', 'user-subscriptions'] });
      } else {
        toast.error(res.error?.description || 'Failed to update subscription status');
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.description || err.message || 'Failed to update subscription status');
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      let failed = 0;
      for (const uid of userIds) {
        try {
          const res = await deleteAdminUser(uid);
          if (!res.isSuccess) failed++;
        } catch {
          failed++;
        }
      }
      return { failed, total: userIds.length };
    },
    onSuccess: ({ failed, total }) => {
      setShowBulkDelete(false);
      if (failed === 0) {
        setSelectedIds(new Set());
        toast.success(`${total} users banned successfully`);
      } else {
        toast.error(`Failed to delete ${failed} of ${total} users`);
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || activateMutation.isPending || adjustSubMutation.isPending || bulkDeleteMutation.isPending;

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailTarget, setDetailTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<AdminUser | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    role: 'user'
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    fullName: '',
    phoneNumber: '',
    emailVerified: false
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [activateTarget, setActivateTarget] = useState<AdminUser | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [filterRole, setFilterRole] = useState<string>('all');
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

  const getUserSub = (userId: string) => {
    return (
      userSubscriptions.find((s: AdminUserSubscription) => s.userId === userId && s.status === 'Active') ||
      userSubscriptions.find((s: AdminUserSubscription) => s.userId === userId)
    );
  };

  const resetFilters = () => {
    setFilterRole('all');
    setFilterStatus('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  const hasActiveFilters = filterRole !== 'all' || filterStatus !== 'all' || dateFrom || dateTo;

  const processed = useMemo(() => {
    let result = (users ?? []).filter((u: AdminUser) => {
      const q = search.toLowerCase();
      const displayName = getDisplayName(u).toLowerCase();
      const matchSearch =
        u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || displayName.includes(q);
      const matchRole =
        filterRole === 'all' || u.roles.some((r: string) => r.toLowerCase() === filterRole.toLowerCase());
      const status = getUserStatus(u);
      const matchStatus = filterStatus === 'all' || status === filterStatus;
      const created = u.createdAt ? new Date(u.createdAt) : null;
      const matchDateFrom = !dateFrom || (created && created >= dateFrom);
      const matchDateTo = !dateTo || (created && created <= new Date(dateTo.getTime() + 86400000 - 1));
      return matchSearch && matchRole && matchStatus && matchDateFrom && matchDateTo;
    });

    if (sort) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sort.key === 'profile') cmp = getDisplayName(a).localeCompare(getDisplayName(b));
        else if (sort.key === 'date') {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          cmp = da - db;
        } else if (sort.key === 'status') cmp = STATUS_ORDER[getUserStatus(a)] - STATUS_ORDER[getUserStatus(b)];
        return sort.dir === 'desc' ? -cmp : cmp;
      });
    }

    return result;
  }, [users, search, filterRole, filterStatus, dateFrom, dateTo, sort]);

  const totalPages = Math.ceil(processed.length / ITEMS_PER_PAGE);
  const paginated = processed.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleSelectAll = () => {
    const visibleIds = paginated.map((u: AdminUser) => u.id);
    const allSelected = visibleIds.every((id: string) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id: string) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allPageSelected = paginated.length > 0 && paginated.every((u: AdminUser) => selectedIds.has(u.id));

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    deleteMutation.mutate(deleteTarget.id);
  };

  const handleCreate = () => {
    setCreateError(null);
    setCreateFieldErrors({});
    let hasErr = false;
    const errs: Record<string, string> = {};

    if (!createForm.username.trim()) {
      errs.username = 'Username is required.';
      hasErr = true;
    }
    if (!createForm.email.trim()) {
      errs.email = 'Email is required.';
      hasErr = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      errs.email = 'Invalid email format.';
      hasErr = true;
    }
    if (!createForm.password.trim()) {
      errs.password = 'Password is required.';
      hasErr = true;
    } else if (createForm.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
      hasErr = true;
    }

    if (hasErr) {
      setCreateFieldErrors(errs);
      return;
    }

    createMutation.mutate({
      ...createForm,
      fullName: createForm.fullName || null,
      phoneNumber: createForm.phoneNumber || null,
      role: createForm.role || null
    });
  };

  const openEdit = (u: AdminUser) => {
    setEditForm({
      username: u.username || '',
      email: u.email || '',
      fullName: u.fullName || '',
      phoneNumber: u.phoneNumber || '',
      emailVerified: u.emailVerified
    });
    setEditError(null);
    setEditFieldErrors({});
    setEditTarget(u);
  };

  const handleEdit = () => {
    if (!editTarget) return;
    setEditError(null);
    setEditFieldErrors({});
    let hasErr = false;
    const errs: Record<string, string> = {};

    if (!editForm.username.trim()) {
      errs.username = 'Username is required.';
      hasErr = true;
    }
    if (!editForm.email.trim()) {
      errs.email = 'Email is required.';
      hasErr = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errs.email = 'Invalid email format.';
      hasErr = true;
    }

    if (hasErr) {
      setEditFieldErrors(errs);
      return;
    }

    updateMutation.mutate({
      userId: editTarget.id,
      data: {
        ...editForm,
        fullName: editForm.fullName || null,
        phoneNumber: editForm.phoneNumber || null,
        emailVerified: editForm.emailVerified
      }
    });
  };

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
        <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-violet-500" />
          <p className="text-sm text-slate-400">Loading user data...</p>
        </div>
      ) : (
        <>
          <div className='mb-6 flex items-center justify-between'>
            <h1 className='text-xl font-bold text-white tracking-tight'>Manage Users</h1>
            <Button
              onClick={() => {
                setShowCreate(true);
                setCreateError(null);
              }}
              className='h-9 bg-violet-600 px-4 text-[13px] font-medium text-white hover:bg-violet-700'
            >
              + Add New
            </Button>
          </div>

          {error && (
            <div className='mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-400'>
              {error}
            </div>
          )}

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
                    <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>Role</label>
                    <RoleDropdown
                      value={filterRole}
                      onChange={(val) => {
                        setFilterRole(val);
                        setPage(1);
                      }}
                      classNameStr='h-8 text-[12px]'
                      includeAll
                    />
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
                          {s}
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
                    className='h-7 text-[12px] text-slate-400 hover:bg-white/[0.06] hover:text-white'
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
            {selectedIds.size > 0 && (
              <div className='flex items-center gap-4 border-b border-white/[0.06] bg-[#1a1a24] px-5 py-3'>
                <button
                  type='button'
                  onClick={() => setShowBulkDelete(true)}
                  className='flex items-center gap-2 rounded-[20px] bg-[#f00b1a] px-4 py-1.5 text-[13px] font-medium text-white shadow hover:bg-[#d60a17] transition-colors'
                >
                  <Trash2 className='size-4' />
                  Ban Selected
                </button>
                <button
                  type='button'
                  onClick={() => setSelectedIds(new Set())}
                  className='text-[13px] text-slate-400 hover:text-white transition-colors'
                >
                  Clear selection
                </button>
                <span className='ml-auto text-[12px] text-slate-500'>
                  <span className='font-medium text-white'>{selectedIds.size}</span> user{selectedIds.size > 1 ? 's' : ''}{' '}
                  selected
                </span>
              </div>
            )}
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-white/[0.06]'>
                    <th className='w-10 px-5 py-3'>
                      <input
                        type='checkbox'
                        checked={allPageSelected}
                        onChange={toggleSelectAll}
                        className='size-3.5 cursor-pointer rounded border-white/20 bg-transparent accent-violet-500'
                      />
                    </th>
                    <SortableHeader label='Profile' sortKey='profile' currentSort={sort} onSort={handleSort} />
                    <th className='px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>
                      Roles
                    </th>
                    <th className='px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>
                      Email Verified
                    </th>
                    <th className='px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>
                      Subscription
                    </th>
                    <SortableHeader label='Date' sortKey='date' currentSort={sort} onSort={handleSort} />
                    <SortableHeader label='Status' sortKey='status' currentSort={sort} onSort={handleSort} />
                    <th className='w-10 px-4 py-3'></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? (
                    paginated.map((u: AdminUser) => {
                      const displayName = getDisplayName(u);
                      const status = getUserStatus(u);
                      return (
                        <tr
                          key={u.id}
                          onClick={() => setDetailTarget(u)}
                          className='cursor-pointer border-b border-white/[0.03] transition-colors last:border-0 hover:bg-white/[0.03]'
                        >
                          <td className='px-5 py-3' onClick={(e) => e.stopPropagation()}>
                            <input
                              type='checkbox'
                              checked={selectedIds.has(u.id)}
                              onChange={() => toggleSelect(u.id)}
                              disabled={u.roles.some((r: string) => r.toLowerCase() === 'admin')}
                              className={`size-3.5 rounded border-white/20 bg-transparent accent-violet-500 ${u.roles.some((r: string) => r.toLowerCase() === 'admin') ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'}`}
                            />
                          </td>
                          <td className='px-4 py-3'>
                            <div className='flex items-center gap-3'>
                              {u.avatarPresignedUrl ? (
                                <img
                                  src={u.avatarPresignedUrl}
                                  alt={displayName}
                                  className='size-9 shrink-0 rounded-full object-cover'
                                />
                              ) : (
                                <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[12px] font-bold text-violet-300'>
                                  {displayName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className='flex items-center gap-1.5'>
                                <p className='text-[13px] font-medium text-white'>{displayName}</p>
                                {u.roles.some((r: string) => r.toLowerCase() === 'admin') && (
                                  <div className='group relative'>
                                    <Shield className='size-3 text-violet-400' />
                                    <div className='absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100'>
                                      Protected Account
                                    </div>
                                  </div>
                                )}
                              </div>
                              <p className='text-[11px] text-slate-500'>{u.email}</p>
                            </div>
                          </td>
                          <td className='px-4 py-3'>
                            <div className='flex flex-wrap items-center gap-1'>
                              {u.roles.slice(0, 2).map((r: string) => (
                                <span
                                  key={r}
                                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${r.toLowerCase() === 'admin' ? 'bg-violet-500/10 text-violet-400' : 'bg-sky-500/10 text-sky-400'}`}
                                >
                                  {r}
                                </span>
                              ))}
                              {u.roles.length > 2 && (
                                <span className='rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-slate-400'>
                                  +{u.roles.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className='px-4 py-3'>
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${u.emailVerified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}
                            >
                              {u.emailVerified ? 'Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td className='px-4 py-3'>
                            {(() => {
                              const isAdmin = u.roles.some((r: string) => r.toLowerCase() === 'admin');
                              if (isAdmin) {
                                return (
                                  <span className='inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-400'>
                                    System Access
                                  </span>
                                );
                              }

                              const sub = getUserSub(u.id);
                              return (
                                <div className='flex flex-col gap-0.5'>
                                  <span
                                    className={`text-[12px] font-bold ${sub?.subscriptionName ? 'text-violet-400' : 'text-slate-500'}`}
                                  >
                                    {sub?.subscriptionName || 'Free User'}
                                  </span>
                                  {sub && (
                                    <div className='flex items-center gap-2'>
                                      <span
                                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${sub.status?.toLowerCase() === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-500'}`}
                                      >
                                        {sub.status || 'N/A'}
                                      </span>
                                      {sub.endDate && (
                                        <span className='text-[10px] text-slate-500 tabular-nums'>
                                          Exp: {format(new Date(sub.endDate), 'dd/MM/yy')}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className='px-4 py-3 text-[12px] text-slate-400'>
                            {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '—'}
                          </td>
                          <td className='px-4 py-3'>
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status]}`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className='px-4 py-3' onClick={(e) => e.stopPropagation()}>
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type='button'
                                  className='rounded p-1 text-slate-500 hover:bg-white/[0.05] hover:text-white'
                                >
                                  <MoreVertical className='size-4' />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className='w-40 p-1' align='end' sideOffset={4}>
                                {u.isDeleted ? (
                                  <button
                                    type='button'
                                    onClick={() => setActivateTarget(u)}
                                    className='flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-emerald-400 hover:bg-emerald-500/10'
                                  >
                                    <RotateCcw className='size-3.5' />
                                    Unban
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      type='button'
                                      onClick={() => openEdit(u)}
                                      className='flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-slate-400 hover:bg-white/[0.06] hover:text-white'
                                    >
                                      <Pencil className='size-3.5' />
                                      Edit
                                    </button>
                                    {!u.roles.some((r: string) => r.toLowerCase() === 'admin') && (
                                      <button
                                        type='button'
                                        onClick={() => {
                                          const sub = getUserSub(u.id);
                                          setAdjustTarget(u);
                                          setSelectedPlanId(sub?.userSubscriptionId || '');
                                          setSelectedStatus(sub?.status || 'Active');
                                          setAdjustReason('');
                                        }}
                                        className='flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-violet-400 hover:bg-violet-500/10'
                                      >
                                        <CardIcon className='size-3.5' />
                                        Subscription
                                      </button>
                                    )}
                                    {!u.roles.some((r: string) => r.toLowerCase() === 'admin') && (
                                      <>
                                        <div className='my-1 border-t border-white/[0.06]' />
                                        <button
                                          type='button'
                                          onClick={() => setDeleteTarget(u)}
                                          className='flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-red-400 hover:bg-red-500/10'
                                        >
                                          <Trash2 className='size-3.5' />
                                          Ban
                                        </button>
                                      </>
                                    )}
                                  </>
                                )}
                              </PopoverContent>
                            </Popover>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className='py-12 text-center text-[13px] text-slate-500'>
                        No users found
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
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-semibold transition-all ${p === '...'
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

          <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
            <DialogContent className='max-w-sm'>
              <DialogHeader>
                <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-red-500/10'>
                  <AlertTriangle className='size-6 text-red-400' />
                </div>
                <DialogTitle className='text-center'>Ban User</DialogTitle>
                <DialogDescription className='text-center'>
                  Are you sure you want to ban{' '}
                  <span className='font-medium text-white'>{deleteTarget ? getDisplayName(deleteTarget) : ''}</span>? Their
                  access will be restricted.
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
                      <Loader2 className='mr-2 size-4 animate-spin' /> Banning...
                    </>
                  ) : (
                    'Ban'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={!!activateTarget} onOpenChange={(open) => !open && setActivateTarget(null)}>
            <DialogContent className='max-w-sm'>
              <DialogHeader>
                <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-500/10'>
                  <CheckCircle className='size-6 text-emerald-400' />
                </div>
                <DialogTitle className='text-center'>Unban User</DialogTitle>
                <DialogDescription className='text-center'>
                  Are you sure you want to unban{' '}
                  <span className='font-medium text-white'>{activateTarget ? getDisplayName(activateTarget) : ''}</span>?
                  This will restore their account access.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className='mt-2 gap-2 sm:justify-center'>
                <Button
                  variant='ghost'
                  onClick={() => setActivateTarget(null)}
                  disabled={isSubmitting}
                  className='h-9 text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-40'
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!activateTarget) return;
                    activateMutation.mutate(activateTarget.id);
                  }}
                  disabled={isSubmitting}
                  className='h-9 bg-emerald-600 text-[13px] text-white hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed'
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='mr-2 size-4 animate-spin' /> Unbanning...
                    </>
                  ) : (
                    'Unban'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
            <DialogContent className='max-w-sm'>
              <DialogHeader>
                <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-red-500/10'>
                  <AlertTriangle className='size-6 text-red-400' />
                </div>
                <DialogTitle className='text-center'>
                  Delete {selectedIds.size} User{selectedIds.size > 1 ? 's' : ''}
                </DialogTitle>
                <DialogDescription className='text-center'>
                  Are you sure you want to delete{' '}
                  <span className='font-medium text-white'>
                    {selectedIds.size} selected user{selectedIds.size > 1 ? 's' : ''}
                  </span>
                  ?
                  <br />
                  <span className='mt-2 block text-xs text-amber-400/80'>
                    Note: Admin accounts are protected and will be skipped.
                  </span>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className='mt-2 gap-2 sm:justify-center'>
                <Button
                  variant='ghost'
                  onClick={() => setShowBulkDelete(false)}
                  disabled={isSubmitting}
                  className='h-9 text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-40'
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    bulkDeleteMutation.mutate(Array.from(selectedIds));
                  }}
                  disabled={isSubmitting}
                  className='h-9 bg-red-600 text-[13px] text-white hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed'
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='mr-2 size-4 animate-spin' /> Deleting...
                    </>
                  ) : (
                    `Delete ${selectedIds.size} User${selectedIds.size > 1 ? 's' : ''}`
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogContent className='max-w-md'>
              <DialogHeader>
                <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-violet-500/10'>
                  <UserPlus className='size-6 text-violet-400' />
                </div>
                <DialogTitle className='text-center'>Create User</DialogTitle>
                <DialogDescription className='text-center'>Add a new user to the system.</DialogDescription>
              </DialogHeader>
              <div className='mt-2 space-y-3'>
                {createError && (
                  <div className='rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-400'>
                    {createError}
                  </div>
                )}
                <div>
                  <label
                    className={`mb-1 block text-[11px] font-medium ${createFieldErrors.username ? 'text-red-400' : 'text-slate-500'}`}
                  >
                    Username *
                  </label>
                  <input
                    value={createForm.username}
                    onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
                    className={getInputCls(!!createFieldErrors.username)}
                    placeholder='username'
                  />
                  {createFieldErrors.username && (
                    <p className='mt-1 text-[11px] text-red-400'>{createFieldErrors.username}</p>
                  )}
                </div>
                <div>
                  <label
                    className={`mb-1 block text-[11px] font-medium ${createFieldErrors.email ? 'text-red-400' : 'text-slate-500'}`}
                  >
                    Email *
                  </label>
                  <input
                    type='email'
                    value={createForm.email}
                    onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                    className={getInputCls(!!createFieldErrors.email)}
                    placeholder='email@example.com'
                  />
                  {createFieldErrors.email && <p className='mt-1 text-[11px] text-red-400'>{createFieldErrors.email}</p>}
                </div>
                <div>
                  <label
                    className={`mb-1 block text-[11px] font-medium ${createFieldErrors.password ? 'text-red-400' : 'text-slate-500'}`}
                  >
                    Password *
                  </label>
                  <input
                    type='password'
                    value={createForm.password}
                    onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                    className={getInputCls(!!createFieldErrors.password)}
                    placeholder='••••••••'
                  />
                  {createFieldErrors.password && (
                    <p className='mt-1 text-[11px] text-red-400'>{createFieldErrors.password}</p>
                  )}
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='mb-1 block text-[11px] font-medium text-slate-500'>Full Name</label>
                    <input
                      value={createForm.fullName}
                      onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))}
                      className={getInputCls(false)}
                      placeholder='Nguyễn Văn A'
                    />
                  </div>
                  <div>
                    <label className='mb-1 block text-[11px] font-medium text-slate-500'>Phone</label>
                    <input
                      value={createForm.phoneNumber}
                      onChange={(e) => setCreateForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                      className={getInputCls(false)}
                      placeholder='0901234567'
                    />
                  </div>
                </div>
                <div>
                  <label className='mb-1 block text-[11px] font-medium text-slate-500'>Role</label>
                  <RoleDropdown
                    value={createForm.role}
                    onChange={(val) => setCreateForm((f) => ({ ...f, role: val }))}
                    classNameStr='h-9 text-[13px]'
                  />
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
                  disabled={
                    isSubmitting ||
                    !createForm.username ||
                    !createForm.email ||
                    !createForm.password ||
                    createForm.password.length < 6
                  }
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

          <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
            <DialogContent className='max-w-md'>
              <DialogHeader>
                <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-violet-500/10'>
                  <Pencil className='size-6 text-violet-400' />
                </div>
                <DialogTitle className='text-center'>Edit User</DialogTitle>
                <DialogDescription className='text-center'>
                  Update information for{' '}
                  <span className='font-medium text-white'>{editTarget ? getDisplayName(editTarget) : ''}</span>
                </DialogDescription>
              </DialogHeader>
              <div className='mt-2 space-y-3'>
                {editError && (
                  <div className='rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-400'>
                    {editError}
                  </div>
                )}
                <div>
                  <label
                    className={`mb-1 block text-[11px] font-medium ${editFieldErrors.username ? 'text-red-400' : 'text-slate-500'}`}
                  >
                    Username *
                  </label>
                  <input
                    value={editForm.username}
                    onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                    className={getInputCls(!!editFieldErrors.username)}
                    placeholder='username'
                  />
                  {editFieldErrors.username && <p className='mt-1 text-[11px] text-red-400'>{editFieldErrors.username}</p>}
                </div>
                <div>
                  <label
                    className={`mb-1 block text-[11px] font-medium ${editFieldErrors.email ? 'text-red-400' : 'text-slate-500'}`}
                  >
                    Email *
                  </label>
                  <input
                    type='email'
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    className={getInputCls(!!editFieldErrors.email)}
                    placeholder='email@example.com'
                  />
                  {editFieldErrors.email && <p className='mt-1 text-[11px] text-red-400'>{editFieldErrors.email}</p>}
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='mb-1 block text-[11px] font-medium text-slate-500'>Full Name</label>
                    <input
                      value={editForm.fullName}
                      onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                      className={getInputCls(false)}
                      placeholder='Nguyễn Văn A'
                    />
                  </div>
                  <div>
                    <label className='mb-1 block text-[11px] font-medium text-slate-500'>Phone</label>
                    <input
                      value={editForm.phoneNumber}
                      onChange={(e) => setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                      className={getInputCls(false)}
                      placeholder='0901234567'
                    />
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    id='editEmailVerified'
                    checked={editForm.emailVerified}
                    onChange={(e) => setEditForm((f) => ({ ...f, emailVerified: e.target.checked }))}
                    className='size-3.5 cursor-pointer rounded accent-violet-500'
                  />
                  <label htmlFor='editEmailVerified' className='cursor-pointer text-[12px] text-slate-300'>
                    Email Verified
                  </label>
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
                  disabled={isSubmitting || !editForm.username || !editForm.email}
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

          <Dialog open={!!adjustTarget} onOpenChange={(open) => !open && setAdjustTarget(null)}>
            <DialogContent>
              <DialogHeader>
                <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-violet-500/10'>
                  <CardIcon className='size-6 text-violet-400' />
                </div>
                <DialogTitle className='text-center'>Adjust Subscription</DialogTitle>
                <DialogDescription className='text-center'>
                  Select a plan for{' '}
                  <span className='font-medium text-white'>
                    {adjustTarget ? adjustTarget.fullName || adjustTarget.username : ''}
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className='mt-2 space-y-4'>
                {(() => {
                  const sub = adjustTarget ? getUserSub(adjustTarget.id) : null;
                  if (!sub) return null;
                  return (
                    <div className='rounded-lg border border-violet-500/20 bg-violet-500/5 p-3'>
                      <p className='text-[10px] font-bold uppercase tracking-wider text-violet-400/70'>
                        Current Subscription
                      </p>
                      <div className='mt-1 flex items-center justify-between'>
                        <span className='text-[13px] font-bold text-white'>{sub.subscriptionName}</span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${sub.status?.toLowerCase() === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-500'}`}
                        >
                          {sub.status}
                        </span>
                      </div>
                      {sub.endDate && (
                        <p className='mt-0.5 text-[11px] text-slate-500'>
                          Expires on {format(new Date(sub.endDate), 'dd MMM yyyy')}
                        </p>
                      )}
                    </div>
                  );
                })()}

                {(() => {
                  const sub = adjustTarget ? getUserSub(adjustTarget.id) : null;
                  const endDateStr = sub?.endDate ? format(new Date(sub.endDate), 'dd MMM yyyy') : null;
                  return (
                    <div className='space-y-1.5'>
                      <label className='text-[11px] font-medium text-slate-500 uppercase tracking-wider'>
                        Change Status To
                      </label>
                      {endDateStr && (
                        <p className='text-[11px] text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded-md px-2.5 py-1.5'>
                          User retains full benefits until <span className='font-bold text-amber-300'>{endDateStr}</span>{' '}
                          regardless of status change.
                        </p>
                      )}
                      <div className='grid grid-cols-1 gap-2'>
                        {(['Active', 'Cancelled'] as const).map((s) => (
                          <button
                            key={s}
                            type='button'
                            onClick={() => setSelectedStatus(s)}
                            className={`flex items-center justify-between rounded-lg border p-3 text-left transition-all ${selectedStatus === s
                                ? s === 'Active'
                                  ? 'border-emerald-500 bg-emerald-500/10'
                                  : 'border-amber-500 bg-amber-500/10'
                                : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]'
                              }`}
                          >
                            <div>
                              <p
                                className={`text-[13px] font-bold ${selectedStatus === s
                                    ? s === 'Active'
                                      ? 'text-emerald-400'
                                      : 'text-amber-400'
                                    : 'text-white'
                                  }`}
                              >
                                {s}
                              </p>
                              <p className='text-[11px] text-slate-500'>
                                {s === 'Active'
                                  ? 'Activate or resume this subscription'
                                  : 'Cancel this subscription and stop renewals'}
                              </p>
                            </div>
                            {selectedStatus === s && (
                              <CheckCircle
                                className={`size-4 shrink-0 ${s === 'Active' ? 'text-emerald-400' : 'text-amber-400'}`}
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className='space-y-1.5'>
                  <label className='text-[11px] font-medium text-slate-500 uppercase tracking-wider'>
                    Adjustment Reason
                  </label>
                  <textarea
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder='Enter reason for this change (for notification/email)...'
                    className='w-full rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 text-[13px] text-white placeholder:text-slate-600 focus:border-violet-500/50 focus:outline-hidden min-h-[80px] resize-none'
                  />
                </div>
              </div>
              <DialogFooter className='mt-4 gap-2'>
                <Button
                  variant='ghost'
                  onClick={() => setAdjustTarget(null)}
                  disabled={isSubmitting}
                  className='h-9 text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-50'
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!adjustTarget || !selectedPlanId || !selectedStatus) return;
                    adjustSubMutation.mutate({
                      id: selectedPlanId,
                      status: selectedStatus,
                      reason: adjustReason.trim() || 'Admin adjustment'
                    });
                  }}
                  disabled={isSubmitting || !selectedPlanId || !selectedStatus}
                  className='h-9 bg-violet-600 text-[13px] text-white hover:bg-violet-700 disabled:opacity-70 disabled:cursor-not-allowed'
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='mr-2 size-4 animate-spin' /> Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* User Detail Modal */}
          <Dialog open={!!detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)}>
            <DialogContent className='max-w-lg p-0 gap-0 overflow-hidden'>
              {detailTarget && (() => {
                const detail = detailTarget;
                const detailDisplayName = getDisplayName(detail);
                const detailStatus = getUserStatus(detail);
                const detailSub = getUserSub(detail.id);
                const isAdmin = detail.roles.some((r: string) => r.toLowerCase() === 'admin');
                return (
                  <>
                    {/* Header */}
                    <div className='relative border-b border-white/[0.06] bg-gradient-to-br from-violet-500/[0.08] to-transparent px-6 pb-5 pt-6'>
                      <div className='flex items-start gap-4'>
                        {detail.avatarPresignedUrl ? (
                          <img
                            src={detail.avatarPresignedUrl}
                            alt={detailDisplayName}
                            className='size-16 shrink-0 rounded-full object-cover ring-2 ring-violet-500/20'
                          />
                        ) : (
                          <div className='flex size-16 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xl font-bold text-violet-300 ring-2 ring-violet-500/20'>
                            {detailDisplayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-center gap-2'>
                            <h3 className='truncate text-lg font-bold text-white'>{detailDisplayName}</h3>
                            {isAdmin && <Shield className='size-4 shrink-0 text-violet-400' />}
                          </div>
                          {detail.username && (
                            <p className='text-[13px] text-slate-400'>@{detail.username}</p>
                          )}
                          <div className='mt-2 flex flex-wrap items-center gap-1.5'>
                            {detail.roles.map((r: string) => (
                              <span
                                key={r}
                                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${r.toLowerCase() === 'admin' ? 'bg-violet-500/10 text-violet-400' : 'bg-sky-500/10 text-sky-400'}`}
                              >
                                {r}
                              </span>
                            ))}
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[detailStatus]}`}>
                              {detailStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className='space-y-4 px-6 py-5'>
                      {/* Account Info */}
                      <div>
                        <p className='mb-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500'>Account Information</p>
                        <div className='grid grid-cols-2 gap-x-6 gap-y-3'>
                          <div className='flex items-center gap-2.5'>
                            <div className='flex size-7 shrink-0 items-center justify-center rounded-md bg-white/[0.04]'>
                              <Mail className='size-3.5 text-slate-400' />
                            </div>
                            <div className='min-w-0'>
                              <p className='text-[10px] text-slate-500'>Email</p>
                              <p className='truncate text-[12px] text-white'>{detail.email}</p>
                            </div>
                          </div>
                          <div className='flex items-center gap-2.5'>
                            <div className='flex size-7 shrink-0 items-center justify-center rounded-md bg-white/[0.04]'>
                              <Phone className='size-3.5 text-slate-400' />
                            </div>
                            <div className='min-w-0'>
                              <p className='text-[10px] text-slate-500'>Phone</p>
                              <p className='truncate text-[12px] text-white'>{detail.phoneNumber || '—'}</p>
                            </div>
                          </div>
                          <div className='flex items-center gap-2.5'>
                            <div className='flex size-7 shrink-0 items-center justify-center rounded-md bg-white/[0.04]'>
                              <Eye className='size-3.5 text-slate-400' />
                            </div>
                            <div>
                              <p className='text-[10px] text-slate-500'>Email Verified</p>
                              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${detail.emailVerified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                {detail.emailVerified ? 'Verified' : 'Unverified'}
                              </span>
                            </div>
                          </div>
                          <div className='flex items-center gap-2.5'>
                            <div className='flex size-7 shrink-0 items-center justify-center rounded-md bg-white/[0.04]'>
                              <Globe className='size-3.5 text-slate-400' />
                            </div>
                            <div>
                              <p className='text-[10px] text-slate-500'>Provider</p>
                              <p className='text-[12px] text-white capitalize'>{detail.provider || 'Local'}</p>
                            </div>
                          </div>
                          <div className='flex items-center gap-2.5'>
                            <div className='flex size-7 shrink-0 items-center justify-center rounded-md bg-white/[0.04]'>
                              <Coins className='size-3.5 text-slate-400' />
                            </div>
                            <div>
                              <p className='text-[10px] text-slate-500'>MeAI Coins</p>
                              <p className='text-[12px] font-semibold text-amber-400'>{detail.meAiCoin ?? 0}</p>
                            </div>
                          </div>
                          <div className='flex items-center gap-2.5'>
                            <div className='flex size-7 shrink-0 items-center justify-center rounded-md bg-white/[0.04]'>
                              <CalendarIcon className='size-3.5 text-slate-400' />
                            </div>
                            <div>
                              <p className='text-[10px] text-slate-500'>Joined</p>
                              <p className='text-[12px] text-white'>{detail.createdAt ? format(new Date(detail.createdAt), 'dd MMM yyyy') : '—'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Subscription Info */}
                      {!isAdmin && (
                        <div>
                          <p className='mb-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500'>Subscription</p>
                          {detailSub ? (
                            <div className='rounded-lg border border-violet-500/20 bg-violet-500/[0.04] p-3'>
                              <div className='flex items-center justify-between'>
                                <span className='text-[13px] font-bold text-white'>{detailSub.subscriptionName}</span>
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${detailSub.status?.toLowerCase() === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-500'}`}>
                                  {detailSub.status || 'N/A'}
                                </span>
                              </div>
                              {detailSub.endDate && (
                                <p className='mt-1 text-[11px] text-slate-500'>
                                  Expires on {format(new Date(detailSub.endDate), 'dd MMM yyyy')}
                                </p>
                              )}
                              {detailSub.pricePaid != null && (
                                <p className='mt-0.5 text-[11px] text-slate-500'>
                                  Paid: <span className='font-medium text-slate-300'>${detailSub.pricePaid.toLocaleString()}</span>
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className='rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center text-[12px] text-slate-500'>
                              Free User — No active subscription
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className='flex items-center gap-2 border-t border-white/[0.06] bg-white/[0.02] px-6 py-4'>
                      <Button
                        size='sm'
                        onClick={() => openEdit(detail)}
                        className='h-8 gap-1.5 bg-violet-600 px-3 text-[12px] font-medium text-white hover:bg-violet-700'
                      >
                        <Pencil className='size-3' />
                        Edit
                      </Button>
                      {!isAdmin && (
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => {
                            const sub = getUserSub(detail.id);
                            setAdjustTarget(detail);
                            setSelectedPlanId(sub?.userSubscriptionId || '');
                            setSelectedStatus(sub?.status || 'Active');
                            setAdjustReason('');
                          }}
                          className='h-8 gap-1.5 border border-violet-500/20 bg-violet-500/[0.06] px-3 text-[12px] font-medium text-violet-400 hover:bg-violet-500/15 hover:text-violet-300'
                        >
                          <CardIcon className='size-3' />
                          Subscription
                        </Button>
                      )}
                      <div className='flex-1' />
                      {!isAdmin && (
                        detail.isDeleted ? (
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => setActivateTarget(detail)}
                            className='h-8 gap-1.5 border border-emerald-500/20 bg-emerald-500/[0.06] px-3 text-[12px] font-medium text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300'
                          >
                            <RotateCcw className='size-3' />
                            Unban
                          </Button>
                        ) : (
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => setDeleteTarget(detail)}
                            className='h-8 gap-1.5 border border-red-500/20 bg-red-500/[0.06] px-3 text-[12px] font-medium text-red-400 hover:bg-red-500/15 hover:text-red-300'
                          >
                            <Trash2 className='size-3' />
                            Ban
                          </Button>
                        )
                      )}
                    </div>
                  </>
                );
              })()}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
