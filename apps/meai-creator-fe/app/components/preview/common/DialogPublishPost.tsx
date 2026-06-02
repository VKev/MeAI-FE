import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { PostBuilderMode, PostBuilderPlatform } from '@/routes/post-builder/hooks/usePostBuilder';
import { cn } from '@/lib/utils';
import { fetchSocialMedias } from '@/services/client/social-media.client';
import { DatePickerInput } from '@/components/ui/date-picker-input';

import usePostBuilder from '@/routes/post-builder/hooks/usePostBuilder';
import useMediaResourceStore from '@/store/media-resource.store';
import { createPost, publishPost, schedulePost, type CreatePostPayload } from '@/services/client/post.client';
import type { TPostBuilder } from '@/models/post-builder.model';
import type { SocialMedia } from '@/models/social-media.model';
import type { CreatePostSchedulePayload } from '@/models/post.model';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { resolvePostTypeForMode } from '@/routes/post-builder/hooks/publish-utils';
import { getSocialMediaAvatar, getSocialMediaDisplayName } from '@/utils/social-media-display';

export type PublishPayload = {
  platform: PostBuilderPlatform;
  content: string;
  resourceIds: string[];
  mode: PostBuilderMode;
  postId?: string | null;
};

type DialogPublishPostProps = {
  isOpen: boolean;
  onClose: () => void;
  payloads: PublishPayload[];
  workspaceId?: string;
  postBuilder?: TPostBuilder | null;
};

type PublishType = 'now' | 'schedule';

type PlatformGroup = {
  platform: PostBuilderPlatform;
  label: string;
  accounts: SocialMedia[];
};

function normalizePlatform(value: string | null | undefined): PostBuilderPlatform | null {
  const normalized = value?.trim().toLowerCase();

  switch (normalized) {
    case 'tiktok':
      return 'tiktok';
    case 'facebook':
    case 'fb':
      return 'facebook';
    case 'instagram':
    case 'ig':
      return 'instagram';
    case 'threads':
    case 'thread':
      return 'thread';
    default:
      return null;
  }
}

function getPlatformLabel(platform: PostBuilderPlatform): string {
  return platform === 'thread'
    ? 'Threads'
    : platform.charAt(0).toUpperCase() + platform.slice(1);
}

function groupAccountsByPlatform(accounts: SocialMedia[]): PlatformGroup[] {
  const groups = new Map<PostBuilderPlatform, PlatformGroup>();

  for (const account of accounts) {
    const platform = normalizePlatform(account.type);
    if (!platform) continue;

    if (!groups.has(platform)) {
      groups.set(platform, {
        platform,
        label: getPlatformLabel(platform),
        accounts: []
      });
    }
    groups.get(platform)!.accounts.push(account);
  }

  return Array.from(groups.values());
}

function getPublishedAccountIdSet(postBuilder: TPostBuilder | null | undefined): Set<string> {
  const accountIds = new Set<string>();

  for (const group of postBuilder?.socialMedia ?? []) {
    for (const post of group.posts ?? []) {
      const hasPublishedPublication = (post.publications ?? []).some(
        (publication) => publication.publishStatus?.toLowerCase() === 'published' && publication.socialMediaId
      );
      if (!hasPublishedPublication) continue;

      if (group.socialMediaId) {
        accountIds.add(group.socialMediaId);
      }

      for (const publication of post.publications ?? []) {
        if (publication.publishStatus?.toLowerCase() !== 'published') continue;
        if (publication.socialMediaId) accountIds.add(publication.socialMediaId);
      }
    }
  }

  return accountIds;
}

function DialogPublishPost({ isOpen, onClose, payloads, workspaceId, postBuilder }: DialogPublishPostProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id: postBuilderId } = useParams();
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

  const sourceAccounts = useMemo(() => data?.value ?? [], [data?.value]);
  const publishedAccountIdSet = useMemo(() => getPublishedAccountIdSet(postBuilder), [postBuilder]);

  const platformGroups = useMemo(() => {
    return groupAccountsByPlatform(sourceAccounts).filter((group) => group.accounts.length > 0);
  }, [sourceAccounts]);

  const platformPublishStates = usePostBuilder((state) => state.platformPublishStates);

  const publishablePayloads = useMemo(() => {
    return payloads.filter((item) => {
      const status = platformPublishStates[item.platform]?.[item.mode]?.status;
      return status !== 'published' && status !== 'publishing' && status !== 'unpublishing';
    });
  }, [payloads, platformPublishStates]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedAccounts({});
      setPublishType('now');
      setScheduleDate(undefined);
      setScheduleTime('');
      setIsPublishing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // when switching to now, clear schedule; when switching to schedule, prefill +5min
    if (publishType === 'now') {
      setScheduleDate(undefined);
      setScheduleTime('');
      return;
    }

    // publishType === 'schedule' -> auto-fill date/time to now + 5 minutes
    const now = new Date();
    const plus5 = new Date(now.getTime() + 5 * 60 * 1000);
    // set date to today and time to plus5
    setScheduleDate(new Date(plus5.getFullYear(), plus5.getMonth(), plus5.getDate()));
    const hh = String(plus5.getHours()).padStart(2, '0');
    const mm = String(plus5.getMinutes()).padStart(2, '0');
    setScheduleTime(`${hh}:${mm}`);
  }, [publishType]);

  const buildScheduledAtUtc = () => {
    if (!scheduleDate || !scheduleTime) return null;

    const [hours, minutes] = scheduleTime.split(':').map((s) => parseInt(s, 10));
    const scheduledLocal = new Date(
      scheduleDate.getFullYear(),
      scheduleDate.getMonth(),
      scheduleDate.getDate(),
      hours || 0,
      minutes || 0
    );

    return scheduledLocal.toISOString();
  };

  const toggleAccount = (platform: string, accountId: string) => {
    setSelectedAccounts((prev) => {
      const current = prev[platform] ?? [];
      const isSelected = current.includes(accountId);
      const next = isSelected ? current.filter((id) => id !== accountId) : [...current, accountId];
      return { ...prev, [platform]: next };
    });
  };

  const selectedPlatformSet = useMemo(() => {
    return new Set(
      Object.entries(selectedAccounts)
        .filter(([, arr]) => (arr ?? []).length > 0)
        .map(([platform]) => platform)
    );
  }, [selectedAccounts]);

  const hasValidSelection = useMemo(() => {
    const anySelected = Object.values(selectedAccounts).some((arr) => (arr ?? []).length > 0);
    if (!anySelected) return false;

    if (publishType === 'schedule') {
      if (!scheduleDate || !scheduleTime) return false;
      // combine date + time and ensure >= now + 5 minutes
      const [hours, minutes] = scheduleTime.split(':').map((s) => parseInt(s, 10));
      const scheduled = new Date(
        scheduleDate.getFullYear(),
        scheduleDate.getMonth(),
        scheduleDate.getDate(),
        hours || 0,
        minutes || 0
      );
      const minAllowed = new Date(Date.now() + 5 * 60 * 1000);
      if (scheduled.getTime() < minAllowed.getTime()) return false;
    }

    return true;
  }, [selectedAccounts, publishType, scheduleDate, scheduleTime]);

  const canSubmit = hasValidSelection && !isPublishing;

  const handleSubmit = async () => {
    setIsPublishing(true);

    const mediaResources = useMediaResourceStore.getState().mediaResources;
    const typeById = new Map(mediaResources.map((r) => [r.id, r.type]));
    const scheduledAtUtc = publishType === 'schedule' ? buildScheduledAtUtc() : null;

    const platformPayloads = publishablePayloads.filter((item) => selectedPlatformSet.has(item.platform));

    let acceptedCount = 0;
    const acceptFailures: { platform: string; message: string }[] = [];

    await Promise.all(
      platformPayloads.map(async (item) => {
        const accountIds = selectedAccounts[item.platform] ?? [];
        if (accountIds.length === 0) return;

        const isReelMode = item.mode === 'reel' || item.mode === 'video';
        if (isReelMode) {
          const mediaTypes = item.resourceIds.map((id) => typeById.get(id)).filter(Boolean);
          if (mediaTypes.length !== 1 || mediaTypes[0] !== 'video') {
            acceptFailures.push({
              platform: item.platform,
              message: `${item.platform} reels require exactly one video.`
            });
            return;
          }
        }

        try {
          let postId = item.postId ?? null;

          if (!postId) {
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

          const isPrivate = item.platform === 'tiktok' ? true : false;

          if (publishType === 'schedule') {
            if (!scheduledAtUtc) {
              acceptFailures.push({ platform: item.platform, message: 'Invalid schedule date/time.' });
              return;
            }

            const schedulePayload: CreatePostSchedulePayload = {
              scheduleGroupId: null,
              scheduledAtUtc,
              timezone: null,
              socialMediaIds: accountIds,
              isPrivate
            };

            await schedulePost(postId, schedulePayload);
          } else {
            await publishPost({
              postId,
              socialMediaIds: accountIds,
              isPrivate
            });
          }

          acceptedCount++;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Publish failed';
          console.error(`Failed to enqueue ${item.platform}:`, message);
          acceptFailures.push({ platform: item.platform, message });
        }
      })
    );

    setIsPublishing(false);

    if (acceptedCount > 0) {
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
    }

    if (acceptedCount > 0 && postBuilderId) {
      void queryClient.invalidateQueries({ queryKey: ['post-builder', postBuilderId] });
    }

    for (const failure of acceptFailures) {
      toast.error(`${failure.platform}: ${failure.message}`);
    }
    navigate(workspaceId ? `/workspace/${workspaceId}/product` : '/user/product');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPublishing && onClose()}>
      <DialogContent className='max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-950 text-zinc-100'>
        <DialogHeader className='border-b border-zinc-800 pb-4'>
          <DialogTitle>Publish Post</DialogTitle>
        </DialogHeader>

        <div className='overflow-y-auto p-4'>
          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-5 w-5 animate-spin text-purple-400' />
              <span className='ml-2 text-sm text-zinc-400'>Loading accounts...</span>
            </div>
          ) : platformGroups.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-3 py-10'>
              <p className='text-sm text-zinc-400'>No social accounts available</p>
            </div>
          ) : (
            <div className='space-y-4'>
              <h3 className='text-sm font-semibold text-zinc-300'>Select accounts to publish</h3>
              {platformGroups.map((platformGroup) => {
                const selectedCount = (selectedAccounts[platformGroup.platform] ?? []).length;

                return (
                  <div key={platformGroup.platform} className='rounded-lg border border-zinc-800 bg-zinc-900/45 p-4'>
                    <div className='flex items-center mb-3'>
                      <span className='font-medium text-white'>{platformGroup.label}</span>
                      <span className='ml-auto text-xs text-zinc-500'>
                        {selectedCount}/{platformGroup.accounts.length}
                      </span>
                    </div>

                    <div className='space-y-2 ml-0'>
                      {platformGroup.accounts.map((account) => {
                        const isSelected = (selectedAccounts[platformGroup.platform] ?? []).includes(account.id);
                        const isPublished = publishedAccountIdSet.has(account.id);
                        return (
                          <label
                            key={account.id}
                            className={cn(
                              'flex items-center gap-2 p-2 rounded-md cursor-pointer border border-zinc-800 transition-colors',
                              isSelected && 'border-purple-500/60 bg-purple-500/10',
                              isPublished && 'cursor-not-allowed opacity-55'
                            )}
                          >
                            <input
                              type='checkbox'
                              checked={isSelected}
                              disabled={isPublished}
                              onChange={() => !isPublished && toggleAccount(platformGroup.platform, account.id)}
                              className='h-3.5 w-3.5 accent-purple-600'
                            />
                            {getSocialMediaAvatar(account) ? (
                              <img
                                src={getSocialMediaAvatar(account)}
                                alt={getSocialMediaDisplayName(account)}
                                className='w-5 h-5 rounded-full object-cover'
                              />
                            ) : (
                              <div className='w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-semibold text-zinc-200'>
                                {getSocialMediaDisplayName(account).charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className='text-sm text-zinc-200 truncate'>{getSocialMediaDisplayName(account)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className='p-4'>
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
              <div className='grid gap-3 sm:grid-cols-2 mt-2'>
                <div className='space-y-1.5'>
                  <label className='text-xs text-zinc-400'>Date</label>
                  <DatePickerInput fromDate={new Date()} selected={scheduleDate} onSelect={setScheduleDate} />
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

        <DialogFooter className='border-t border-zinc-800 pt-4'>
          <Button
            type='button'
            variant='outline'
            onClick={onClose}
            disabled={isPublishing}
            className='border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-white'
          >
            Cancel
          </Button>
          <Button
            type='button'
            onClick={handleSubmit}
            disabled={!canSubmit}
            className='bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60 inline-flex items-center gap-2'
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
