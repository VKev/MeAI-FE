import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Briefcase, Settings, Grid3X3Icon, BotIcon, Brain } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { ChatSessionClientApi } from '@/services/client/chat-session.client';
import { useUserStore } from '@/store/user.store';
import DialogInsufficientCoins from '@/components/common/DialogInsufficientCoins';
import { toast } from 'react-toastify';
import type { TCreateChatSessionPayload } from '@/models/chat-session.model';

interface TProps {
  workspaceId: string;
}

const AI_FEATURE_REQUIRED_COINS = 100;

export default function WorkspaceSidebar({ workspaceId }: TProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isInsufficientOpen, setIsInsufficientOpen] = useState(false);

  const liveCoin = useUserStore((s) => s.user?.meAiCoin);
  const coinBalance = Number(liveCoin ?? 0);

  const isActive = (to?: string) => {
    if (!to) return false;
    const escaped = to.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\\:([a-zA-Z0-9_]+)/g, '[^/]+');
    const pattern = new RegExp('^' + escaped + '(?:$|/)');
    return pattern.test(location.pathname);
  };

  const isGenerationActive = () => location.pathname.includes('/ai-generation/');

  const { mutateAsync: createChatSession } = useMutation({
    mutationFn: (payload: TCreateChatSessionPayload) => ChatSessionClientApi.createChatSession(payload),
    onSuccess: (data) => {
      if (data.isSuccess && data.value?.id) {
        const sessionPath = `/ai-generation/${data.value.id}`;
        navigate(sessionPath);
      } else {
        toast.error('Failed to create AI generation session.');
      }
    },
    onError: () => {
      toast.error('Failed to create AI generation session.');
    }
  });

  const handleNavigate = async (item: { to?: string; isGeneration?: boolean }) => {
    if (item.isGeneration && coinBalance >= AI_FEATURE_REQUIRED_COINS) {
      await createChatSession({ workspaceId, sessionName: 'Untitled ai generation session' });
      return;
    } else if (item.isGeneration) {
      setIsInsufficientOpen(true);
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
        label: 'Library',
        to: `/workspace/${workspaceId}/library`,
        icon: <Grid3X3Icon className='w-4 h-4 text-white' />,
        title: 'Library'
      }
    ],
    AI: [
      {
        label: 'AI Generation',
        isGeneration: true,
        icon: <Brain className='w-4 h-4 text-white' />,
        title: 'AI Generation'
      },
      {
        label: 'AI Auto Posting',
        to: `/workspace/${workspaceId}/ai-schedule`,
        icon: <BotIcon className='w-4 h-4 text-white' />,
        title: 'AI automated posting workflows'
      }
    ],
    Management: [
      {
        label: 'Settings',
        to: `/workspace/${workspaceId}/settings`,
        icon: <Settings className='w-4 h-4 text-white' />,
        title: 'Workspace settings'
      }
    ]
  };

  return (
    <aside className='w-64 h-full bg-zinc-950 border-r border-zinc-900 p-4 overflow-auto'>
      {Object.entries(navMenu).map(([section, items]) => (
        <div key={section} className={section === 'Workspace' ? 'mb-6' : 'mt-6'}>
          <h3 className='text-xs text-slate-400 tracking-wider mb-3'>{section}</h3>
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

      <DialogInsufficientCoins
        isOpen={isInsufficientOpen}
        onClose={() => setIsInsufficientOpen(false)}
        requiredCoins={AI_FEATURE_REQUIRED_COINS}
        currentBalance={coinBalance}
        message='You need a MeAI plan or coins to use AI features.'
      />
    </aside>
  );
}
