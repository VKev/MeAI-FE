import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Filter, MoreVertical, ArrowUp, ArrowDown, CalendarIcon, Trash2, Shield, AlertTriangle, Pencil, UserPlus, Loader2, RotateCcw, CheckCircle, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast, Toaster } from 'sonner';
import { useLoaderData, useFetcher, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { requireUser, hasRole } from '@/services/server/session.server';
import { fetchAdminUsers, deleteAdminUser, updateAdminUserRole, createAdminUser, updateAdminUser, activateAdminUser } from '@/services/server/admin.server';
import type { AdminUser } from '@/models/admin.model';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (!hasRole(user, 'admin')) {
    throw new Response('Forbidden', { status: 403 });
  }

  try {
    const data = await fetchAdminUsers(request);
    return { users: data.value ?? [], error: null };
  } catch (error: any) {
    console.error('[Admin Users] Fetch error:', error?.response?.data || error.message);
    return { users: [], error: 'Failed to load users' };
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  if (!hasRole(user, 'admin')) {
    return { success: false, error: 'Forbidden' };
  }

  const formData = await request.formData();
  const intent = formData.get('intent') as string;

  try {
    if (intent === 'delete') {
      const userId = formData.get('userId') as string;
      const res = await deleteAdminUser(request, userId);
      return { success: res.isSuccess, error: res.isSuccess ? null : res.error?.description, intent: 'delete' };
    }

    if (intent === 'updateRole') {
      const userId = formData.get('userId') as string;
      const role = formData.get('role') as string;
      await updateAdminUserRole(request, userId, role);
      return { success: true, error: null, intent: 'updateRole' };
    }

    if (intent === 'create') {
      const payload = {
        username: formData.get('username') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        fullName: (formData.get('fullName') as string) || null,
        phoneNumber: (formData.get('phoneNumber') as string) || null,
        role: (formData.get('role') as string) || null,
      };
      const res = await createAdminUser(request, payload);
      return { success: res.isSuccess, error: res.isSuccess ? null : res.error?.description, intent: 'create' };
    }

    if (intent === 'update') {
      const userId = formData.get('userId') as string;
      const payload: Record<string, any> = {};
      const fields = ['username', 'email', 'fullName', 'phoneNumber'] as const;
      for (const f of fields) {
        const val = formData.get(f);
        if (val !== null && val !== '') payload[f] = val as string;
      }
      const emailVerified = formData.get('emailVerified');
      if (emailVerified !== null) payload.emailVerified = emailVerified === 'true';
      const res = await updateAdminUser(request, userId, payload);
      return { success: res.isSuccess, error: res.isSuccess ? null : res.error?.description, intent: 'update' };
    }

    if (intent === 'activate') {
      const userId = formData.get('userId') as string;
      const res = await activateAdminUser(request, userId);
      return { success: res.isSuccess, error: res.isSuccess ? null : res.error?.description, intent: 'activate' };
    }

    if (intent === 'bulkDelete') {
      const userIds = (formData.get('userIds') as string).split(',');
      let failed = 0;
      for (const uid of userIds) {
        try { await deleteAdminUser(request, uid); } catch { failed++; }
      }
      if (failed === 0) return { success: true, error: null, intent: 'bulkDelete', count: userIds.length };
      return { success: false, error: `Failed to delete ${failed} of ${userIds.length} users`, intent: 'bulkDelete' };
    }

    return { success: false, error: 'Unknown action', intent };
  } catch (error: any) {
    const apiError = error?.response?.data;
    console.error('[Admin Users] Action error:', apiError || error.message);
    const errorMessage = apiError?.detail || apiError?.error?.description || 'Action failed';
    return { success: false, error: errorMessage, intent };
  }
}

type UserStatus = 'Active' | 'Deleted';

const ITEMS_PER_PAGE = 8;
const ALL_ROLES = ['Admin', 'User'];
const ALL_STATUSES: UserStatus[] = ['Active', 'Deleted'];

const STATUS_STYLES: Record<UserStatus, string> = {
  Active: 'bg-emerald-500/10 text-emerald-400',
  Deleted: 'bg-red-500/10 text-red-400',
};

type SortKey = 'profile' | 'date' | 'status';
type SortDir = 'asc' | 'desc';

const STATUS_ORDER: Record<UserStatus, number> = { Active: 0, Deleted: 1 };

function getUserStatus(u: AdminUser): UserStatus {
  return u.isDeleted ? 'Deleted' : 'Active';
}

function getDisplayName(u: AdminUser): string {
  return u.fullName || u.username || u.email;
}

const inputCls = 'h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-[13px] text-white placeholder:text-slate-500 outline-none focus:border-violet-500/40';

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

function RoleDropdown({ value, onChange, classNameStr = '', includeAll = false }: { value: string, onChange: (v: string) => void, classNameStr?: string, includeAll?: boolean }) {
  const [open, setOpen] = useState(false);
  const options = includeAll ? ['all', ...ALL_ROLES.map(r => r.toLowerCase())] : ALL_ROLES.map(r => r.toLowerCase());
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={`flex w-full items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-white outline-none transition-colors hover:border-violet-500/40 focus:border-violet-500/40 ${classNameStr}`}>
          <span className="capitalize">{value === 'all' ? 'All Roles' : value || 'User'}</span>
          <ChevronDown className="size-4 text-slate-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] border border-white/[0.08] bg-[#1a1a24] p-1 shadow-xl" align="start">
        {options.map((r) => (
          <div
            key={r}
            onClick={() => { onChange(r); setOpen(false); }}
            className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-[13px] transition-colors hover:bg-white/[0.06] hover:text-white ${value === r ? 'text-white bg-white/[0.03]' : 'text-slate-300'}`}
          >
            <span className="capitalize">{r === 'all' ? 'All Roles' : r}</span>
            {value === r && <Check className="size-4 text-violet-400" />}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export default function AdminUsers() {
  const { users, error } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== 'idle';

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ username: '', email: '', password: '', fullName: '', phoneNumber: '', role: 'user' });
  const [createError, setCreateError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ username: '', email: '', fullName: '', phoneNumber: '', emailVerified: false });
  const [editError, setEditError] = useState<string | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [roleValue, setRoleValue] = useState('');
  const [roleError, setRoleError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [activateTarget, setActivateTarget] = useState<AdminUser | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const { intent, success, error } = fetcher.data;
      if (intent === 'create') {
        if (success) {
          setShowCreate(false);
          setCreateForm({ username: '', email: '', password: '', fullName: '', phoneNumber: '', role: 'user' });
          setCreateError(null);
          toast.success('User created successfully');
        } else setCreateError(error || 'Failed to create user');
      } else if (intent === 'update') {
        if (success) {
          setEditTarget(null);
          setEditError(null);
          toast.success('User updated successfully');
        } else setEditError(error || 'Failed to update user');
      } else if (intent === 'updateRole') {
        if (success) {
          setRoleTarget(null);
          setRoleError(null);
          toast.success('Role updated successfully');
        } else setRoleError(error || 'Failed to update role');
      } else if (intent === 'delete') {
        if (success) {
          setDeleteTarget(null);
          setDeleteError(null);
          toast.success('User deleted successfully');
        } else setDeleteError(error || 'Failed to delete user');
      } else if (intent === 'activate') {
        if (success) {
          setActivateTarget(null);
          toast.success('User activated successfully');
        } else toast.error(error || 'Failed to activate user');
      } else if (intent === 'bulkDelete') {
        setShowBulkDelete(false);
        if (success) {
          setSelectedIds(new Set());
          toast.success(`${fetcher.data?.count || ''} users deleted successfully`);
        } else toast.error(error || 'Bulk delete failed');
      }
    }
  }, [fetcher.state, fetcher.data]);

  const handleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev?.key === key) return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
      return { key, dir: 'asc' };
    });
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
    let result = (users ?? []).filter((u) => {
      const q = search.toLowerCase();
      const displayName = getDisplayName(u).toLowerCase();
      const matchSearch = u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || displayName.includes(q);
      const matchRole = filterRole === 'all' || u.roles.some((r) => r.toLowerCase() === filterRole.toLowerCase());
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
        }
        else if (sort.key === 'status') cmp = STATUS_ORDER[getUserStatus(a)] - STATUS_ORDER[getUserStatus(b)];
        return sort.dir === 'desc' ? -cmp : cmp;
      });
    }

    return result;
  }, [users, search, filterRole, filterStatus, dateFrom, dateTo, sort]);

  const totalPages = Math.ceil(processed.length / ITEMS_PER_PAGE);
  const paginated = processed.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleSelectAll = () => {
    const visibleIds = paginated.map((u) => u.id);
    const allSelected = visibleIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => allSelected ? next.delete(id) : next.add(id));
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

  const allPageSelected = paginated.length > 0 && paginated.every((u) => selectedIds.has(u.id));

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    fetcher.submit({ intent: 'delete', userId: deleteTarget.id }, { method: 'post' });
  };

  const handleCreate = () => {
    setCreateError(null);
    fetcher.submit({ intent: 'create', ...createForm }, { method: 'post' });
  };

  const openEdit = (u: AdminUser) => {
    setEditForm({
      username: u.username || '',
      email: u.email || '',
      fullName: u.fullName || '',
      phoneNumber: u.phoneNumber || '',
      emailVerified: u.emailVerified,
    });
    setEditError(null);
    setEditTarget(u);
  };

  const handleEdit = () => {
    if (!editTarget) return;
    setEditError(null);
    fetcher.submit({ intent: 'update', userId: editTarget.id, ...editForm, emailVerified: String(editForm.emailVerified) }, { method: 'post' });
  };

  const openRole = (u: AdminUser) => {
    setRoleValue(u.roles[0]?.toLowerCase() || 'user');
    setRoleError(null);
    setRoleTarget(u);
  };

  const handleRole = () => {
    if (!roleTarget) return;
    setRoleError(null);
    fetcher.submit({ intent: 'updateRole', userId: roleTarget.id, role: roleValue }, { method: 'post' });
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
            info: 'bg-[rgba(19,19,30,0.95)] text-white',
          },
          style: {
            borderRadius: '0.75rem',
            padding: '12px 16px',
            gap: '10px',
          }
        }}
      />
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-xl font-bold text-white'>User</h1>
        <Button onClick={() => { setShowCreate(true); setCreateError(null); }} className='h-9 bg-violet-600 px-4 text-[13px] font-medium text-white hover:bg-violet-700'>
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
                <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>Role</label>
                <RoleDropdown 
                  value={filterRole} 
                  onChange={(val) => { setFilterRole(val); setPage(1); }} 
                  classNameStr="h-8 text-[12px]" 
                  includeAll
                />
              </div>
              <div>
                <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                  className='h-8 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[12px] text-white outline-none focus:border-violet-500/30'
                >
                  <option value='all' className='bg-[#13131e]'>All Status</option>
                  {ALL_STATUSES.map((s) => <option key={s} value={s} className='bg-[#13131e]'>{s}</option>)}
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
              <Button variant='ghost' size='sm' onClick={resetFilters} className='h-7 text-[12px] text-slate-400 hover:bg-white/[0.06] hover:text-white'>
                Reset
              </Button>
              <Button size='sm' onClick={() => setShowFilter(false)} className='h-7 bg-violet-600 text-[12px] text-white hover:bg-violet-700'>
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
              Delete Selected
            </button>
            <button
              type='button'
              onClick={() => setSelectedIds(new Set())}
              className='text-[13px] text-slate-400 hover:text-white transition-colors'
            >
              Clear selection
            </button>
            <span className='ml-auto text-[12px] text-slate-500'>
              <span className='font-medium text-white'>{selectedIds.size}</span> user{selectedIds.size > 1 ? 's' : ''} selected
            </span>
          </div>
        )}
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-white/[0.06]'>
                <th className='w-10 px-5 py-3'>
                  <input type='checkbox' checked={allPageSelected} onChange={toggleSelectAll} className='size-3.5 cursor-pointer rounded border-white/20 bg-transparent accent-violet-500' />
                </th>
                <SortableHeader label='Profile' sortKey='profile' currentSort={sort} onSort={handleSort} />
                <th className='px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Roles</th>
                <th className='px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Email Verified</th>
                <SortableHeader label='Date' sortKey='date' currentSort={sort} onSort={handleSort} />
                <SortableHeader label='Status' sortKey='status' currentSort={sort} onSort={handleSort} />
                <th className='w-10 px-4 py-3'></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? paginated.map((u) => {
                const displayName = getDisplayName(u);
                const status = getUserStatus(u);
                return (
                  <tr key={u.id} className='border-b border-white/[0.03] transition-colors last:border-0 hover:bg-white/[0.015]'>
                    <td className='px-5 py-3'>
                      <input type='checkbox' checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)} className='size-3.5 cursor-pointer rounded border-white/20 bg-transparent accent-violet-500' />
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        {u.avatarPresignedUrl ? (
                          <img src={u.avatarPresignedUrl} alt={displayName} className='size-9 shrink-0 rounded-full object-cover' />
                        ) : (
                          <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[12px] font-bold text-violet-300'>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className='text-[13px] font-medium text-white'>{displayName}</p>
                          <p className='text-[11px] text-slate-500'>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex flex-wrap items-center gap-1'>
                        {u.roles.slice(0, 2).map((r) => (
                          <span key={r} className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${r.toLowerCase() === 'admin' ? 'bg-violet-500/10 text-violet-400' : 'bg-sky-500/10 text-sky-400'}`}>{r}</span>
                        ))}
                        {u.roles.length > 2 && (
                          <span className='rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-slate-400'>+{u.roles.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${u.emailVerified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {u.emailVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-[12px] text-slate-400'>
                      {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className='px-4 py-3'>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status]}`}>
                        {status}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type='button' className='rounded p-1 text-slate-500 hover:bg-white/[0.05] hover:text-white'>
                            <MoreVertical className='size-4' />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className='w-40 p-1' align='end' sideOffset={4}>
                          {u.isDeleted ? (
                            <button type='button' onClick={() => setActivateTarget(u)} className='flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-emerald-400 hover:bg-emerald-500/10'>
                              <RotateCcw className='size-3.5' />
                              Activate
                            </button>
                          ) : (
                            <>
                              <button type='button' onClick={() => openEdit(u)} className='flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-slate-400 hover:bg-white/[0.06] hover:text-white'>
                                <Pencil className='size-3.5' />
                                Edit
                              </button>
                              <button type='button' onClick={() => openRole(u)} className='flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-slate-400 hover:bg-white/[0.06] hover:text-white'>
                                <Shield className='size-3.5' />
                                Change Role
                              </button>
                              <div className='my-1 border-t border-white/[0.06]' />
                              <button type='button' onClick={() => setDeleteTarget(u)} className='flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-red-400 hover:bg-red-500/10'>
                                <Trash2 className='size-3.5' />
                                Delete
                              </button>
                            </>
                          )}
                        </PopoverContent>
                      </Popover>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} className='py-12 text-center text-[13px] text-slate-500'>No users found</td></tr>
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

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-red-500/10'>
              <AlertTriangle className='size-6 text-red-400' />
            </div>
            <DialogTitle className='text-center'>Delete User</DialogTitle>
            <DialogDescription className='text-center'>
              Are you sure you want to delete{' '}
              <span className='font-medium text-white'>{deleteTarget ? getDisplayName(deleteTarget) : ''}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className='mt-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-400 text-center'>
              {deleteError}
            </div>
          )}
          <DialogFooter className='mt-2 gap-2 sm:justify-center'>
            <Button variant='ghost' onClick={() => setDeleteTarget(null)} disabled={isSubmitting} className='h-9 text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-40'>
              Cancel
            </Button>
            <Button onClick={confirmDelete} disabled={isSubmitting} className='h-9 bg-red-600 text-[13px] text-white hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed'>
              {isSubmitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Deleting...</> : 'Delete'}
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
            <DialogTitle className='text-center'>Activate User</DialogTitle>
            <DialogDescription className='text-center'>
              Are you sure you want to reactivate{' '}
              <span className='font-medium text-white'>{activateTarget ? getDisplayName(activateTarget) : ''}</span>?
              This will restore their account access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-2 gap-2 sm:justify-center'>
            <Button variant='ghost' onClick={() => setActivateTarget(null)} disabled={isSubmitting} className='h-9 text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-40'>
              Cancel
            </Button>
            <Button onClick={() => { if (!activateTarget) return; fetcher.submit({ intent: 'activate', userId: activateTarget.id }, { method: 'post' }); }} disabled={isSubmitting} className='h-9 bg-emerald-600 text-[13px] text-white hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed'>
              {isSubmitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Activating...</> : 'Activate'}
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
            <DialogTitle className='text-center'>Delete {selectedIds.size} User{selectedIds.size > 1 ? 's' : ''}</DialogTitle>
            <DialogDescription className='text-center'>
              Are you sure you want to delete{' '}
              <span className='font-medium text-white'>{selectedIds.size} selected user{selectedIds.size > 1 ? 's' : ''}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-2 gap-2 sm:justify-center'>
            <Button variant='ghost' onClick={() => setShowBulkDelete(false)} disabled={isSubmitting} className='h-9 text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-40'>
              Cancel
            </Button>
            <Button onClick={() => { fetcher.submit({ intent: 'bulkDelete', userIds: Array.from(selectedIds).join(',') }, { method: 'post' }); }} disabled={isSubmitting} className='h-9 bg-red-600 text-[13px] text-white hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed'>
              {isSubmitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Deleting...</> : `Delete ${selectedIds.size} User${selectedIds.size > 1 ? 's' : ''}`}
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
              <label className='mb-1 block text-[11px] font-medium text-slate-500'>Username *</label>
              <input value={createForm.username} onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))} className={inputCls} placeholder='username' />
            </div>
            <div>
              <label className='mb-1 block text-[11px] font-medium text-slate-500'>Email *</label>
              <input type='email' value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} className={inputCls} placeholder='email@example.com' />
            </div>
            <div>
              <label className='mb-1 block text-[11px] font-medium text-slate-500'>Password *</label>
              <input type='password' value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} className={inputCls} placeholder='••••••••' />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='mb-1 block text-[11px] font-medium text-slate-500'>Full Name</label>
                <input value={createForm.fullName} onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))} className={inputCls} placeholder='Nguyễn Văn A' />
              </div>
              <div>
                <label className='mb-1 block text-[11px] font-medium text-slate-500'>Phone</label>
                <input value={createForm.phoneNumber} onChange={(e) => setCreateForm((f) => ({ ...f, phoneNumber: e.target.value }))} className={inputCls} placeholder='0901234567' />
              </div>
            </div>
            <div>
              <label className='mb-1 block text-[11px] font-medium text-slate-500'>Role</label>
              <RoleDropdown 
                value={createForm.role} 
                onChange={(val) => setCreateForm((f) => ({ ...f, role: val }))} 
                classNameStr="h-9 text-[13px]" 
              />
            </div>
          </div>
          <DialogFooter className='mt-4 gap-2'>
            <Button variant='ghost' onClick={() => setShowCreate(false)} disabled={isSubmitting} className='h-9 text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-50'>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting || !createForm.username || !createForm.email || !createForm.password || createForm.password.length < 6} className='h-9 bg-violet-600 text-[13px] text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed'>
              {isSubmitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Creating...</> : 'Create'}
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
              Update information for <span className='font-medium text-white'>{editTarget ? getDisplayName(editTarget) : ''}</span>
            </DialogDescription>
          </DialogHeader>
          <div className='mt-2 space-y-3'>
            {editError && (
              <div className='rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-400'>
                {editError}
              </div>
            )}
            <div>
              <label className='mb-1 block text-[11px] font-medium text-slate-500'>Username</label>
              <input value={editForm.username} onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className='mb-1 block text-[11px] font-medium text-slate-500'>Email</label>
              <input type='email' value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} className={inputCls} />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='mb-1 block text-[11px] font-medium text-slate-500'>Full Name</label>
                <input value={editForm.fullName} onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className='mb-1 block text-[11px] font-medium text-slate-500'>Phone</label>
                <input value={editForm.phoneNumber} onChange={(e) => setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <input type='checkbox' id='editEmailVerified' checked={editForm.emailVerified} onChange={(e) => setEditForm((f) => ({ ...f, emailVerified: e.target.checked }))} className='size-3.5 cursor-pointer rounded accent-violet-500' />
              <label htmlFor='editEmailVerified' className='cursor-pointer text-[12px] text-slate-300'>Email Verified</label>
            </div>
          </div>
          <DialogFooter className='mt-4 gap-2'>
            <Button variant='ghost' onClick={() => setEditTarget(null)} disabled={isSubmitting} className='h-9 text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-50'>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting || !editForm.username || !editForm.email} className='h-9 bg-violet-600 text-[13px] text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed'>
              {isSubmitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Saving...</> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!roleTarget} onOpenChange={(open) => !open && setRoleTarget(null)}>
        <DialogContent className='max-w-xs'>
          <DialogHeader>
            <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-violet-500/10'>
              <Shield className='size-6 text-violet-400' />
            </div>
            <DialogTitle className='text-center'>Change Role</DialogTitle>
            <DialogDescription className='text-center'>
              Update role for <span className='font-medium text-white'>{roleTarget ? getDisplayName(roleTarget) : ''}</span>
            </DialogDescription>
          </DialogHeader>
          <div className='mt-2'>
            {roleError && (
              <div className='mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-400'>
                {roleError}
              </div>
            )}
            <RoleDropdown 
              value={roleValue} 
              onChange={setRoleValue} 
              classNameStr="h-9 text-[13px]" 
            />
          </div>
          <DialogFooter className='mt-4 gap-2 sm:justify-center'>
            <Button variant='ghost' onClick={() => setRoleTarget(null)} disabled={isSubmitting} className='h-9 text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-50'>
              Cancel
            </Button>
            <Button onClick={handleRole} disabled={isSubmitting} className='h-9 bg-violet-600 text-[13px] text-white hover:bg-violet-700 disabled:opacity-70 disabled:cursor-not-allowed'>
              {isSubmitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Updating...</> : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
