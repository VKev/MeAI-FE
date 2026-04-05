import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import DialogConfirmPublish from '@/components/preview/common/DialogConfirmPublish';
import type { PostBuilderMode, PostBuilderPlatform } from '@/routes/post-builder/hooks/usePostBuilder';
import { cn } from '@/lib/utils';

type PublishPayload = {
  platform: PostBuilderPlatform;
  contentHtml: string;
  content: string;
  resourceIds: string[];
  mode: PostBuilderMode;
};

type DialogPublishPostProps = {
  isOpen: boolean;
  onClose: () => void;
  payloads: PublishPayload[];
};

type PublishType = 'now' | 'schedule';

const PLATFORM_ACCOUNTS = [
  {
    id: 'tiktok' as const,
    label: 'TikTok',
    accounts: [
      { id: 'tt-1', name: '@meai.tiktok' },
      { id: 'tt-2', name: '@meai.creator' }
    ]
  },
  {
    id: 'facebook' as const,
    label: 'Facebook',
    accounts: [
      { id: 'fb-1', name: 'MeAI Studio' },
      { id: 'fb-2', name: 'MeAI Ads' },
      { id: 'fb-3', name: 'MeAI Labs' }
    ]
  },
  {
    id: 'instagram' as const,
    label: 'Instagram',
    accounts: [
      { id: 'ig-1', name: '@meai.official' },
      { id: 'ig-2', name: '@meai.works' }
    ]
  },
  {
    id: 'thread' as const,
    label: 'Threads',
    accounts: [
      { id: 'th-1', name: '@meai' },
      { id: 'th-2', name: '@meai.community' }
    ]
  }
];

function DialogPublishPost({ isOpen, onClose, payloads }: DialogPublishPostProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<PostBuilderPlatform[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string[]>>({});
  const [publishType, setPublishType] = useState<PublishType>('now');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedPlatforms([]);
      setSelectedAccounts({});
      setPublishType('now');
      setScheduleDate(undefined);
      setScheduleTime('');
      setIsConfirmOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (publishType === 'now') {
      setScheduleDate(undefined);
      setScheduleTime('');
    }
  }, [publishType]);

  const isPlatformSelected = (platform: PostBuilderPlatform) => selectedPlatforms.includes(platform);

  const togglePlatform = (platform: PostBuilderPlatform) => {
    setSelectedPlatforms((prev) => {
      const isSelected = prev.includes(platform);
      if (isSelected) {
        setSelectedAccounts((current) => ({ ...current, [platform]: [] }));
        return prev.filter((item) => item !== platform);
      }

      return [...prev, platform];
    });
  };

  const toggleAccount = (platform: PostBuilderPlatform, accountId: string) => {
    if (!isPlatformSelected(platform)) return;

    setSelectedAccounts((prev) => {
      const current = prev[platform] ?? [];
      const isSelected = current.includes(accountId);
      return {
        ...prev,
        [platform]: isSelected ? current.filter((id) => id !== accountId) : [...current, accountId]
      };
    });
  };

  const selectedPlatformSet = useMemo(() => new Set(selectedPlatforms), [selectedPlatforms]);
  const canSubmit = selectedPlatforms.length > 0;

  const buildDatetimePublish = () => {
    if (publishType === 'now' || !scheduleDate || !scheduleTime) {
      return '';
    }

    const [hours, minutes] = scheduleTime.split(':');
    if (!hours || !minutes) return '';
    const date = new Date(scheduleDate);
    date.setHours(Number(hours), Number(minutes), 0, 0);
    return date.toISOString();
  };

  const handleSubmit = () => {
    const datetimePublish = buildDatetimePublish();
    const payload = payloads
      .filter((item) => selectedPlatformSet.has(item.platform))
      .map((item) => ({
        ...item,
        publishType,
        datetimePublish: publishType === 'now' ? '' : datetimePublish,
        socialMediaIds: selectedAccounts[item.platform] ?? []
      }));

    console.log(payload);
    setIsConfirmOpen(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='min-w-4xl border-zinc-800 bg-zinc-950 p-0 text-zinc-100'>
        <DialogHeader className='border-b border-zinc-800 px-6 py-4'>
          <DialogTitle>Publish Post</DialogTitle>
          <DialogDescription className='text-zinc-400'>Choose platform, account, and publish time.</DialogDescription>
        </DialogHeader>

        <div className='max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6'>
          <section className='space-y-3'>
            <h3 className='text-sm font-semibold text-white'>1. Select platform</h3>
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
              {PLATFORM_ACCOUNTS.map((platform) => {
                const isSelected = isPlatformSelected(platform.id);
                return (
                  <label
                    key={platform.id}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200',
                      isSelected && 'border-purple-500/60 bg-purple-500/10 text-white'
                    )}
                  >
                    <input
                      type='checkbox'
                      checked={isSelected}
                      onChange={() => togglePlatform(platform.id)}
                      className='h-4 w-4 accent-purple-600'
                    />
                    {platform.label}
                  </label>
                );
              })}
            </div>
          </section>

          <section className='space-y-3'>
            <h3 className='text-sm font-semibold text-white'>1.2. Select account</h3>
            <div className='space-y-4'>
              {PLATFORM_ACCOUNTS.map((platform) => {
                const platformSelected = isPlatformSelected(platform.id);
                const selected = selectedAccounts[platform.id] ?? [];
                return (
                  <div key={platform.id} className='grid gap-3 sm:grid-cols-[160px_1fr]'>
                    <div className='flex items-start gap-2 text-sm text-zinc-300'>
                      <input
                        type='checkbox'
                        checked={platformSelected}
                        onChange={() => togglePlatform(platform.id)}
                        className='mt-0.5 h-4 w-4 accent-purple-600'
                      />
                      <span>{platform.label}</span>
                    </div>
                    <div className={cn('grid gap-2 sm:grid-cols-2 md:grid-cols-3', !platformSelected && 'opacity-50')}>
                      {platform.accounts.map((account) => (
                        <label
                          key={account.id}
                          className={cn(
                            'flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200',
                            selected.includes(account.id) && 'border-purple-500/60 bg-purple-500/10 text-white',
                            !platformSelected && 'cursor-not-allowed'
                          )}
                        >
                          <input
                            type='checkbox'
                            disabled={!platformSelected}
                            checked={selected.includes(account.id)}
                            onChange={() => toggleAccount(platform.id, account.id)}
                            className='h-3.5 w-3.5 accent-purple-600'
                          />
                          {account.name}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className='space-y-3'>
            <h3 className='text-sm font-semibold text-white'>2. Publish options</h3>
            <div className='flex flex-wrap gap-3'>
              <label
                className={cn(
                  'flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200',
                  publishType === 'now' && 'border-purple-500/60 bg-purple-500/10 text-white'
                )}
              >
                <input
                  type='radio'
                  name='publish-type'
                  checked={publishType === 'now'}
                  onChange={() => setPublishType('now')}
                  className='h-4 w-4 accent-purple-600'
                />
                Now
              </label>
              <label
                className={cn(
                  'flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200',
                  publishType === 'schedule' && 'border-purple-500/60 bg-purple-500/10 text-white'
                )}
              >
                <input
                  type='radio'
                  name='publish-type'
                  checked={publishType === 'schedule'}
                  onChange={() => setPublishType('schedule')}
                  className='h-4 w-4 accent-purple-600'
                />
                Schedule
              </label>
            </div>

            {publishType === 'schedule' && (
              <div className='grid gap-3 sm:grid-cols-2'>
                <div className='space-y-1.5'>
                  <label className='text-xs text-zinc-400'>Date</label>
                  <DatePickerInput selected={scheduleDate} onSelect={setScheduleDate} />
                </div>
                <div className='space-y-1.5'>
                  <label className='text-xs text-zinc-400'>Time</label>
                  <input
                    type='time'
                    value={scheduleTime}
                    onChange={(event) => setScheduleTime(event.target.value)}
                    className='h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-white'
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        <DialogFooter className='border-t border-zinc-800 px-6 py-4'>
          <div className='flex w-full flex-col gap-2 sm:flex-row sm:justify-end'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              className='min-w-32 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-white'
            >
              Cancel
            </Button>
            <Button
              type='button'
              disabled={!canSubmit}
              onClick={() => setIsConfirmOpen(true)}
              className='min-w-32 bg-purple-600 text-white hover:bg-purple-700'
            >
              Publish
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <DialogConfirmPublish isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} handleClick={handleSubmit} />
    </Dialog>
  );
}

export default DialogPublishPost;
