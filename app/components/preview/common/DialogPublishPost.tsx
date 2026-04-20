import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { fetchSocialMedias } from '@/services/client/social-media.client';
import { createPost, publishPost, updatePost, type CreatePostPayload } from '@/services/client/post.client';
import type { SocialMedia } from '@/models/social-media.model';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type PublishPayload = {
  platform: PostBuilderPlatform;
  contentHtml: string;
  content: string;
  resourceIds: string[];
  mode: PostBuilderMode;
  // Existing post-builder child post id for this platform/type.
  // When present, we update+publish the existing post so publications stay linked to the builder.
  postId?: string | null;
};

type DialogPublishPostProps = {
  isOpen: boolean;
  onClose: () => void;
  payloads: PublishPayload[];
  workspaceId?: string;
};

type PublishType = 'now' | 'schedule';

type PlatformGroup = {
  id: PostBuilderPlatform;
  label: string;
  accounts: { id: string; name: string; avatarUrl: string | null }[];
};

const PLATFORM_LABELS: Record<string, { id: PostBuilderPlatform; label: string }> = {
  facebook: { id: 'facebook', label: 'Facebook' },
  instagram: { id: 'instagram', label: 'Instagram' },
  tiktok: { id: 'tiktok', label: 'TikTok' },
  threads: { id: 'thread', label: 'Threads' }
};

function getAccountName(account: SocialMedia): string {
  if (account.type === 'facebook') {
    return account.profile?.pageName || account.profile?.displayName || 'Facebook Page';
  }
  return account.profile?.displayName || account.profile?.username || 'Connected account';
}

function getAccountAvatar(account: SocialMedia): string | null {
  if (account.type === 'facebook') {
    return account.profile?.pageProfilePictureUrl || account.profile?.profilePictureUrl || null;
  }
  return account.profile?.profilePictureUrl || null;
}

function groupAccountsByPlatform(accounts: SocialMedia[]): PlatformGroup[] {
  const groups = new Map<string, PlatformGroup>();

  for (const account of accounts) {
    const type = account.type?.toLowerCase();
    const config = PLATFORM_LABELS[type];
    if (!config) continue;

    const existing = groups.get(type);
    const entry = {
      id: account.id,
      name: getAccountName(account),
      avatarUrl: getAccountAvatar(account)
    };

    if (existing) {
      existing.accounts.push(entry);
    } else {
      groups.set(type, {
        id: config.id,
        label: config.label,
        accounts: [entry]
      });
    }
  }

  // Return in consistent order
  const order: string[] = ['facebook', 'instagram', 'tiktok', 'threads'];
  return order.map((key) => groups.get(key)).filter((g): g is PlatformGroup => g != null);
}

function modeToPostType(_mode: PostBuilderMode): string {
  // Backend only supports 'posts' type for publishing at the moment
  return 'posts';
}

function DialogPublishPost({ isOpen, onClose, payloads, workspaceId }: DialogPublishPostProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<PostBuilderPlatform[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string[]>>({});
  const [publishType, setPublishType] = useState<PublishType>('now');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['social-medias-publish'],
    queryFn: fetchSocialMedias,
    enabled: isOpen,
    staleTime: 30_000
  });

  const platformGroups = useMemo(() => {
    const accounts = data?.value || [];
    return groupAccountsByPlatform(accounts);
  }, [data]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedPlatforms([]);
      setSelectedAccounts({});
      setPublishType('now');
      setScheduleDate(undefined);
      setScheduleTime('');
      setIsConfirmOpen(false);
      setIsPublishing(false);
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
  const canSubmit = selectedPlatforms.length > 0 && !isPublishing;

  const handleSubmit = async () => {
    setIsConfirmOpen(false);
    setIsPublishing(true);

    const platformPayloads = payloads.filter((item) => selectedPlatformSet.has(item.platform));

    let successCount = 0;
    const failures: { platform: PostBuilderPlatform; message: string }[] = [];

    for (const item of platformPayloads) {
      const accountIds = selectedAccounts[item.platform] ?? [];
      if (accountIds.length === 0) continue;

      try {
        let postId = item.postId ?? null;

        if (postId) {
          // Update the existing post-builder child post so publications stay linked.
          const updatePayload: Partial<CreatePostPayload> = {
            content: {
              content: item.content,
              hashtag: null,
              resource_list: item.resourceIds,
              post_type: modeToPostType(item.mode)
            }
          };

          await updatePost(postId, updatePayload);
        } else {
          // Fallback path (no existing post-builder child) — create a standalone post.
          const createPayload: CreatePostPayload = {
            workspaceId: workspaceId || null,
            socialMediaId: null,
            title: null,
            content: {
              content: item.content,
              hashtag: null,
              resource_list: item.resourceIds,
              post_type: modeToPostType(item.mode)
            },
            status: 'draft'
          };

          const createResponse = await createPost(createPayload);
          postId = createResponse.value?.id ?? null;
        }

        if (!postId) {
          failures.push({ platform: item.platform, message: 'Post could not be created.' });
          continue;
        }

        await publishPost({
          postId,
          socialMediaIds: accountIds
        });

        successCount++;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Publish failed';
        console.error(`Failed to publish ${item.platform}:`, message);
        failures.push({ platform: item.platform, message });
      }
    }

    setIsPublishing(false);

    const failCount = failures.length;

    if (successCount > 0 && failCount === 0) {
      toast.success(`Published to ${successCount} platform${successCount > 1 ? 's' : ''} successfully`);
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(`Published to ${successCount} platform${successCount > 1 ? 's' : ''}, ${failCount} failed`);
      for (const failure of failures) {
        toast.error(`${PLATFORM_LABELS[failure.platform === 'thread' ? 'threads' : failure.platform]?.label ?? failure.platform}: ${failure.message}`);
      }
    } else if (failCount > 0) {
      for (const failure of failures) {
        toast.error(`${PLATFORM_LABELS[failure.platform === 'thread' ? 'threads' : failure.platform]?.label ?? failure.platform}: ${failure.message}`);
      }
    }

    if (failCount === 0) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPublishing && onClose()}>
      <DialogContent className='min-w-4xl border-zinc-800 bg-zinc-950 p-0 text-zinc-100'>
        <DialogHeader className='border-b border-zinc-800 px-6 py-4'>
          <DialogTitle>Publish Post</DialogTitle>
          <DialogDescription className='text-zinc-400'>Choose platform, account, and publish time.</DialogDescription>
        </DialogHeader>

        <div className='max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6'>
          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-5 w-5 animate-spin text-purple-400' />
              <span className='ml-2 text-sm text-zinc-400'>Loading accounts...</span>
            </div>
          ) : platformGroups.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-zinc-500'>
              <p className='text-sm font-medium'>No social accounts connected</p>
              <p className='text-xs mt-1'>Connect accounts in Social Links to publish posts.</p>
            </div>
          ) : (
            <>
              <section className='space-y-3'>
                <h3 className='text-sm font-semibold text-white'>1. Select platform</h3>
                <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                  {platformGroups.map((platform) => {
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
                        <span className='ml-auto text-xs text-zinc-500'>{platform.accounts.length}</span>
                      </label>
                    );
                  })}
                </div>
              </section>

              <section className='space-y-3'>
                <h3 className='text-sm font-semibold text-white'>2. Select account</h3>
                <div className='space-y-4'>
                  {platformGroups.map((platform) => {
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
                              {account.avatarUrl ? (
                                <img
                                  src={account.avatarUrl}
                                  alt={account.name}
                                  className='h-5 w-5 rounded-full object-cover shrink-0'
                                />
                              ) : null}
                              <span className='truncate'>{account.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className='space-y-3'>
                <h3 className='text-sm font-semibold text-white'>3. Publish options</h3>
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
            </>
          )}
        </div>

        <DialogFooter className='border-t border-zinc-800 px-6 py-4'>
          <div className='flex w-full flex-col gap-2 sm:flex-row sm:justify-end'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isPublishing}
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
              {isPublishing ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Publishing...
                </>
              ) : (
                'Publish'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <DialogConfirmPublish isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} handleClick={handleSubmit} />
    </Dialog>
  );
}

export default DialogPublishPost;
