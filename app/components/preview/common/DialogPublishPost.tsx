import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router';
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
import {
  fetchSocialMedias,
  fetchWorkspaceLinkedSocialMedias,
  linkSocialMediaToWorkspace,
  unlinkSocialMediaFromWorkspace
} from '@/services/client/social-media.client';
import { getFacebookAuthUrl } from '@/services/client/facebook.client';
import { getInstagramAuthUrl } from '@/services/client/instagram.client';
import { getTikTokAuthUrl } from '@/services/client/tiktok.client';
import { getThreadsAuthUrl } from '@/services/client/threads.client';
import { stashOAuthAutoLinkIntent, stashPublishContinuation } from '@/utils/social-workspace-autolink';
import usePostBuilder from '@/routes/post-builder/hooks/usePostBuilder';
import { createPost, publishPost, updatePost, type CreatePostPayload } from '@/services/client/post.client';
import type { SocialMedia } from '@/models/social-media.model';
import { Loader2, Plus } from 'lucide-react';
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
  const queryClient = useQueryClient();
  const { id: postBuilderId } = useParams();
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

  const { data: linkedSocials } = useQuery({
    queryKey: ['workspace-linked-socials', workspaceId],
    queryFn: () => fetchWorkspaceLinkedSocialMedias(workspaceId!),
    enabled: isOpen && !!workspaceId,
    staleTime: 30_000
  });

  const platformGroups = useMemo(() => {
    const accounts = data?.value || [];
    return groupAccountsByPlatform(accounts);
  }, [data]);

  const linkedAccountIdSet = useMemo(
    () => new Set((linkedSocials?.value ?? []).map((sm) => sm.id)),
    [linkedSocials]
  );

  // Auto-seed selection from workspace-linked accounts on first open after the linked
  // list arrives. We only seed once per open so user's manual deselects aren't overwritten.
  const didSeedRef = useRef(false);
  useEffect(() => {
    if (!isOpen) return;
    if (didSeedRef.current) return;
    if (!linkedSocials?.value || !data?.value) return;
    if (linkedAccountIdSet.size === 0) {
      didSeedRef.current = true;
      return;
    }

    const byPlatform: Record<string, string[]> = {};
    const platforms = new Set<PostBuilderPlatform>();
    for (const account of data.value) {
      if (!linkedAccountIdSet.has(account.id)) continue;
      const type = account.type?.toLowerCase();
      const config = PLATFORM_LABELS[type];
      if (!config) continue;
      platforms.add(config.id);
      byPlatform[config.id] = [...(byPlatform[config.id] ?? []), account.id];
    }
    setSelectedPlatforms(Array.from(platforms));
    setSelectedAccounts(byPlatform);
    didSeedRef.current = true;
  }, [isOpen, linkedSocials, data, linkedAccountIdSet]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedPlatforms([]);
      setSelectedAccounts({});
      setPublishType('now');
      setScheduleDate(undefined);
      setScheduleTime('');
      setIsConfirmOpen(false);
      setIsPublishing(false);
      didSeedRef.current = false;
    }
  }, [isOpen]);

  const persistAccountLink = async (accountId: string, shouldLink: boolean) => {
    if (!workspaceId) return;
    try {
      if (shouldLink) {
        await linkSocialMediaToWorkspace(workspaceId, accountId);
      } else {
        await unlinkSocialMediaFromWorkspace(workspaceId, accountId);
      }
      void queryClient.invalidateQueries({ queryKey: ['workspace-linked-socials', workspaceId] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save selection';
      toast.error(msg);
    }
  };

  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const handleConnectPlatform = async (platform: 'facebook' | 'instagram' | 'tiktok' | 'threads') => {
    if (!workspaceId) {
      toast.error('Open a workspace to connect a social account from here.');
      return;
    }
    setConnectingPlatform(platform);
    try {
      stashOAuthAutoLinkIntent({
        workspaceId,
        platform,
        returnTo: window.location.pathname + window.location.search
      });

      // Capture the editor's in-flight captions so we can restore them + auto-reopen
      // the publish dialog when the user lands back after OAuth.
      if (postBuilderId) {
        const storeState = usePostBuilder.getState();
        stashPublishContinuation({
          builderId: postBuilderId,
          platformContents: storeState.platformContents,
          activePlatform: storeState.activePlatform
        });
      }

      let resp;
      if (platform === 'facebook') resp = await getFacebookAuthUrl();
      else if (platform === 'instagram') resp = await getInstagramAuthUrl();
      else if (platform === 'tiktok') resp = await getTikTokAuthUrl();
      else resp = await getThreadsAuthUrl();

      if (resp.isSuccess && resp.value?.authorizationUrl) {
        window.location.href = resp.value.authorizationUrl;
      } else {
        toast.error(resp.error?.description || `Failed to start ${platform} connection.`);
        setConnectingPlatform(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to connect ${platform}.`);
      setConnectingPlatform(null);
    }
  };

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
        // Unlink any accounts under this platform from the workspace when user
        // removes the platform entirely.
        const currentAccounts = selectedAccounts[platform] ?? [];
        for (const accountId of currentAccounts) {
          if (linkedAccountIdSet.has(accountId)) {
            void persistAccountLink(accountId, false);
          }
        }
        setSelectedAccounts((current) => ({ ...current, [platform]: [] }));
        return prev.filter((item) => item !== platform);
      }

      return [...prev, platform];
    });
  };

  const toggleAccount = (platform: PostBuilderPlatform, accountId: string) => {
    if (!isPlatformSelected(platform)) return;

    const current = selectedAccounts[platform] ?? [];
    const isSelected = current.includes(accountId);
    const next = isSelected ? current.filter((id) => id !== accountId) : [...current, accountId];

    setSelectedAccounts((prev) => ({ ...prev, [platform]: next }));

    // Persist to workspace so revisiting this workspace auto-selects the same accounts.
    // Skip the call if state already matches the BE (e.g. seeding reconciliation).
    const isAlreadyLinked = linkedAccountIdSet.has(accountId);
    if (!isSelected && !isAlreadyLinked) {
      void persistAccountLink(accountId, true);
    } else if (isSelected && isAlreadyLinked) {
      void persistAccountLink(accountId, false);
    }
  };

  const selectedPlatformSet = useMemo(() => new Set(selectedPlatforms), [selectedPlatforms]);
  const canSubmit = selectedPlatforms.length > 0 && !isPublishing;

  const handleSubmit = async () => {
    setIsConfirmOpen(false);
    setIsPublishing(true);

    const platformPayloads = payloads.filter((item) => selectedPlatformSet.has(item.platform));

    // Kick off all enqueue calls in parallel — the BE now queues each (post, socialMediaId)
    // target and returns 202 immediately. SignalR notifications drive the rest of the UX.
    let acceptedCount = 0;
    const acceptFailures: { platform: PostBuilderPlatform; message: string }[] = [];

    await Promise.all(
      platformPayloads.map(async (item) => {
        const accountIds = selectedAccounts[item.platform] ?? [];
        if (accountIds.length === 0) return;

        try {
          let postId = item.postId ?? null;

          if (postId) {
            // Only re-save the caption if we actually have text — otherwise we'd overwrite
            // a previously-saved caption with an empty string (Facebook multi-page case).
            if (item.content.trim().length > 0) {
              const updatePayload: Partial<CreatePostPayload> = {
                content: {
                  content: item.content,
                  hashtag: null,
                  resource_list: item.resourceIds,
                  post_type: modeToPostType(item.mode)
                }
              };

              await updatePost(postId, updatePayload);
            }
          } else {
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
            acceptFailures.push({ platform: item.platform, message: 'Post could not be created.' });
            return;
          }

          await publishPost({
            postId,
            socialMediaIds: accountIds
          });

          acceptedCount++;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Publish failed';
          console.error(`Failed to enqueue ${item.platform}:`, message);
          acceptFailures.push({ platform: item.platform, message });
        }
      })
    );

    setIsPublishing(false);

    if (acceptedCount > 0 && postBuilderId) {
      // Reflect the new "processing" placeholder publications + post.Status immediately.
      void queryClient.invalidateQueries({ queryKey: ['post-builder', postBuilderId] });
    }

    // Start toasts are intentionally suppressed — the publishing banner on the post-builder
    // + the final batch-completed notification from the hub are enough signal for the user.
    for (const failure of acceptFailures) {
      toast.error(
        `${PLATFORM_LABELS[failure.platform === 'thread' ? 'threads' : failure.platform]?.label ?? failure.platform}: ${failure.message}`
      );
    }

    // Close immediately so the user can keep using the app while publishes run in the background.
    onClose();
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
            <div className='flex flex-col items-center justify-center gap-4 py-10 text-zinc-400'>
              <div className='text-center'>
                <p className='text-sm font-medium text-white'>No social accounts connected</p>
                <p className='text-xs text-zinc-500'>
                  Connect one here — we'll auto-link it to this workspace so it's pre-selected next time.
                </p>
              </div>
              <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
                {(['facebook', 'instagram', 'tiktok', 'threads'] as const).map((p) => (
                  <Button
                    key={p}
                    type='button'
                    variant='outline'
                    disabled={connectingPlatform === p}
                    onClick={() => handleConnectPlatform(p)}
                    className='border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-white'
                  >
                    {connectingPlatform === p ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Plus className='mr-2 h-4 w-4' />
                    )}
                    {PLATFORM_LABELS[p].label}
                  </Button>
                ))}
              </div>
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
                  {(['facebook', 'instagram', 'tiktok', 'threads'] as const)
                    .filter((p) => {
                      const fePlatformId = PLATFORM_LABELS[p].id;
                      return !platformGroups.some((g) => g.id === fePlatformId);
                    })
                    .map((p) => (
                      <button
                        key={p}
                        type='button'
                        disabled={connectingPlatform === p}
                        onClick={() => handleConnectPlatform(p)}
                        className='flex items-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-400 hover:border-purple-500/60 hover:text-purple-300 disabled:opacity-60'
                      >
                        {connectingPlatform === p ? (
                          <Loader2 className='h-4 w-4 animate-spin' />
                        ) : (
                          <Plus className='h-4 w-4' />
                        )}
                        {PLATFORM_LABELS[p].label}
                      </button>
                    ))}
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
                          {(() => {
                            const connectKey = platform.id === 'thread' ? 'threads' : platform.id;
                            const isConnecting = connectingPlatform === connectKey;
                            return (
                              <button
                                type='button'
                                disabled={isConnecting}
                                onClick={() => handleConnectPlatform(connectKey)}
                                className='flex items-center gap-2 rounded-md border border-dashed border-zinc-700 bg-transparent px-2 py-1.5 text-xs text-zinc-400 hover:border-purple-500/60 hover:text-purple-300 disabled:opacity-60'
                              >
                                {isConnecting ? (
                                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                                ) : (
                                  <Plus className='h-3.5 w-3.5' />
                                )}
                                Add another account
                              </button>
                            );
                          })()}
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
