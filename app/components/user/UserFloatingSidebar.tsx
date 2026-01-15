import { useState } from 'react';
import { Home, Grid3x3, Image, Film, Zap, Wand2, Infinity, Gem, Settings, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import type { NavItem } from '@/components/user/NavItemComponent';
import NavItemComponent from '@/components/user/NavItemComponent';

const NAV_ITEMS: NavItem[] = [
  { id: 'home', icon: <Home size={20} />, label: 'Home', href: '/user/dashboard' },
  { id: 'library', icon: <Grid3x3 size={20} />, label: 'Library', href: '/user/library' },
  { id: 'image', icon: <Image size={20} />, label: 'Image', href: '/user/image' },
  { id: 'video', icon: <Film size={20} />, label: 'Video', href: '/user/video' },
  {
    id: 'blueprints',
    icon: <Zap size={20} />,
    label: 'Blueprints',
    href: '/user/blueprints',
  },
  {
    id: 'upscaler',
    icon: <Wand2 size={20} />,
    label: 'Upscaler',
    href: '/user/upscaler'
  },
  {
    id: 'flow-state',
    icon: <Infinity size={20} />,
    label: 'Flow State',
    href: '/user/flow-state'
  },
  { id: 'plans', icon: <Gem size={20} />, label: 'Plans', href: '/user/plans' }
];

const BOTTOM_ITEMS: NavItem[] = [
  { id: 'settings', icon: <Settings size={20} />, label: 'Settings', href: '/user/settings' }
];

export default function UserFloatingSidebar() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/user' && location.pathname === '/user') return true;
    if (href !== '/user' && location.pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <div className='fixed left-2 top-4 z-50 h-[calc(100vh-24px)] w-fit rounded-2xl bg-neutral-900/85 backdrop-blur-md border border-white/5 shadow-[0_8px_40px_rgba(0,0,0,0.45)] flex flex-col items-center justify-center px-3 py-5'>
      {/* Logo / Avatar Section */}
      <div className='flex items-center justify-center pb-2 mb-3 border-b border-white/5'>
        <img src='/logo.png' alt='Logo' className='h-12 w-auto rounded-full' />
      </div>

      {/* Main Navigation */}
      <nav className='flex flex-col justify-center items-center gap-2'>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className='relative w-full'
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <NavItemComponent item={item} isActive={isActive(item.href)}>
              {item.badge && (
                <div className='absolute -top-1 -right-1 flex h-5 items-center justify-center rounded-full bg-linear-to-r from-purple-600 to-pink-600 px-1.5 text-[10px] font-bold text-white'>
                  {item.badge}
                </div>
              )}
            </NavItemComponent>
          </div>
        ))}
      </nav>

      {/* Spacer */}
      <div className='flex-1' />

      {/* Bottom Section */}
      <div className='space-y-2 border-t border-white/5'>
        {/* Settings */}
        {BOTTOM_ITEMS.map((item) => (
          <div
            key={item.id}
            className='relative'
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <NavItemComponent item={item} isActive={isActive(item.href)} />
          </div>
        ))}

        {/* Upgrade Button */}
        <button className='group relative flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50 transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/75 hover:scale-105 active:scale-95'>
          <Gem size={20} />
          <div className='absolute left-20 rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none whitespace-nowrap'>
            Upgrade
          </div>
        </button>
      </div>
    </div>
  );
}
