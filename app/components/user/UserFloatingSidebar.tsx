import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { TProfile } from '@/models/profile.model';
import {
  ChevronDown,
  FolderKanban,
  Gem,
  Grid3x3,
  Home,
  LinkIcon,
  LogOut,
  Package,
  Receipt,
  Settings
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import NavItemComponent, { type NavItem } from './NavItemComponent';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CoinIcon from '@/components/icons/CoinIcon';

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
    // { id: 'plan', icon: <Gem className='size-5' />, label: 'Plan', href: '/user/plans' },
    { id: 'billing', icon: <Receipt className='size-5' />, label: 'Billing', href: '/user/billing-history' }
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

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type='button'
                  // title='Buy MeAI Coins'
                  className='mx-auto cursor-pointer flex w-full items-center justify-center gap-1 rounded-2xl border border-white/10 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/8 hover:text-white'
                  onClick={() => navigate('/user/plans')}
                >
                  <CoinIcon />
                  <span>{user?.meAiCoin ?? 0}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side='right'
                align='center'
                className='max-w-xs bg-white text-black border-0 overflow-hidden p-0!'
              >
                <div className='p-3'>Buy MeAI Coins</div>
              </TooltipContent>
            </Tooltip>

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
