import React from 'react';
import { useNavigate } from 'react-router';
import { Play, Layers, BookOpen, Settings, Briefcase } from 'lucide-react';

export default function WorkspaceSidebar() {
  const navigate = useNavigate();

  const navMenu: Record<string, Array<{ label: string; to?: string; icon: React.ReactNode }>> = {
    Platform: [
      { label: 'Playground', to: '/workspace/playground', icon: <Play className='w-4 h-4 text-white' /> },
      { label: 'Models', to: '/workspace/models', icon: <Layers className='w-4 h-4 text-white' /> },
      { label: 'Documentation', to: '/workspace/docs', icon: <BookOpen className='w-4 h-4 text-white' /> },
      { label: 'Settings', to: '/workspace/settings', icon: <Settings className='w-4 h-4 text-white' /> }
    ],
    Projects: [
      {
        label: 'Design Engineering',
        to: '/workspace/design-engineering',
        icon: <Briefcase className='w-4 h-4 text-white' />
      },
      { label: 'Product', to: '/workspace/product', icon: <Briefcase className='w-4 h-4 text-white' /> }
    ]
  };

  return (
    <aside className='w-64 h-full bg-[#0a0a0a]/50 border-r border-[#0a0a0a] p-4 overflow-auto'>
      {Object.entries(navMenu).map(([section, items]) => (
        <div key={section} className={section === 'Platform' ? 'mb-6' : 'mt-6'}>
          <h3 className='text-xs text-slate-400 uppercase tracking-wider mb-3'>{section}</h3>
          <div className='flex flex-col gap-2'>
            {items.map((it) => (
              <button
                key={it.label}
                onClick={() => it.to && navigate(it.to)}
                className='w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-neutral-800/40 transition-colors text-left'
              >
                <div className='w-8 h-8 flex items-center justify-center rounded-md bg-neutral-800/50'>{it.icon}</div>
                <span className='text-sm text-slate-200'>{it.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
