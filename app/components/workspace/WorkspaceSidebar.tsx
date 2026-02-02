import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Home, BookOpen, Briefcase, Image, Video, Settings } from 'lucide-react';

interface TProps {
  workspaceId: string;
}

export default function WorkspaceSidebar({ workspaceId }: TProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (to?: string) => {
    if (!to) return false;
    // escape regex chars then replace route params like :workspaceId with a wildcard
    const escaped = to.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\\:([a-zA-Z0-9_]+)/g, '[^/]+');
    const pattern = new RegExp('^' + escaped + '(?:$|/)');
    return pattern.test(location.pathname);
  };

  const navMenu: Record<string, Array<{ label: string; to?: string; icon: React.ReactNode; title?: string }>> = {
    Workspace: [
      {
        label: 'Dashboard',
        to: `/workspace/${workspaceId}/dashboard`,
        icon: <Home className='w-4 h-4 text-white' />,
        title: 'Dashboard'
      },
      {
        label: 'Product',
        to: `/workspace/${workspaceId}/product`,
        icon: <Briefcase className='w-4 h-4 text-white' />,
        title: 'Products'
      },
      {
        label: 'Settings',
        to: `/workspace/${workspaceId}/settings`,
        icon: <Settings className='w-4 h-4 text-white' />,
        title: 'Workspace settings'
      }
    ],
    Content: [
      {
        label: 'Library',
        to: `/workspace/${workspaceId}/library`,
        icon: <BookOpen className='w-4 h-4 text-white' />,
        title: 'Library'
      },
      {
        label: 'Image',
        to: `/workspace/${workspaceId}/image`,
        icon: <Image className='w-4 h-4 text-white' />,
        title: 'Image'
      },
      {
        label: 'Video',
        to: `/workspace/${workspaceId}/video`,
        icon: <Video className='w-4 h-4 text-white' />,
        title: 'Video'
      }
    ]
  };

  return (
    <aside className='w-64 h-full bg-[#0a0a0a]/50 border-r border-[#0a0a0a] p-4 overflow-auto'>
      {Object.entries(navMenu).map(([section, items]) => (
        <div key={section} className={section === 'Workspace' ? 'mb-6' : 'mt-6'}>
          <h3 className='text-xs text-slate-400 uppercase tracking-wider mb-3'>{section}</h3>
          <div className='flex flex-col gap-2'>
            {items.map((it) => (
              <button
                key={it.label}
                onClick={() => it.to && navigate(it.to)}
                title={it.title}
                aria-label={it.title}
                className={
                  'w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-left ' +
                  (isActive(it.to) ? 'bg-neutral-800/60 ring-1 ring-white/10' : 'hover:bg-neutral-800/40')
                }
              >
                <div
                  className={
                    'w-8 h-8 flex items-center justify-center rounded-md ' +
                    (isActive(it.to) ? 'bg-white/10' : 'bg-neutral-800/50')
                  }
                >
                  {it.icon}
                </div>
                <span className={'text-sm ' + (isActive(it.to) ? 'text-white' : 'text-slate-200')}>{it.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
