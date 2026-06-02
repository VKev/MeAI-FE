import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FacebookIcon, InstagramIcon, ThreadsIcon, TiktokIcon } from '@/components/ui/icons/social-icons';
import type { PostMedia } from '@/models/post.model';
import type { SocialMedia } from '@/models/social-media.model';
import { publishPost, updatePost } from '@/services/client/post.client';
import { cn } from '@/lib/utils';
import { getSocialMediaAvatar, getSocialMediaDisplayName } from '@/utils/social-media-display';
import { formatPostType, normalizePostType } from '@/utils/post-type';

export type DirectPostPublishPlatform = 'tiktok' | 'facebook' | 'instagram' | 'thread';
export type DirectPostPublishMode = 'post' | 'posts' | 'reel' | 'reels' | 'video' | 'image';

export type DirectPostPublishPayload = {
  platform: DirectPostPublishPlatform;
  content: string;
  resourceIds: string[];
  mode: DirectPostPublishMode;
  postId: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  payloads: DirectPostPublishPayload[];
  accounts: SocialMedia[];
  media?: PostMedia[];
  title?: string;
  emptyAccountMessage?: string;
  defaultSelectedAccountIds?: string[];
  selectAllByDefault?: boolean;
  invalidateQueryKeys?: Array<readonly unknown[]>;
  publishErrorFallback?: string;
  successDescription?: string;
};

type PlatformDisplay = {
  label: string;
  icon: ComponentType<{ size?: number; color?: string; className?: string }>;
  badgeClass: string;
};

const PLATFORM_DISPLAY: Record<DirectPostPublishPlatform, PlatformDisplay> = {
  facebook: { label: 'Facebook', icon: FacebookIcon, badgeClass: 'bg-blue-600' },
  instagram: { label: 'Instagram', icon: InstagramIcon, badgeClass: 'bg-gradient-to-br from-pink-500 to-amber-500' },
  tiktok: { label: 'TikTok', icon: TiktokIcon, badgeClass: 'bg-black' },
  thread: { label: 'Threads', icon: ThreadsIcon, badgeClass: 'bg-black' }
};

function normalizePublishPlatform(type?: string | null): DirectPostPublishPlatform | null {
  switch (type?.trim().toLowerCase()) {
    case 'facebook':
    case 'fb':
      return 'facebook';
    case 'instagram':
    case 'ig':
      return 'instagram';
    case 'tiktok':
      return 'tiktok';
    case 'thread':
    case 'threads':
      return 'thread';
    default:
      return null;
  }
}

function formatAccountLabel(account: SocialMedia) {
  const name = getSocialMediaDisplayName(account);
  const type = account.type ? account.type[0].toUpperCase() + account.type.slice(1) : 'Account';
  return `${name} - ${type}`;
}

export default function DirectPostPublishDialog({
  isOpen,
  onClose,
  payloads,
  accounts,
  title = 'Publish Post',
  emptyAccountMessage = 'This post is not connected to a publishable social account.',
  defaultSelectedAccountIds,
  selectAllByDefault = true,
  invalidateQueryKeys = [],
  publishErrorFallback = 'Unable to publish post.',
  successDescription = 'Post is being published...'
}: Props) {
  const queryClient = useQueryClient();
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const payload = payloads[0] ?? null;
  const platform = payload?.platform ?? null;
  const selectedAccounts = useMemo(
    () => accounts.filter((account) => selectedAccountIds.includes(account.id)),
    [accounts, selectedAccountIds]
  );
  const selectedPlatforms = useMemo(() => {
    return Array.from(
      new Set(
        selectedAccounts
          .map((account) => normalizePublishPlatform(account.type))
          .filter((item): item is DirectPostPublishPlatform => Boolean(item))
      )
    );
  }, [selectedAccounts]);
  const displayPlatform = selectedPlatforms.length === 1 ? selectedPlatforms[0] : platform;
  const hasMixedPlatforms = selectedPlatforms.length > 1;
  const platformDisplay = displayPlatform ? PLATFORM_DISPLAY[displayPlatform] : null;
  const PlatformIcon = hasMixedPlatforms ? Send : (platformDisplay?.icon ?? Send);
  const platformLabel = hasMixedPlatforms ? 'Multiple platforms' : (platformDisplay?.label ?? 'Platform');
  const canPublish = Boolean(payload) && selectedAccounts.length > 0 && !isPublishing;

  useEffect(() => {
    if (!isOpen) {
      setSelectedAccountIds([]);
      setIsPublishing(false);
      return;
    }

    const availableAccountIds = new Set(accounts.map((account) => account.id));
    const defaultIds = (defaultSelectedAccountIds ?? []).filter((accountId) => availableAccountIds.has(accountId));

    setSelectedAccountIds(
      defaultIds.length > 0 ? defaultIds : selectAllByDefault ? accounts.map((account) => account.id) : []
    );
  }, [accounts, defaultSelectedAccountIds, isOpen, selectAllByDefault]);

  const toggleAccount = (accountId: string) => {
    setSelectedAccountIds((current) =>
      current.includes(accountId) ? current.filter((id) => id !== accountId) : [...current, accountId]
    );
  };

  const handlePublish = async () => {
    if (!payload || selectedAccountIds.length === 0) return;

    setIsPublishing(true);

    try {
      await updatePost(payload.postId, {
        content: {
          content: payload.content,
          hashtag: null,
          resource_list: payload.resourceIds,
          post_type: normalizePostType(payload.mode)
        }
      });

      await publishPost({
        postId: payload.postId,
        socialMediaIds: selectedAccountIds,
        isPrivate: false
      });

      void queryClient.invalidateQueries({ queryKey: ['posts'] });
      for (const queryKey of invalidateQueryKeys) {
        void queryClient.invalidateQueries({ queryKey });
      }
      toast.success('Success', {
        description: successDescription
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : publishErrorFallback;
      toast.error('Publish failed', { description: message });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPublishing && onClose()}>
      <DialogContent
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          padding: 0,
          width: 'min(620px, calc(100vw - 32px))',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100dvh - 32px)'
        }}
        className='overflow-hidden border border-white/10 bg-[#080911] text-white shadow-[0_24px_90px_-45px_rgba(124,58,237,0.55)]'
      >
        <DialogHeader className='shrink-0 border-b border-white/10 px-5 py-4 pr-12'>
          <DialogTitle className='flex min-w-0 items-center gap-3 text-lg leading-6'>
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-lg shadow-[0_10px_30px_-14px_rgba(255,255,255,0.45)]',
                platformDisplay?.badgeClass ?? 'bg-zinc-800'
              )}
            >
              <PlatformIcon size={18} color='white' />
            </span>
            <span className='min-w-0 truncate'>{title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4 bg-[#0b0c12] p-5'>
          <section className='rounded-lg border border-zinc-800 bg-zinc-900/45 p-4'>
            <p className='text-xs font-semibold uppercase text-zinc-500'>Platform</p>
            <div className='mt-3 flex items-center gap-3'>
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg',
                  platformDisplay?.badgeClass ?? 'bg-zinc-800'
                )}
              >
                <PlatformIcon size={18} color='white' />
              </span>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-semibold text-white'>{platformLabel}</p>
                <p className='text-xs text-zinc-500'>{payload ? formatPostType(payload.mode) : 'Post'}</p>
              </div>
            </div>
          </section>

          <section className='space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/45 p-4'>
            <div className='flex items-center justify-between gap-3'>
              <p className='text-xs font-semibold uppercase text-zinc-500'>Destination</p>
              <span className='text-xs text-zinc-500'>{selectedAccounts.length} selected</span>
            </div>
            {accounts.length === 0 ? (
              <div className='rounded-lg border border-dashed border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-400'>
                {emptyAccountMessage}
              </div>
            ) : (
              <div className='max-h-[45dvh] space-y-2 overflow-y-auto pr-1'>
                {accounts.map((account) => {
                  const isSelected = selectedAccountIds.includes(account.id);
                  const avatar = getSocialMediaAvatar(account);

                  return (
                    <label
                      key={account.id}
                      className={cn(
                        'flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/75 px-3 py-2 text-sm transition hover:border-violet-400/50 hover:bg-zinc-900/80',
                        isSelected && 'border-violet-400/70 bg-violet-500/12 text-white'
                      )}
                    >
                      <input
                        type='checkbox'
                        checked={isSelected}
                        onChange={() => toggleAccount(account.id)}
                        className='h-4 w-4 accent-violet-600'
                      />
                      {avatar ? (
                        <img src={avatar} alt='' className='size-8 shrink-0 rounded-full object-cover' />
                      ) : (
                        <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-200'>
                          {getSocialMediaDisplayName(account).slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className='min-w-0 flex-1 truncate'>{formatAccountLabel(account)}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <DialogFooter className='shrink-0 border-t border-white/10 bg-[#080911] px-5 py-3'>
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
            onClick={handlePublish}
            disabled={!canPublish}
            className='inline-flex min-w-32 items-center gap-2 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60'
          >
            {isPublishing ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
