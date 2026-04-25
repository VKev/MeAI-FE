import { Users, Eye, TrendingUp, UserPlus, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { requireUser, hasRole } from '@/services/server/session.server';
import { fetchAdminUsers, fetchAdminTransactions } from '@/services/server/admin.server';
import type { AdminUser, AdminTransaction } from '@/models/admin.model';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (!hasRole(user, 'admin')) {
    throw new Response('Forbidden', { status: 403 });
  }

  try {
    const usersRes = await fetchAdminUsers(request);
    const txRes = await fetchAdminTransactions(request);

    return {
      users: usersRes.value ?? [],
      transactions: txRes.value ?? [],
      error: null
    };
  } catch (error: any) {
    console.error('[Admin Dashboard] Fetch error:', error?.response?.data || error.message);
    return { users: [], transactions: [], error: 'Failed to load dashboard data' };
  }
}

const fmtCurrency = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const TX_STATUS: Record<string, string> = {
  succeeded: 'bg-emerald-500/10 text-emerald-400',
  incomplete: 'bg-amber-500/10 text-amber-400',
  requires_payment_method: 'bg-orange-500/10 text-orange-400'
};

const getStatusConfig = (status: string) => TX_STATUS[status.toLowerCase()] || 'bg-slate-500/10 text-slate-400';

const USER_STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-500/10 text-emerald-400',
  Deleted: 'bg-red-500/10 text-red-400'
};

export default function AdminDashboard() {
  const { users, transactions, error } = useLoaderData<typeof loader>();

  const now = new Date().getTime();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const totalUsers = users.length;
  const newUsers = users.filter((u) => u.createdAt && new Date(u.createdAt).getTime() >= sevenDaysAgo).length;

  const succeededTx = transactions.filter((t) => t.status.toLowerCase() === 'succeeded');
  const totalRevenue = succeededTx.reduce((sum, t) => sum + (t.cost || 0), 0);
  const activeSubs = succeededTx.length;

  const STATS = [
    {
      label: 'Total Users',
      value: totalUsers.toString(),
      change: '+0',
      isUp: true,
      icon: Users,
      compareText: 'Lifetime total'
    },
    {
      label: 'Successful Transactions',
      value: activeSubs.toString(),
      change: '+0',
      isUp: true,
      icon: Eye,
      compareText: 'Paid transactions'
    },
    {
      label: 'Total Revenue',
      value: fmtCurrency(totalRevenue),
      change: '+0',
      isUp: true,
      icon: TrendingUp,
      compareText: 'Lifetime revenue'
    },
    {
      label: 'New Users',
      value: newUsers.toString(),
      change: '+0',
      isUp: true,
      icon: UserPlus,
      compareText: 'Last 7 days'
    }
  ];

  const recentTx = [...transactions]
    .sort(
      (a, b) =>
        (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)
    )
    .slice(0, 5);
  const recentUsrs = [...users]
    .sort(
      (a, b) =>
        (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)
    )
    .slice(0, 5);
  return (
    <div className='flex flex-col gap-6'>
      {/* Page title */}
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold text-white'>Overview</h1>
      </div>

      {error && (
        <div className='rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-400'>
          {error}
        </div>
      )}

      {/* Stat Cards — SaaSable style */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div className='relative overflow-hidden rounded-xl border border-emerald-500/10 bg-[#13131e] p-5'>
              <div className='mb-3 flex items-center gap-2'>
                <div className='flex size-10 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400'>
                  <Icon className='size-5' />
                </div>
                <p className='text-md font-medium text-slate-400'>{s.label}</p>
              </div>
              <p className='text-3xl font-bold text-white px-2'>{s.value}</p>
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
                  <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>
                    User
                  </th>
                  <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>
                    Amount
                  </th>
                  <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>
                    Status
                  </th>
                  <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentTx.length > 0 ? (
                  recentTx.map((t) => {
                    const displayName = t.user?.fullName || t.user?.username || 'Unknown';
                    return (
                      <tr key={t.id} className='border-b border-white/[0.03] last:border-0'>
                        <td className='px-5 py-3'>
                          <div className='flex items-center gap-3'>
                            <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[11px] font-bold text-violet-300'>
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className='text-[13px] font-medium text-white'>{displayName}</p>
                              <p className='text-[11px] text-slate-500'>{t.user?.email || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className='px-5 py-3 text-[13px] font-medium text-white'>{fmtCurrency(t.cost)}</td>
                        <td className='px-5 py-3'>
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${getStatusConfig(t.status)}`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className='px-5 py-3 text-[12px] text-slate-400'>
                          {format(new Date(t.createdAt), 'dd MMM yyyy')}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className='py-8 text-center text-[13px] text-slate-500'>
                      No recent transactions
                    </td>
                  </tr>
                )}
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
                  <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>
                    Profile
                  </th>
                  <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>
                    Role
                  </th>
                  <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>
                    Last Activity
                  </th>
                  <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>
                    Date
                  </th>
                  <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentUsrs.length > 0 ? (
                  recentUsrs.map((u) => {
                    const displayName = u.fullName || u.username || u.email;
                    const status = u.isDeleted ? 'Deleted' : 'Active';
                    return (
                      <tr key={u.id} className='border-b border-white/[0.03] last:border-0'>
                        <td className='px-5 py-3'>
                          <div className='flex items-center gap-3'>
                            {u.avatarPresignedUrl ? (
                              <img
                                src={u.avatarPresignedUrl}
                                alt={displayName}
                                className='size-8 shrink-0 rounded-full object-cover'
                              />
                            ) : (
                              <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-[11px] font-bold text-sky-300'>
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className='text-[13px] font-medium text-white'>{displayName}</p>
                              <p className='text-[11px] text-slate-500'>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className='px-5 py-3'>
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${u.roles?.includes('Admin') ? 'bg-violet-500/10 text-violet-400' : 'bg-sky-500/10 text-sky-400'}`}
                          >
                            {u.roles[0] || 'User'}
                          </span>
                        </td>
                        <td className='px-5 py-3 text-[12px] text-slate-400'>
                          {u.emailVerified ? 'Verified' : 'Unverified'}
                        </td>
                        <td className='px-5 py-3 text-[12px] text-slate-400'>
                          {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '—'}
                        </td>
                        <td className='px-5 py-3'>
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${USER_STATUS_STYLES[status]}`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className='py-8 text-center text-[13px] text-slate-500'>
                      No recent users
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
