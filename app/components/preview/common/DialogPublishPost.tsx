import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router';
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
import DialogPublishPreview, { type TargetPreview } from '@/components/preview/common/DialogPublishPreview';
import type { PostBuilderMode, PostBuilderPlatform } from '@/routes/post-builder/hooks/usePostBuilder';
import { cn } from '@/lib/utils';
import {
  fetchSocialMedias,
  fetchWorkspaceLinkedSocialMedias,
  linkSocialMediaToWorkspace,
  unlinkSocialMediaFromWorkspace
} from '@/services/client/social-media.client';

import usePostBuilder from '@/routes/post-builder/hooks/usePostBuilder';
import useMediaResourceStore from '@/store/media-resource.store';
import { createPost, publishPost, updatePost, type CreatePostPayload } from '@/services/client/post.client';
import type { SocialMedia } from '@/models/social-media.model';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { resolvePostTypeForMode } from '@/routes/post-builder/hooks/publish-utils';

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

function DialogPublishPost({ isOpen, onClose, payloads, workspaceId }: DialogPublishPostProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id: postBuilderId } = useParams();
  const [selectedPlatforms, setSelectedPlatforms] = useState<PostBuilderPlatform[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string[]>>({});
  const [publishType, setPublishType] = useState<PublishType>('now');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['social-medias-publish'],
    queryFn: () => fetchSocialMedias(),
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

  const linkedAccountIdSet = useMemo(() => new Set((linkedSocials?.value ?? []).map((sm) => sm.id)), [linkedSocials]);

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

  const platformPublishStates = usePostBuilder((state) => state.platformPublishStates);

  // Don't re-publish modes that are already live or in-flight. `publishPayload` in
  // PostBuilderHeader still emits them (so Save Draft continues to persist edits), but
  // the publish dialog must skip them to avoid duplicate platform posts.
  const publishablePayloads = useMemo(
    () =>
      payloads.filter((item) => {
        const status = platformPublishStates[item.platform]?.[item.mode]?.status;
        return status !== 'published' && status !== 'publishing' && status !== 'unpublishing';
      }),
    [payloads, platformPublishStates]
  );

  const previewTargets: TargetPreview[] = useMemo(() => {
    const allAccounts = data?.value ?? [];
    const byId = new Map(allAccounts.map((a) => [a.id, a]));
    return publishablePayloads
      .filter((item) => selectedPlatformSet.has(item.platform))
      .map((item) => {
        const ids = selectedAccounts[item.platform] ?? [];
        const accounts = ids.map((id) => byId.get(id)).filter((a): a is SocialMedia => !!a);
        return {
          platform: item.platform,
          mode: item.mode,
          accounts,
          content: item.content,
          contentHtml: item.contentHtml,
          resourceIds: item.resourceIds
        };
      })
      .filter((t) => t.accounts.length > 0);
  }, [publishablePayloads, selectedPlatformSet, selectedAccounts, data]);

  const totalPreviewAccounts = useMemo(
    () => previewTargets.reduce((sum, target) => sum + target.accounts.length, 0),
    [previewTargets]
  );
  const canSubmit = previewTargets.length > 0 && !isPublishing;

  const handleSubmit = async () => {
    setIsPublishing(true);

    // Build a resource-type lookup for the mixed-media preflight. FB and IG posts can't
    // combine images + video in one post — their Graph APIs reject it. If the builder's
    // stored resource_list still has both (legacy state, pre-guard), catch it here and
    // surface a clear error instead of blindly firing a publish that will 400 at the BE.
    const mediaResources = useMediaResourceStore.getState().mediaResources;
    const typeById = new Map(mediaResources.map((r) => [r.id, r.type]));

    const platformPayloads = publishablePayloads.filter((item) => selectedPlatformSet.has(item.platform));

    // Kick off all enqueue calls in parallel — the BE now queues each (post, socialMediaId)
    // target and returns 202 immediately. SignalR notifications drive the rest of the UX.
    let acceptedCount = 0;
    const acceptFailures: { platform: PostBuilderPlatform; message: string }[] = [];

    await Promise.all(
      platformPayloads.map(async (item) => {
        const accountIds = selectedAccounts[item.platform] ?? [];
        if (accountIds.length === 0) return;

        // Preflight: FB / IG post mode requires single-type media.
        const requiresSingleType =
          (item.platform === 'facebook' || item.platform === 'instagram') && item.mode === 'post';
        if (requiresSingleType) {
          const types = new Set(item.resourceIds.map((id) => typeById.get(id)).filter(Boolean));
          if (types.has('image') && types.has('video')) {
            acceptFailures.push({
              platform: item.platform,
              message: `${item.platform} post can't mix images and a video — keep one type and try again.`
            });
            return;
          }
        }

        try {
          let postId = item.postId ?? null;

          if (postId) {
            // Always sync caption + resources + post_type before publish. publishPayload
            // already filters out empty buckets upstream (PostBuilderHeader), so we only
            // reach here when this (platform, mode) bucket has real content or media — we
            // must not silently keep a stale post_type like "posts" on a bucket the user
            // flipped to reel. Sending `post_type: 'reels'` here is the only thing that
            // makes the BE publish through the Reels endpoint.
            const updatePayload: Partial<CreatePostPayload> = {
              content: {
                content: item.content,
                hashtag: null,
                resource_list: item.resourceIds,
                post_type: resolvePostTypeForMode(item.platform, item.mode)
              }
            };

            await updatePost(postId, updatePayload);
          } else {
            // New mode bucket for this builder (e.g. user added a Reel to a builder that only
            // had a Post). Attach the new post to the builder + record its platform so the
            // subsequent GET groups it as (platform, type) and the publish status reconciles
            // in `buildPlatformPublishStates`.
            const createPayload: CreatePostPayload = {
              workspaceId: workspaceId || null,
              socialMediaId: null,
              title: null,
              content: {
                content: item.content,
                hashtag: null,
                resource_list: item.resourceIds,
                post_type: resolvePostTypeForMode(item.platform, item.mode)
              },
              status: 'draft',
              postBuilderId: postBuilderId ?? null,
              platform: item.platform === 'thread' ? 'threads' : item.platform
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
      <DialogContent className='h-auto w-3xl! max-w-5xl max-h-[90vh] overflow-hidden border-zinc-800 bg-zinc-950 text-zinc-100'>
        <DialogHeader className='border-b border-zinc-800 pb-4'>
          <DialogTitle>Publish Post</DialogTitle>
        </DialogHeader>

        <div className='min-h-0 overflow-y-auto p-4'>
          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-5 w-5 animate-spin text-purple-400' />
              <span className='ml-2 text-sm text-zinc-400'>Loading accounts...</span>
            </div>
          ) : platformGroups.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-4 py-10 text-zinc-400'>
              <div className='text-center'>
                <p className='text-sm font-medium text-white'>No social accounts linked</p>
                <p className='text-xs text-zinc-500'>
                  Link your social media accounts to start publishing. Go to Social Links to connect them.
                </p>
              </div>
              <Button
                type='button'
                onClick={() => navigate('/user/social-links')}
                className='bg-purple-600 text-white hover:bg-purple-700'
              >
                Go to Social Links
              </Button>
            </div>
          ) : (
            <div className='grid gap-4 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] lg:items-start'>
              <div className='space-y-3'>
                <section className='space-y-2'>
                  <h3 className='text-xs font-semibold uppercase tracking-wide text-zinc-500'>Accounts</h3>
                  <div className='space-y-2.5'>
                    {platformGroups.map((platform) => {
                      const platformSelected = isPlatformSelected(platform.id);
                      const selected = selectedAccounts[platform.id] ?? [];
                      return (
                        <div
                          key={platform.id}
                          className={cn(
                            'rounded-lg border border-zinc-800 bg-zinc-900/45 p-3',
                            platformSelected && 'border-purple-500/60 bg-purple-500/10'
                          )}
                        >
                          <label className='flex items-center gap-2 text-sm text-zinc-200'>
                            <input
                              type='checkbox'
                              checked={platformSelected}
                              onChange={() => togglePlatform(platform.id)}
                              className='h-4 w-4 accent-purple-600'
                            />
                            <span className='font-medium text-white'>{platform.label}</span>
                            <span className='ml-auto text-xs tabular-nums text-zinc-400'>
                              {selected.length}/{platform.accounts.length}
                            </span>
                          </label>
                          <div
                            className={cn(
                              'mt-2 grid gap-2',
                              platform.accounts.length > 1 && 'sm:grid-cols-2 lg:grid-cols-1',
                              !platformSelected && 'opacity-60'
                            )}
                          >
                            {platform.accounts.map((account) => (
                              <label
                                key={account.id}
                                className={cn(
                                  'flex min-h-9 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/70 px-2.5 py-1.5 text-xs text-zinc-200',
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
                                    className='size-5 shrink-0 rounded-full object-cover'
                                  />
                                ) : (
                                  <span className='flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-semibold text-zinc-200'>
                                    {account.name.slice(0, 1).toUpperCase()}
                                  </span>
                                )}
                                <span className='truncate'>{account.name}</span>
                              </label>
                            ))}
                            {(() => {
                              return (
                                <button
                                  type='button'
                                  onClick={() => navigate('/user/social-links')}
                                  className='flex min-h-9 items-center gap-2 rounded-md border border-dashed border-zinc-700 bg-transparent px-2.5 py-1.5 text-xs text-zinc-400 hover:border-purple-500/60 hover:text-purple-300'
                                >
                                  <Plus className='h-3.5 w-3.5' />
                                  Add another account
                                </button>
                              );
                            })()}
                          </div>
                        </div>
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
                          onClick={() => navigate('/user/social-links')}
                          className='flex min-h-10 w-full items-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-400 hover:border-purple-500/60 hover:text-purple-300'
                        >
                          <Plus className='h-4 w-4' />
                          Connect {PLATFORM_LABELS[p].label}
                        </button>
                      ))}
                  </div>
                </section>

                <section className='space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/35 p-3'>
                  <h3 className='text-xs font-semibold uppercase tracking-wide text-zinc-500'>Publish</h3>
                  <div className='grid grid-cols-2 gap-2'>
                    <label
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-200',
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
                        'flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-200',
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

              <section className='min-w-0 space-y-2 lg:sticky lg:top-0'>
                <h3 className='text-xs font-semibold uppercase tracking-wide text-zinc-500'>Review</h3>
                <DialogPublishPreview targets={previewTargets} />
              </section>
            </div>
          )}
        </div>

        <DialogFooter className='border-t border-zinc-800 pt-4'>
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
            onClick={handleSubmit}
            disabled={!canSubmit}
            className='inline-flex min-w-36 items-center gap-2 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60'
          >
            {isPublishing && <Loader2 className='h-4 w-4 animate-spin' />}
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DialogPublishPost;
