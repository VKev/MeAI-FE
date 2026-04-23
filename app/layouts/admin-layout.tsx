import { hasRole, requireUser } from '@/services/server/session.server';
import { LayoutDashboard, Users, Receipt, Settings, LogOut, Search, ChevronRight, CreditCard } from 'lucide-react';
import { Outlet, redirect, Link, useLocation, useFetcher, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/store/user.store';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  if (!hasRole(user, 'admin')) {
    throw redirect('/forbidden');
  }

  return { user };
}

const SIDEBAR_GROUPS = [
  {
    label: 'Manage',
    items: [
      { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { id: 'subscriptions', label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
      { id: 'transactions', label: 'Transactions', href: '/admin/transactions', icon: Receipt },
      { id: 'config', label: 'Setting', href: '/admin/config', icon: Settings }
    ]
  },
  {
    label: 'Manage Accounts',
    items: [{ id: 'users', label: 'User', href: '/admin/users', icon: Users }]
  }
];

function getBreadcrumb(pathname: string) {
  const segments = pathname.replace('/admin', '').split('/').filter(Boolean);
  if (segments.length === 0) return [{ label: 'Dashboard', href: '/admin/dashboard' }];
  return segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1),
    href: '/admin/' + segments.slice(0, i + 1).join('/')
  }));
}

export default function AdminLayout() {
  const location = useLocation();
  const fetcher = useFetcher();
  const { user } = useLoaderData<typeof loader>();
  const queryClient = useQueryClient();
  const clearUser = useUserStore((s) => s.clearUser);

  const isActive = (href: string) => location.pathname.startsWith(href);
  const breadcrumbs = getBreadcrumb(location.pathname);

  const handleLogout = () => {
    // Wipe RQ cache + user store so the next account's session starts clean.
    queryClient.clear();
    clearUser();
    fetcher.submit({}, { method: 'post', action: '/auth/logout' });
  };

  return (
    <div className='min-h-screen bg-[#0b0b12]'>
      {/* ─── Sidebar ─── */}
      <aside className='fixed inset-y-0 z-40 flex w-60 flex-col border-r border-white/6 bg-[#0f0f18]'>
        {/* Logo */}
        <div className='flex h-20 items-center justify-center'>
          <img src='/logo-meai.webp' alt='MeAI' className='h-full w-auto' />
        </div>

        {/* Nav Groups */}
        <nav className='flex-1 overflow-y-auto px-3 pt-2 pb-4'>
          {SIDEBAR_GROUPS.map((group) => (
            <div key={group.label} className='mb-5'>
              <p className='mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500'>
                {group.label}
              </p>
              <ul className='space-y-0.5'>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.id}>
                      <Link
                        to={item.href}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2.25 text-[13px] font-medium transition-colors ${
                          active
                            ? 'bg-violet-500/12 text-violet-400'
                            : 'text-slate-400 hover:bg-white/4 hover:text-slate-200'
                        }`}
                      >
                        <Icon className={`size-4.5 ${active ? 'text-violet-400' : ''}`} />
                        <span className='flex-1'>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom — Logout */}
        <div className='border-t border-white/6 px-3 py-3'>
          <button
            type='button'
            onClick={handleLogout}
            className='flex w-full items-center gap-2.5 rounded-lg px-3 py-2.25 text-[13px] font-medium text-red-500 transition-colors hover:bg-red-500/7'
          >
            <LogOut className='size-4.5' />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ─── Main area ─── */}
      <div className='ml-60 flex flex-1 flex-col'>
        {/* Top Header */}
        <header className='sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/6 bg-[#0b0b12]/80 px-6 backdrop-blur-sm'>
          {/* Breadcrumbs */}
          <nav className='flex items-center gap-1.5 text-[13px]'>
            <Link to='/admin/dashboard' className='text-slate-400 hover:text-white'>
              Home
            </Link>
            {breadcrumbs.map((b, i) => (
              <span key={b.href} className='flex items-center gap-1.5'>
                <ChevronRight className='size-3 text-slate-600' />
                {i === breadcrumbs.length - 1 ? (
                  <span className='text-white'>{b.label}</span>
                ) : (
                  <Link to={b.href} className='text-slate-400 hover:text-white'>
                    {b.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          {/* Right actions */}
          <div className='flex items-center gap-3'>
            {/* Notification */}
            <NotificationBell variant='header' side='bottom' align='end' sideOffset={8} />
          </div>
        </header>

        {/* Content */}
        <main className='mx-auto w-full max-w-7xl py-6'>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
