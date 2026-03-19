import { Users, Eye, TrendingUp, UserPlus, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

// ── Mock Data ──────────────────────────────────────────────
const STATS = [
  { label: 'Unique Visitors', value: '1,248', change: 24.5, isUp: true, icon: Users, compareText: 'Compare to last week' },
  { label: 'Page View', value: '30,450', change: 20.5, isUp: true, icon: Eye, compareText: 'Compare to last week' },
  { label: 'Total Revenue', value: '48.5M', change: 12.3, isUp: false, icon: TrendingUp, compareText: 'Compare to last month' },
  { label: 'New Users', value: '87', change: 8.2, isUp: true, icon: UserPlus, compareText: 'Compare to last week' },
];

type RecentTransaction = {
  id: string;
  userName: string;
  userEmail: string;
  plan: string;
  amount: number;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  createdAt: string;
};

type RecentUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  lastActivity: string;
  status: 'Active' | 'Pending' | 'Blocked';
  createdAt: string;
};

const MOCK_RECENT_TRANSACTIONS: RecentTransaction[] = [
  { id: 'txn_101', userName: 'Nguyen Van A', userEmail: 'a.nguyen@email.com', plan: 'Pro Plan', amount: 199_000, status: 'succeeded', createdAt: '2026-03-13T09:15:00Z' },
  { id: 'txn_102', userName: 'Tran Thi B', userEmail: 'b.tran@email.com', plan: 'Starter Plan', amount: 99_000, status: 'succeeded', createdAt: '2026-03-12T14:30:00Z' },
  { id: 'txn_103', userName: 'Le Van C', userEmail: 'c.le@email.com', plan: 'Pro Plan', amount: 199_000, status: 'pending', createdAt: '2026-03-12T10:00:00Z' },
  { id: 'txn_104', userName: 'Pham Thi D', userEmail: 'd.pham@email.com', plan: 'Pro Plan', amount: 199_000, status: 'failed', createdAt: '2026-03-11T16:45:00Z' },
  { id: 'txn_105', userName: 'Hoang Van E', userEmail: 'e.hoang@email.com', plan: 'Starter Plan', amount: 99_000, status: 'succeeded', createdAt: '2026-03-10T08:20:00Z' },
];

const MOCK_RECENT_USERS: RecentUser[] = [
  { id: 'u_301', username: 'nguyenvana', email: 'a.nguyen@email.com', role: 'admin', lastActivity: 'Created', status: 'Active', createdAt: '2026-03-13T11:00:00Z' },
  { id: 'u_302', username: 'tranthib', email: 'b.tran@email.com', role: 'user', lastActivity: 'Logout', status: 'Pending', createdAt: '2026-03-12T09:30:00Z' },
  { id: 'u_303', username: 'levanc', email: 'c.le@email.com', role: 'user', lastActivity: 'Subscribe', status: 'Active', createdAt: '2026-03-11T15:00:00Z' },
  { id: 'u_304', username: 'phamthid', email: 'd.pham@email.com', role: 'user', lastActivity: 'Created', status: 'Blocked', createdAt: '2026-03-10T12:45:00Z' },
  { id: 'u_305', username: 'hoangvane', email: 'e.hoang@email.com', role: 'user', lastActivity: 'Logout', status: 'Active', createdAt: '2026-03-09T08:00:00Z' },
];

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const TX_STATUS: Record<string, string> = {
  succeeded: 'bg-emerald-500/10 text-emerald-400',
  pending: 'bg-amber-500/10 text-amber-400',
  failed: 'bg-red-500/10 text-red-400',
  refunded: 'bg-slate-500/10 text-slate-400',
};

const USER_STATUS: Record<string, string> = {
  Active: 'bg-emerald-500/10 text-emerald-400',
  Pending: 'bg-amber-500/10 text-amber-400',
  Blocked: 'bg-red-500/10 text-red-400',
};

export default function AdminDashboard() {
  return (
    <div>
      {/* Page title */}
      <h1 className='mb-6 text-xl font-bold text-white'>Overview</h1>

      {/* Stat Cards — SaaSable style */}
      <div className='mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className='rounded-xl border border-white/[0.06] bg-[#13131e] p-5'
            >
              <p className='mb-3 text-[13px] text-slate-400'>{s.label}</p>
              <div className='flex items-end justify-between'>
                <p className='text-[28px] font-bold leading-none text-white'>{s.value}</p>
                <div
                  className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}
                >
                  {s.isUp ? <ArrowUpRight className='size-3' /> : <ArrowDownRight className='size-3' />}
                  {s.change}%
                </div>
              </div>
              <p className='mt-2 text-[11px] text-slate-500'>{s.compareText}</p>
            </div>
          );
        })}
      </div>

      {/* Two tables — SaaSable layout */}
      <div className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
        {/* Recent Transactions */}
        <div className='rounded-xl border border-white/[0.06] bg-[#13131e]'>
          <div className='flex items-center justify-between border-b border-white/[0.06] px-5 py-4'>
            <h2 className='text-[14px] font-semibold text-white'>Recent Transactions</h2>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-white/[0.04]'>
                  <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>User</th>
                  <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Amount</th>
                  <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Status</th>
                  <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Date</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RECENT_TRANSACTIONS.map((t) => (
                  <tr key={t.id} className='border-b border-white/[0.03] last:border-0'>
                    <td className='px-5 py-3'>
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
                    <td className='px-5 py-3 text-[13px] font-medium text-white'>{fmtCurrency(t.amount)}</td>
                    <td className='px-5 py-3'>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${TX_STATUS[t.status]}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className='px-5 py-3 text-[12px] text-slate-400'>{format(new Date(t.createdAt), 'dd MMM yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Users */}
        <div className='rounded-xl border border-white/[0.06] bg-[#13131e]'>
          <div className='flex items-center justify-between border-b border-white/[0.06] px-5 py-4'>
            <h2 className='text-[14px] font-semibold text-white'>Recent Users</h2>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-white/[0.04]'>
                  <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Profile</th>
                  <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Role</th>
                  <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Last Activity</th>
                  <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Date</th>
                  <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RECENT_USERS.map((u) => (
                  <tr key={u.id} className='border-b border-white/[0.03] last:border-0'>
                    <td className='px-5 py-3'>
                      <div className='flex items-center gap-3'>
                        <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-[11px] font-bold text-sky-300'>
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className='text-[13px] font-medium text-white'>{u.username}</p>
                          <p className='text-[11px] text-slate-500'>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-5 py-3'>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${u.role === 'admin' ? 'bg-violet-500/10 text-violet-400' : 'bg-sky-500/10 text-sky-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className='px-5 py-3 text-[12px] text-slate-400'>{u.lastActivity}</td>
                    <td className='px-5 py-3 text-[12px] text-slate-400'>{format(new Date(u.createdAt), 'dd MMM yyyy')}</td>
                    <td className='px-5 py-3'>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${USER_STATUS[u.status]}`}>
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
