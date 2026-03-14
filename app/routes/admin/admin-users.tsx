import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Filter, MoreVertical, ArrowUp, ArrowDown, X, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

type UserStatus = 'Active' | 'Pending' | 'Blocked' | 'Reported';

type AdminUser = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  lastActivity: string;
  lastActivityTime: string;
  status: UserStatus;
  createdAt: string;
};

const MOCK_USERS: AdminUser[] = [
  { id: 'u_001', username: 'admin01', email: 'admin@meai.vn', fullName: 'Admin MeAI', roles: ['Super Admin', 'Admin'], lastActivity: 'Created', lastActivityTime: '2 days ago', status: 'Active', createdAt: '2025-06-01T08:00:00Z' },
  { id: 'u_002', username: 'nguyenvana', email: 'a.nguyen@email.com', fullName: 'Nguyễn Văn A', roles: ['User'], lastActivity: 'Logout', lastActivityTime: '8 days ago', status: 'Blocked', createdAt: '2025-08-15T10:30:00Z' },
  { id: 'u_003', username: 'tranthib', email: 'b.tran@email.com', fullName: 'Trần Thị B', roles: ['User'], lastActivity: 'Subscribe', lastActivityTime: '6 days ago', status: 'Pending', createdAt: '2025-09-20T14:00:00Z' },
  { id: 'u_004', username: 'levanc', email: 'c.le@email.com', fullName: 'Lê Văn C', roles: ['Admin', 'User'], lastActivity: 'Created', lastActivityTime: '17 days ago', status: 'Active', createdAt: '2025-10-05T09:15:00Z' },
  { id: 'u_005', username: 'phamthid', email: 'd.pham@email.com', fullName: 'Phạm Thị D', roles: ['User'], lastActivity: 'Subscribe', lastActivityTime: '10 days ago', status: 'Reported', createdAt: '2025-11-12T16:00:00Z' },
  { id: 'u_006', username: 'hoangvane', email: 'e.hoang@email.com', fullName: 'Hoàng Văn E', roles: ['User'], lastActivity: 'Logout', lastActivityTime: '18 days ago', status: 'Blocked', createdAt: '2025-12-01T11:30:00Z' },
  { id: 'u_007', username: 'vuthif', email: 'f.vu@email.com', fullName: 'Vũ Thị F', roles: ['User'], lastActivity: 'Created', lastActivityTime: '13 days ago', status: 'Active', createdAt: '2026-01-08T08:45:00Z' },
  { id: 'u_008', username: 'dangvang', email: 'g.dang@email.com', fullName: 'Đặng Văn G', roles: ['User'], lastActivity: 'Subscribe', lastActivityTime: '1 day ago', status: 'Pending', createdAt: '2026-02-14T13:20:00Z' },
  { id: 'u_009', username: 'buithih', email: 'h.bui@email.com', fullName: 'Bùi Thị H', roles: ['User'], lastActivity: 'Logout', lastActivityTime: '15 days ago', status: 'Reported', createdAt: '2026-03-01T07:00:00Z' },
  { id: 'u_010', username: 'dovani', email: 'i.do@email.com', fullName: 'Đỗ Văn I', roles: ['User'], lastActivity: 'Created', lastActivityTime: '5 days ago', status: 'Active', createdAt: '2026-03-10T10:00:00Z' },
];

const ITEMS_PER_PAGE = 8;
const ALL_ROLES = ['Super Admin', 'Admin', 'User'];
const ALL_STATUSES: UserStatus[] = ['Active', 'Pending', 'Blocked', 'Reported'];

const STATUS_STYLES: Record<UserStatus, string> = {
  Active: 'bg-emerald-500/10 text-emerald-400',
  Pending: 'bg-amber-500/10 text-amber-400',
  Blocked: 'bg-red-500/10 text-red-400',
  Reported: 'bg-orange-500/10 text-orange-400',
};

type SortKey = 'profile' | 'date' | 'status';
type SortDir = 'asc' | 'desc';

const STATUS_ORDER: Record<UserStatus, number> = { Active: 0, Pending: 1, Reported: 2, Blocked: 3 };

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

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  // Filters
  const [filterRole, setFilterRole] = useState<string>('all');
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
    setFilterRole('all');
    setFilterStatus('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  const hasActiveFilters = filterRole !== 'all' || filterStatus !== 'all' || dateFrom || dateTo;

  const processed = useMemo(() => {
    let result = MOCK_USERS.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch = u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q);
      const matchRole = filterRole === 'all' || u.roles.some((r) => r === filterRole);
      const matchStatus = filterStatus === 'all' || u.status === filterStatus;
      const created = new Date(u.createdAt);
      const matchDateFrom = !dateFrom || created >= dateFrom;
      const matchDateTo = !dateTo || created <= new Date(dateTo.getTime() + 86400000 - 1);
      return matchSearch && matchRole && matchStatus && matchDateFrom && matchDateTo;
    });

    if (sort) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sort.key === 'profile') cmp = a.fullName.localeCompare(b.fullName);
        else if (sort.key === 'date') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        else if (sort.key === 'status') cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        return sort.dir === 'desc' ? -cmp : cmp;
      });
    }

    return result;
  }, [search, filterRole, filterStatus, dateFrom, dateTo, sort]);

  const totalPages = Math.ceil(processed.length / ITEMS_PER_PAGE);
  const paginated = processed.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-xl font-bold text-white'>User</h1>
        <Button className='h-9 bg-violet-600 px-4 text-[13px] font-medium text-white hover:bg-violet-700'>
          + Add New
        </Button>
      </div>

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
              {/* Role */}
              <div>
                <label className='mb-1.5 block text-[11px] font-medium text-slate-500'>Role</label>
                <select
                  value={filterRole}
                  onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
                  className='h-8 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[12px] text-white outline-none focus:border-violet-500/30'
                >
                  <option value='all' className='bg-[#13131e]'>All Roles</option>
                  {ALL_ROLES.map((r) => <option key={r} value={r} className='bg-[#13131e]'>{r}</option>)}
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
                  {ALL_STATUSES.map((s) => <option key={s} value={s} className='bg-[#13131e]'>{s}</option>)}
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
                <SortableHeader label='Profile' sortKey='profile' currentSort={sort} onSort={handleSort} />
                <th className='px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Roles</th>
                <th className='px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Last Activity</th>
                <SortableHeader label='Date' sortKey='date' currentSort={sort} onSort={handleSort} />
                <SortableHeader label='Status' sortKey='status' currentSort={sort} onSort={handleSort} />
                <th className='w-10 px-4 py-3'></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? paginated.map((u) => (
                <tr key={u.id} className='border-b border-white/[0.03] transition-colors last:border-0 hover:bg-white/[0.015]'>
                  <td className='px-5 py-3'>
                    <input type='checkbox' className='size-3.5 rounded border-white/20 bg-transparent accent-violet-500' />
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-3'>
                      <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[12px] font-bold text-violet-300'>
                        {u.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className='text-[13px] font-medium text-white'>{u.fullName}</p>
                        <p className='text-[11px] text-slate-500'>{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex flex-wrap items-center gap-1'>
                      {u.roles.slice(0, 2).map((r) => (
                        <span key={r} className='text-[11px] text-slate-300'>{r}</span>
                      ))}
                      {u.roles.length > 2 && (
                        <span className='rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-slate-400'>+{u.roles.length - 2} more</span>
                      )}
                    </div>
                  </td>
                  <td className='px-4 py-3'>
                    <p className='text-[12px] text-white'>{u.lastActivity}</p>
                    <p className='text-[10px] text-slate-500'>{u.lastActivityTime}</p>
                  </td>
                  <td className='px-4 py-3 text-[12px] text-slate-400'>{format(new Date(u.createdAt), 'dd MMM yyyy')}</td>
                  <td className='px-4 py-3'>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[u.status]}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className='px-4 py-3'>
                    <button type='button' className='rounded p-1 text-slate-500 hover:bg-white/[0.05] hover:text-white'>
                      <MoreVertical className='size-4' />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className='py-12 text-center text-[13px] text-slate-500'>No users found</td></tr>
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
