import { hasRole, requireUser } from '@/services/server/session.server';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Settings,
  LogOut,
  Search,
  Bell,
  ChevronRight,
  CreditCard
} from 'lucide-react';
import { Outlet, redirect, Link, useLocation, useFetcher, useLoaderData, type LoaderFunctionArgs } from 'react-router';

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
      { id: 'transactions', label: 'Billing', href: '/admin/transactions', icon: Receipt },
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

  const isActive = (href: string) => location.pathname.startsWith(href);
  const breadcrumbs = getBreadcrumb(location.pathname);

  const handleLogout = () => {
    fetcher.submit({}, { method: 'post', action: '/auth/logout' });
  };

  return (
    <div className='flex min-h-screen bg-[#0b0b12] text-white'>
      {/* ─── Sidebar ─── */}
      <aside className='fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-white/[0.06] bg-[#0f0f18]'>
        {/* Logo */}
        <div className='flex h-[56px] items-center gap-2.5 px-5'>
          <img src='/logo-meai.webp' alt='MeAI' className='h-7 w-auto' />
          <span className='text-[15px] font-bold tracking-wide text-white/90'>MeAI</span>
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
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-[9px] text-[13px] font-medium transition-colors ${
                          active
                            ? 'bg-violet-500/[0.12] text-violet-400'
                            : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                        }`}
                      >
                        <Icon className={`size-[18px] ${active ? 'text-violet-400' : ''}`} />
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
        <div className='border-t border-white/[0.06] px-3 py-3'>
          <button
            type='button'
            onClick={handleLogout}
            className='flex w-full items-center gap-2.5 rounded-lg px-3 py-[9px] text-[13px] font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-white'
          >
            <LogOut className='size-[18px]' />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ─── Main area ─── */}
      <div className='ml-[240px] flex flex-1 flex-col'>
        {/* Top Header */}
        <header className='sticky top-0 z-30 flex h-[56px] items-center justify-between border-b border-white/[0.06] bg-[#0b0b12]/80 px-6 backdrop-blur-sm'>
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
            {/* Search */}
            <button
              type='button'
              className='flex h-8 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-[12px] text-slate-500 transition-colors hover:border-white/[0.12] hover:text-slate-300'
            >
              <Search className='size-3.5' />
              <span>Search here</span>
              <kbd className='ml-4 rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-500'>
                ⌘K
              </kbd>
            </button>

            {/* Notification */}
            <button
              type='button'
              className='flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-400 transition-colors hover:text-white'
            >
              <Bell className='size-4' />
            </button>

            {/* User */}
            <div className='flex items-center gap-2 pl-2'>
              <div className='flex size-8 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300'>
                {((user as any)?.username || 'A').charAt(0).toUpperCase()}
              </div>
              <div className='hidden md:block'>
                <p className='text-[12px] font-medium text-white leading-tight'>{(user as any)?.username || 'Admin'}</p>
                <p className='text-[10px] text-slate-500 leading-tight'>Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className='flex-1 px-6 py-6'>
          <div className='mx-auto max-w-[1200px]'>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
