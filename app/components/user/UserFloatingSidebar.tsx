import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { TProfile } from '@/models/profile.model';
import { ChevronDown, FolderKanban, Gem, Grid3x3, Home, LinkIcon, LogOut, Package, Settings } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import NavItemComponent, { type NavItem } from './NavItemComponent';

interface TProps {
  user: TProfile | null;
  logout: () => void;
}

export default function UserFloatingSidebar({ user, logout }: TProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const avatarSrc = user?.avatarPresignedUrl || user?.avatarResourceId || undefined;

  const isActive = (href: string) => {
    if (href === '/user' && location.pathname === '/user') return true;
    if (href !== '/user' && location.pathname.startsWith(href)) return true;
    return false;
  };

  const navItems: NavItem[] = [
    { id: 'dashboard', icon: <Home className='size-5' />, label: 'Dashboard', href: '/user/dashboard' },
    { id: 'social-links', icon: <LinkIcon className='size-5' />, label: 'Social Links', href: '/user/social-links' },
    { id: 'product', icon: <Package className='size-5' />, label: 'Product', href: '/user/product' },
    { id: 'library', icon: <Grid3x3 className='size-5' />, label: 'Library', href: '/user/library' },
    { id: 'workspace', icon: <FolderKanban className='size-5' />, label: 'Workspace', href: '/user/workspace' },
    { id: 'plan', icon: <Gem className='size-5' />, label: 'Plan', href: '/user/plans' }
  ];

  return (
    <aside className='fixed inset-y-0 left-0 z-50 flex px-3 py-4'>
      <div className='relative h-full w-[94px] overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,20,0.9)_0%,rgba(8,10,16,0.94)_100%)] shadow-[0_22px_46px_rgba(0,0,0,0.4)] backdrop-blur-xl'>
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(143,84,255,0.2),rgba(143,84,255,0)_58%)]' />
        <div className='pointer-events-none absolute inset-y-0 left-0 w-px bg-white/8' />
        <div className='pointer-events-none absolute inset-y-0 right-0 w-px bg-white/5' />

        <div className='relative z-10 flex h-full flex-col justify-between p-2.5'>
          <div className='space-y-3'>
            <Link
              to='/user/dashboard'
              aria-label='MeAI Home'
              title='Go to MeAI Home'
              className='ring-offset-background focus-visible:ring-ring mx-auto flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-2 transition duration-150 hover:bg-white/[0.08] focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none'
            >
              <img src='/logo-meai.webp' alt='MeAI Logo' className='h-8 w-auto object-contain' />
            </Link>

            <nav aria-label='Main navigation'>
              <ul className='space-y-2'>
                {navItems.map((item) => (
                  <li key={item.id}>
                    <NavItemComponent item={item} isActive={isActive(item.href)} />
                  </li>
                ))}
                <li className='px-2 py-1.5'>
                  <hr className='mx-auto h-px w-full max-w-7 bg-white/20' />
                </li>
              </ul>
            </nav>
          </div>

          <div className='space-y-2.5'>
            <NavItemComponent
              item={{
                id: 'setting',
                icon: <Settings className='size-5' />,
                label: 'Settings',
                href: '/user/user-settings'
              }}
              isActive={isActive('/user/user-settings')}
            />

            <button
              type='button'
              title='Buy MeAI Coins'
              className='mx-auto flex w-full items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] py-2 text-sm font-semibold text-white/85 transition hover:bg-white/[0.08] hover:text-white'
              onClick={() => navigate('/user/plans')}
            >
              <svg
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
                className='text-[#b06cff]'
              >
                <path
                  d='M7 18.6778C7 19.4889 7.24445 20.2222 7.70001 20.8555C4.72223 20.6666 2 19.5778 2 17.5667V16.5889C3.16667 17.5 4.88889 18.1111 7 18.3111V18.6778ZM7.04442 14.1556C7.03331 14.1667 7.03337 14.1777 7.03337 14.1889C7.01114 14.3 7 14.4111 7 14.5222V16.6444C4.31111 16.3333 2 15.2667 2 13.4111V12.4334C3.16667 13.3556 4.90003 13.9667 7.03337 14.1556H7.04442ZM11.3778 10.0889C9.68889 10.6111 8.36667 11.4666 7.63334 12.5333C4.67779 12.3444 2 11.2556 2 9.25559V8.49997C3.45556 9.64442 5.78889 10.3111 8.66667 10.3111C9.63333 10.3111 10.5444 10.2334 11.3778 10.0889ZM15.3333 8.49997V9.25559C15.3333 9.35559 15.3222 9.44448 15.3111 9.53337C14.4333 9.53337 13.6 9.61108 12.8222 9.74441C13.8222 9.44441 14.6667 9.0222 15.3333 8.49997ZM8.66667 2C5.33333 2 2 3.1111 2 5.32221C2 7.55554 5.33333 8.64442 8.66667 8.64442C12 8.64442 15.3333 7.55554 15.3333 5.32221C15.3333 3.1111 12 2 8.66667 2ZM15.3333 19.5111C12.5444 19.5111 10.1667 18.7778 8.66667 17.5889V18.6778C8.66667 20.8889 12 22 15.3333 22C18.6667 22 22 20.8889 22 18.6778V17.5889C20.5 18.7778 18.1222 19.5111 15.3333 19.5111ZM15.3333 11.2C11.6556 11.2 8.66667 12.6889 8.66667 14.5222C8.66667 16.3556 11.6556 17.8445 15.3333 17.8445C19.0111 17.8445 22 16.3556 22 14.5222C22 12.6889 19.0111 11.2 15.3333 11.2Z'
                  fill='currentColor'
                />
              </svg>
              <span>{user?.meAiCoin ?? 0}</span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger className='cursor-pointer' asChild>
                <button className='min-h-10 w-full flex items-center gap-1 rounded-xl px-2 py-1.5 hover:bg-white/10'>
                  <Avatar className='h-7 w-7'>
                    {avatarSrc ? (
                      <AvatarImage src={avatarSrc} alt='User Avatar' className='h-7 w-7 rounded-full object-cover' />
                    ) : (
                      <AvatarFallback className='bg-linear-to-br from-purple-500 to-pink-500 text-sm font-bold text-white'>
                        {user?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <ChevronDown className='h-4 w-4 text-white/70' />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side='right'
                align='end'
                className='w-64 rounded-2xl border-zinc-800 bg-zinc-950 p-2 backdrop-blur-xl'
                sideOffset={20}
                alignOffset={-12}
              >
                <div className='flex items-center gap-3 rounded-lg px-3 py-2.5'>
                  <Avatar className='h-7 w-7'>
                    {avatarSrc ? (
                      <AvatarImage src={avatarSrc} alt='User Avatar' className='h-7 w-7 rounded-full object-cover' />
                    ) : (
                      <AvatarFallback className='bg-linear-to-br from-purple-500 to-pink-500 text-sm font-bold text-white'>
                        {user?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className='min-w-0 flex-1'>
                    <div className='truncate text-sm font-medium text-white'>{user?.username}</div>
                    <div className='truncate text-xs text-white/50'>{user?.email}</div>
                  </div>
                </div>

                <DropdownMenuSeparator className='my-2 bg-zinc-800' />

                <DropdownMenuItem
                  className='group flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white'
                  onClick={() => navigate('/user/user-settings')}
                >
                  <Settings className='size-5 text-white/70 group-hover:text-white group-focus:text-white' />
                  <span className='text-sm'>Settings</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className='group flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white'
                  onClick={logout}
                >
                  <LogOut className='size-5 text-white/70 group-hover:text-white group-focus:text-white' />
                  <span className='text-sm'>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </aside>
  );
}
