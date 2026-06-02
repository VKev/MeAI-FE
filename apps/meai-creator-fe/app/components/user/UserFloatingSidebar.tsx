import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { TProfile } from '@/models/profile.model';
import {
  BotIcon,
  Brain,
  ChevronDown,
  CreditCardIcon,
  FolderKanban,
  Grid3x3,
  Home,
  LinkIcon,
  LogOut,
  MoreHorizontal,
  Package,
  Receipt,
  Settings
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import NavItemComponent, { type NavItem } from './NavItemComponent';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CoinIcon from '@/components/icons/CoinIcon';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useUserStore } from '@/store/user.store';
import UserAvatar from '@/components/common/UserAvatar';
import { formatCoinShort } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { ChatSessionClientApi } from '@/services/client/chat-session.client';
import DialogInsufficientCoins from '@/components/common/DialogInsufficientCoins';
import { toast } from 'react-toastify';

interface TProps {
  user: TProfile | null;
  logout: () => void;
}

export default function UserFloatingSidebar({ user, logout }: TProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isInsufficientOpen, setIsInsufficientOpen] = useState(false);
  // Read the live balance from the Zustand store so optimistic debits during generation
  // flip the sidebar coin badge immediately instead of waiting for the loader to revalidate.
  const liveCoin = useUserStore((s) => s.user?.meAiCoin);
  const coinBalance = liveCoin ?? user?.meAiCoin ?? 0;

  const avatarSrc = user?.avatarPresignedUrl || user?.avatarResourceId || undefined;

  const { mutateAsync: createChatSession, isPending: isCreatingAiGenerationSession } = useMutation({
    mutationFn: () =>
      ChatSessionClientApi.createChatSession({
        workspaceId: null,
        sessionName: 'Untitled ai generation session'
      })
  });

  const handleAiGeneration = useCallback(async () => {
    if (Number(coinBalance) <= 100) {
      setIsInsufficientOpen(true);
      return;
    }

    try {
      const data = await createChatSession();
      if (data.isSuccess && data.value?.id) {
        navigate(`/ai-generation/${data.value.id}`);
        return;
      }

      toast.error(data.error?.description || 'Failed to create AI generation session.');
    } catch {
      toast.error('Failed to create AI generation session.');
    }
  }, [coinBalance, createChatSession, navigate]);

  const handleAiSchedule = useCallback(() => {
    if (Number(coinBalance) <= 100) {
      setIsInsufficientOpen(true);
      return;
    }
    navigate('/user/ai-schedule');
  }, [navigate]);

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/user' && location.pathname === '/user') return true;
    if (href !== '/user' && location.pathname.startsWith(href)) return true;
    return false;
  };

  const isNavItemActive = (item: NavItem) => {
    if (item.id === 'ai-generation') return location.pathname.startsWith('/ai-generation/');
    if (item.id === 'ai-schedule') return location.pathname === '/user/ai-schedule';
    return isActive(item.href);
  };

  const handleNavItemSelect = (item: NavItem) => {
    if (item.onClick) {
      item.onClick();
      return;
    }

    if (item.href) {
      navigate(item.href);
    }
  };

  const navItems = useMemo<NavItem[]>(
    () => [
      { id: 'dashboard', icon: <Home className='size-5' />, label: 'Dashboard', href: '/user/dashboard' },
      { id: 'social-links', icon: <LinkIcon className='size-5' />, label: 'Social Links', href: '/user/social-links' },
      { id: 'product', icon: <Package className='size-5' />, label: 'Product', href: '/user/product' },
      { id: 'library', icon: <Grid3x3 className='size-5' />, label: 'Library', href: '/user/library' },
      { id: 'workspace', icon: <FolderKanban className='size-5' />, label: 'Workspace', href: '/user/workspace' },
      { id: 'billing', icon: <Receipt className='size-5' />, label: 'Transaction', href: '/user/transaction' },
      { id: 'cards', icon: <CreditCardIcon className='size-5' />, label: 'Cards', href: '/user/card' }
    ],
    []
  );

  const aiNavItems = useMemo<NavItem[]>(
    () => [
      {
        id: 'ai-generation',
        icon: <Brain className='size-5' />,
        label: 'AI Generation',
        onClick: handleAiGeneration,
        disabled: isCreatingAiGenerationSession
      },
      { id: 'ai-schedule', icon: <BotIcon className='size-5' />, label: 'AI Schedule', onClick: handleAiSchedule }
    ],
    [handleAiGeneration, handleAiSchedule, isCreatingAiGenerationSession]
  );

  const isAiGroupActive = aiNavItems.some(isNavItemActive);

  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const measureListRef = useRef<HTMLUListElement | null>(null);
  const overflowTriggerMeasureRef = useRef<HTMLLIElement | null>(null);
  const dividerMeasureRef = useRef<HTMLLIElement | null>(null);
  const aiGroupMeasureRef = useRef<HTMLLIElement | null>(null);

  const [visibleNavItems, setVisibleNavItems] = useState<NavItem[]>(navItems);
  const [overflowNavItems, setOverflowNavItems] = useState<NavItem[]>([]);

  const navItemBaseClassName =
    'ring-offset-background focus-visible:ring-ring group mx-auto flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-[0.77rem] font-medium tracking-tight whitespace-nowrap text-white/84 transition duration-150 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none hover:bg-white/[0.08] hover:text-white';

  const isSameNavItems = (left: NavItem[], right: NavItem[]) =>
    left.length === right.length && left.every((item, index) => item.id === right[index]?.id);

  useEffect(() => {
    const navContainer = navContainerRef.current;
    const measureList = measureListRef.current;

    if (!navContainer || !measureList) return;

    let frameId = 0;

    const computeOverflow = () => {
      if (frameId) cancelAnimationFrame(frameId);

      frameId = requestAnimationFrame(() => {
        const availableHeight = navContainer.clientHeight;
        if (!availableHeight) return;

        const itemNodes = Array.from(measureList.querySelectorAll<HTMLLIElement>('[data-measure-item="true"]'));

        if (!itemNodes.length) return;

        const dividerHeight = dividerMeasureRef.current?.offsetHeight ?? 0;
        const aiGroupHeight = aiGroupMeasureRef.current?.offsetHeight ?? 0;
        const triggerHeight = overflowTriggerMeasureRef.current?.offsetHeight ?? 0;

        const maxHeightWithoutTrigger = availableHeight - dividerHeight - aiGroupHeight;
        let visibleCount = itemNodes.filter(
          (node) => node.offsetTop + node.offsetHeight <= maxHeightWithoutTrigger
        ).length;

        let needsOverflow = visibleCount < navItems.length;

        if (needsOverflow) {
          const maxHeightWithTrigger = availableHeight - dividerHeight - aiGroupHeight - triggerHeight;
          visibleCount = itemNodes.filter((node) => node.offsetTop + node.offsetHeight <= maxHeightWithTrigger).length;
        }

        visibleCount = Math.max(0, Math.min(navItems.length, visibleCount));

        const nextVisible = navItems.slice(0, visibleCount);
        const nextOverflow = navItems.slice(visibleCount);

        setVisibleNavItems((current) => (isSameNavItems(current, nextVisible) ? current : nextVisible));
        setOverflowNavItems((current) => (isSameNavItems(current, nextOverflow) ? current : nextOverflow));
      });
    };

    const observer = new ResizeObserver(computeOverflow);
    observer.observe(navContainer);
    observer.observe(measureList);
    computeOverflow();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [navItems]);

  return (
    <>
      <aside className='fixed inset-y-0 left-0 z-50 flex px-3 py-4'>
        <div className='relative h-full w-23.5 overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,20,0.9)_0%,rgba(8,10,16,0.94)_100%)] shadow-[0_22px_46px_rgba(0,0,0,0.4)] backdrop-blur-xl'>
          <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(143,84,255,0.2),rgba(143,84,255,0)_58%)]' />
          <div className='pointer-events-none absolute inset-y-0 left-0 w-px bg-white/8' />
          <div className='pointer-events-none absolute inset-y-0 right-0 w-px bg-white/5' />

          <div className='relative z-10 flex h-full flex-col p-2.5'>
            {/* upper nav */}
            <div className='flex min-h-0 flex-1 flex-col gap-3'>
              <Link
                to='/user/dashboard'
                aria-label='MeAI Home'
                title='Go to MeAI Home'
                className='ring-offset-background focus-visible:ring-ring mx-auto flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/3 p-2 transition duration-150 hover:bg-white/8 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none'
              >
                <img src='/logo-meai.webp' alt='MeAI Logo' className='h-8 w-auto object-contain' />
              </Link>

              <nav
                aria-label='Main navigation'
                className='relative min-h-0 flex-1 overflow-hidden'
                ref={navContainerRef}
              >
                <ul className='space-y-2'>
                  {visibleNavItems.map((item) => (
                    <li key={item.id}>
                      <NavItemComponent item={item} isActive={isNavItemActive(item)} />
                    </li>
                  ))}
                  {overflowNavItems.length > 0 && (
                    <li>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type='button' className={navItemBaseClassName} title='Other'>
                            <span className='text-white/86 transition-colors group-hover:text-white'>
                              <MoreHorizontal className='size-5' />
                            </span>
                            <span>Other</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          side='right'
                          align='center'
                          sideOffset={20}
                          className='w-56 rounded-2xl border-zinc-800 bg-zinc-950 p-2 backdrop-blur-xl'
                        >
                          {overflowNavItems.map((item) => {
                            const itemActive = isNavItemActive(item);

                            return (
                              <DropdownMenuItem
                                key={item.id}
                                disabled={item.disabled}
                                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white ${
                                  itemActive ? 'bg-white/10 text-white' : ''
                                }`}
                                onClick={() => handleNavItemSelect(item)}
                              >
                                <span className='text-white/70 transition-colors group-hover:text-white'>
                                  {item.icon}
                                </span>
                                <span className='text-sm'>{item.label}</span>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </li>
                  )}
                  <li>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type='button'
                          className={`${navItemBaseClassName} ${
                            isAiGroupActive
                              ? 'bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_8px_24px_rgba(0,0,0,0.26)]'
                              : ''
                          }`}
                          title='AI'
                        >
                          <span className='text-white/86 transition-colors group-hover:text-white'>
                            <Brain className='size-5' />
                          </span>
                          <span>AI</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side='right'
                        align='center'
                        sideOffset={20}
                        className='w-56 rounded-2xl border-zinc-800 bg-zinc-950 p-2 backdrop-blur-xl'
                      >
                        {aiNavItems.map((item) => {
                          const itemActive = isNavItemActive(item);

                          return (
                            <DropdownMenuItem
                              key={item.id}
                              disabled={item.disabled}
                              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white ${
                                itemActive ? 'bg-white/10 text-white' : ''
                              }`}
                              onClick={() => handleNavItemSelect(item)}
                            >
                              <span className='text-white/70 transition-colors group-hover:text-white'>
                                {item.icon}
                              </span>
                              <span className='text-sm'>{item.label}</span>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                  <li className='px-2 py-1.5'>
                    <hr className='mx-auto h-px w-full max-w-7 bg-white/20' />
                  </li>
                </ul>

                <ul
                  ref={measureListRef}
                  aria-hidden='true'
                  className='pointer-events-none invisible absolute left-0 top-0 w-full space-y-2'
                >
                  {navItems.map((item) => (
                    <li key={item.id} data-measure-item='true'>
                      <div className={navItemBaseClassName}>
                        <span className='text-white/86'>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                    </li>
                  ))}
                  <li ref={overflowTriggerMeasureRef}>
                    <div className={navItemBaseClassName}>
                      <span className='text-white/86'>
                        <MoreHorizontal className='size-5' />
                      </span>
                      <span>Other</span>
                    </div>
                  </li>
                  <li ref={aiGroupMeasureRef}>
                    <div className={navItemBaseClassName}>
                      <span className='text-white/86'>
                        <Brain className='size-5' />
                      </span>
                      <span>AI</span>
                    </div>
                  </li>
                  <li ref={dividerMeasureRef} className='px-2 py-1.5'>
                    <hr className='mx-auto h-px w-full max-w-7 bg-white/20' />
                  </li>
                </ul>
              </nav>
            </div>

            {/* bottom nav */}
            <div className='space-y-2.5'>
              <NavItemComponent
                item={{
                  id: 'setting',
                  icon: <Settings className='size-5' />,
                  label: 'Settings',
                  href: '/user/settings'
                }}
                isActive={isActive('/user/settings')}
              />

              <NotificationBell variant='sidebar' side='right' align='end' sideOffset={20} alignOffset={-12} />

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    // title='Buy MeAI Coins'
                    className='mx-auto cursor-pointer flex w-full items-center justify-center gap-1 rounded-2xl border border-white/10 py-2 px-1 text-sm font-semibold text-white/85 transition hover:bg-white/8 hover:text-white'
                    onClick={() => navigate('/user/plans')}
                  >
                    <CoinIcon />
                    <span>{formatCoinShort(Number(coinBalance))}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side='right'
                  align='center'
                  sideOffset={20}
                  className='max-w-xs bg-white text-black border-0 overflow-hidden p-0!'
                >
                  <div className='p-3'>Buy MeAI Coins</div>
                </TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger className='cursor-pointer' asChild>
                  <button className='min-h-10 w-full flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/10'>
                    <UserAvatar userCoin={coinBalance} avatarUrl={avatarSrc} username={user?.username} size={34} />
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
                    <UserAvatar userCoin={coinBalance} avatarUrl={avatarSrc} username={user?.username} size={40} />
                    <div className='min-w-0 flex-1'>
                      <div className='truncate text-sm font-medium text-white'>{user?.username}</div>
                      <div className='truncate text-xs text-white/50'>{user?.email}</div>
                    </div>
                  </div>

                  <DropdownMenuSeparator className='my-2 bg-zinc-800' />

                  <DropdownMenuItem
                    className='group flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white'
                    onClick={() => navigate('/user/settings')}
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
      <DialogInsufficientCoins
        isOpen={isInsufficientOpen}
        onClose={() => setIsInsufficientOpen(false)}
        message='You need a MeAI plan or coins to use AI features.'
      />
    </>
  );
}
