import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Home, Briefcase, Settings, Grid3X3Icon, BrainCogIcon } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { ChatSessionClientApi } from '@/services/client/chat-session.client';
import type { TCreateChatSessionPayload } from '@/models/chat-session.model';
import { toast } from 'react-toastify';

interface TProps {
  workspaceId: string;
}

export default function WorkspaceSidebar({ workspaceId }: TProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (to?: string) => {
    if (!to) return false;
    const escaped = to.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\\:([a-zA-Z0-9_]+)/g, '[^/]+');
    const pattern = new RegExp('^' + escaped + '(?:$|/)');
    return pattern.test(location.pathname);
  };

  const isGenerationActive = () => location.pathname.includes('/ai-generation/');

  const { mutateAsync: createChatSession } = useMutation({
    mutationFn: (payload: TCreateChatSessionPayload) => ChatSessionClientApi.createChatSession(payload)
  });

  const handleNavigate = async (item: { to?: string; isGeneration?: boolean }) => {
    if (item.isGeneration) {
      try {
        const data = await createChatSession({ workspaceId, sessionName: null });

        if (!data.isSuccess || !data.value) {
          toast.error('Failed to create chat session');
          return;
        }

        const sessionPath = `/workspace/${workspaceId}/ai-generation/${data.value.id}`;
        navigate(sessionPath);
      } catch {
        toast.error('Failed to create chat session');
      }

      return;
    }

    if (item.to) {
      navigate(item.to);
    }
  };

  const navMenu: Record<
    string,
    Array<{ label: string; to?: string; isGeneration?: boolean; icon: React.ReactNode; title: string }>
  > = {
    Workspace: [

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
        icon: <Grid3X3Icon className='w-4 h-4 text-white' />,
        title: 'Library'
      },
      {
        label: 'AI Generation',
        isGeneration: true,
        icon: <BrainCogIcon className='w-4 h-4 text-white' />,
        title: 'AI Generation'
      }
    ]
  };

  return (
    <aside className='w-64 h-full bg-zinc-950 border-r border-zinc-900 p-4 overflow-auto'>
      {Object.entries(navMenu).map(([section, items]) => (
        <div key={section} className={section === 'Workspace' ? 'mb-6' : 'mt-6'}>
          <h3 className='text-xs text-slate-400 uppercase tracking-wider mb-3'>{section}</h3>
          <div className='flex flex-col gap-2'>
            {items.map((it) => {
              const active = isActive(it.to) || (it.isGeneration ? isGenerationActive() : false);

              return (
                <button
                  key={it.label}
                  onClick={() => handleNavigate(it)}
                  title={it.title}
                  aria-label={it.title}
                  className={
                    'w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-left ' +
                    (active ? 'bg-neutral-800/60 ring-1 ring-white/10' : 'hover:bg-neutral-800/40')
                  }
                >
                  <div
                    className={
                      'w-8 h-8 flex items-center justify-center rounded-md ' +
                      (active ? 'bg-white/10' : 'bg-neutral-800/50')
                    }
                  >
                    {it.icon}
                  </div>
                  <span className={'text-sm ' + (active ? 'text-white' : 'text-slate-200')}>{it.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}
