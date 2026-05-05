import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSocialMedias, deleteSocialMedia } from '@/services/client/social-media.client';
import { getThreadsAuthUrl } from '@/services/client/threads.client';
import { getTikTokAuthUrl } from '@/services/client/tiktok.client';
import { getFacebookAuthUrl } from '@/services/client/facebook.client';
import { getInstagramAuthUrl } from '@/services/client/instagram.client';
import type { SocialMedia } from '@/models/social-media.model';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link2, Unlink, Check, Plus, ChevronDown, ChevronUp, Trash2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { TiktokIcon, FacebookIcon, InstagramIcon, ThreadsIcon } from '@/components/ui/icons/social-icons';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

interface PlatformConfig {
  key: string;
  name: string;
  color: string;
  brandColor: string;
  IconComponent: React.FC<{ size?: number; color?: string; className?: string }>;
}

const PLATFORMS: PlatformConfig[] = [
  { key: 'facebook', name: 'Facebook', color: 'text-blue-400', brandColor: '#1877F2', IconComponent: FacebookIcon },
  { key: 'instagram', name: 'Instagram', color: 'text-pink-400', brandColor: '#E4405F', IconComponent: InstagramIcon },
  { key: 'tiktok', name: 'TikTok', color: 'text-white', brandColor: '#000000', IconComponent: TiktokIcon },
  { key: 'threads', name: 'Threads', color: 'text-white', brandColor: '#000000', IconComponent: ThreadsIcon }
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const expandVariants: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }
};

export default function SocialLinks() {
  const queryClient = useQueryClient();

  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConfig | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<SocialMedia | null>(null);

  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());

  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['social-medias'],
    queryFn: () => fetchSocialMedias()
  });

  const disconnectMutation = useMutation({
    mutationFn: deleteSocialMedia,
    onSuccess: () => {
      toast.success('Account disconnected successfully.');
      queryClient.invalidateQueries({ queryKey: ['social-medias'] });
      setIsDisconnectOpen(false);
      setSelectedPlatform(null);
      setSelectedAccount(null);
    },
    onError: (error: any) => {
      const errData = error.response?.data;
      if (errData?.type === 'Subscription.Required') {
        toast.error(errData.detail || 'An active subscription is required.');
      } else {
        toast.error(errData?.detail || error.message || 'Failed to disconnect account.');
      }
    }
  });

  const accounts = data?.value || [];

  const getAccountsForPlatform = (platformKey: string): SocialMedia[] => {
    return accounts.filter((acc: SocialMedia) => acc.type === platformKey);
  };
  const togglePlatform = (platformKey: string) => {
    setExpandedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platformKey)) {
        next.delete(platformKey);
      } else {
        next.add(platformKey);
      }
      return next;
    });
  };

  const handleConnect = async (platform: PlatformConfig) => {
    const authFnMap: Record<string, () => Promise<any>> = {
      threads: () => getThreadsAuthUrl(),
      tiktok: () => getTikTokAuthUrl(),
      facebook: () => getFacebookAuthUrl(),
      instagram: () => getInstagramAuthUrl()
    };

    const authFn = authFnMap[platform.key];
    if (!authFn) return;

    setConnectingPlatform(platform.key);
    try {
      const response = await authFn();
      if (response.isSuccess && response.value?.authorizationUrl) {
        window.location.href = response.value.authorizationUrl;
      } else {
        toast.error(response.error?.description || `Failed to connect ${platform.name}. Please try again.`);
        setConnectingPlatform(null);
      }
    } catch (err) {
      toast.error(`Unable to connect ${platform.name}. Please check your connection and try again.`);
      setConnectingPlatform(null);
    }
  };

  const openDisconnectModal = (platform: PlatformConfig, account: SocialMedia) => {
    setSelectedPlatform(platform);
    setSelectedAccount(account);
    setIsDisconnectOpen(true);
  };

  const handleDisconnect = () => {
    if (selectedAccount) {
      disconnectMutation.mutate(selectedAccount.id);
    }
  };

  return (
    <div className='min-h-screen py-8 px-6'>
      {/* Header */}
      <section className='mb-10 flex items-center justify-between overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8'>
        <div className='flex items-center gap-4'>
          <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'>
            <Link2 className='h-7 w-7' />
          </div>

          <div className='space-y-1'>
            <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Social Links</h1>
            <p className='text-sm leading-relaxed text-slate-400'>
              Connect your social media accounts to auto-post content. You can connect multiple accounts per platform.
            </p>
          </div>
        </div>

        <Button
          type='button'
          variant='outline'
          onClick={() => void refetch()}
          className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white'
        >
          <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Sync Now
        </Button>
      </section>

      {/* Loading State */}
      {isLoading && (
        <div className='flex items-center justify-center text-white py-20'>
          <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mr-3'></div>
          Loading...
        </div>
      )}

      {/* Error State */}
      {!isLoading && isError && (
        <div className='flex flex-col items-center justify-center text-center py-20 max-w-3xl'>
          <div className='w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4'>
            <Unlink className='w-6 h-6 text-red-400' />
          </div>
          <h3 className='text-lg font-semibold text-white mb-2'>Failed to load accounts</h3>
          <p className='text-sm text-slate-400 mb-6'>We couldn't load your social media accounts. Please try again.</p>
          <Button onClick={() => void refetch()} className='bg-purple-600 text-white hover:bg-purple-700'>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <motion.div
          className='flex flex-col gap-4 w-full'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {PLATFORMS.map((platform) => {
            const platformAccounts = getAccountsForPlatform(platform.key);
            const isExpanded = expandedPlatforms.has(platform.key);
            const hasAccounts = platformAccounts.length > 0;
            const isPending = connectingPlatform === platform.key;

            return (
              <motion.div
                key={platform.key}
                variants={cardVariants}
                className='rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] overflow-hidden'
              >
                <button
                  onClick={() => togglePlatform(platform.key)}
                  className='w-full flex items-center justify-between p-4 hover:bg-neutral-800/50 transition-colors'
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${hasAccounts ? 'bg-neutral-700/80' : 'bg-neutral-800'}`}
                    >
                      <platform.IconComponent size={20} color='currentColor' className={platform.color} />
                    </div>
                    <div className='text-left'>
                      <h3 className='text-white font-semibold'>{platform.name}</h3>
                      <p className='text-xs text-slate-500'>
                        {hasAccounts ? (
                          <span className='text-green-400'>
                            {platformAccounts.length} account{platformAccounts.length > 1 ? 's' : ''} connected
                          </span>
                        ) : (
                          'Not connected'
                        )}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {hasAccounts && (
                      <div className='w-5 h-5 rounded-full bg-green-500 flex items-center justify-center'>
                        <Check className='w-3 h-3 text-white' />
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronUp className='w-5 h-5 text-slate-400' />
                    ) : (
                      <ChevronDown className='w-5 h-5 text-slate-400' />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      variants={expandVariants}
                      initial='hidden'
                      animate='visible'
                      exit='exit'
                      className='overflow-hidden'
                    >
                      <div className='p-4 pt-0 border-t border-neutral-700/50'>
                        {platform.key === 'facebook' &&
                          hasAccounts &&
                          (() => {
                            // Group FB accounts by the owning user. All pages from the same login
                            // share profile.userId + displayName + profilePictureUrl.
                            const byUser = new Map<
                              string,
                              { accounts: SocialMedia[]; name: string; avatar: string | null }
                            >();
                            for (const account of platformAccounts) {
                              const uid = account.profile?.userId ?? 'unknown';
                              const existing = byUser.get(uid);
                              if (existing) {
                                existing.accounts.push(account);
                              } else {
                                byUser.set(uid, {
                                  accounts: [account],
                                  name: account.profile?.displayName || 'Facebook user',
                                  avatar: account.profile?.profilePictureUrl ?? null
                                });
                              }
                            }

                            return Array.from(byUser.entries()).map(([uid, group]) => (
                              <div
                                key={uid}
                                className='mt-4 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 flex items-center justify-between gap-3'
                              >
                                <div className='flex items-center gap-3'>
                                  {group.avatar ? (
                                    <img
                                      src={group.avatar}
                                      alt={group.name}
                                      className='w-10 h-10 rounded-full object-cover border border-blue-500/30'
                                    />
                                  ) : (
                                    <div className='w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center'>
                                      <platform.IconComponent
                                        size={18}
                                        color='currentColor'
                                        className='text-blue-300'
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <p className='text-sm font-medium text-white'>{group.name}</p>
                                    <p className='text-xs text-slate-400'>
                                      {group.accounts.length} page{group.accounts.length > 1 ? 's' : ''} linked
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    if (
                                      !window.confirm(
                                        `Disconnect ${group.name}'s Facebook account? This removes all ${group.accounts.length} linked page${group.accounts.length > 1 ? 's' : ''}.`
                                      )
                                    )
                                      return;
                                    for (const acc of group.accounts) {
                                      disconnectMutation.mutate(acc.id);
                                    }
                                  }}
                                  disabled={disconnectMutation.isPending}
                                  className='inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-60'
                                >
                                  <Unlink className='w-3.5 h-3.5' /> Unlink account
                                </button>
                              </div>
                            ));
                          })()}

                        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4'>
                          {platformAccounts.map((account) => {
                            // For Facebook, the user-level name/avatar is identical across every
                            // connected Page (they come from the linking user, not the page). Prefer
                            // page-specific fields so each row shows its own page identity.
                            const isFacebook = account.type?.toLowerCase() === 'facebook';
                            const displayName = isFacebook
                              ? account.profile?.pageName || account.profile?.displayName || 'Facebook Page'
                              : account.profile?.displayName;
                            const avatarUrl = isFacebook
                              ? account.profile?.pageProfilePictureUrl || account.profile?.profilePictureUrl
                              : account.profile?.profilePictureUrl;
                            const subLabel = isFacebook
                              ? account.profile?.username || 'Page'
                              : account.profile?.username;

                            return (
                              <div
                                key={account.id}
                                className='relative rounded-xl bg-neutral-800/60 border border-neutral-600/50 p-4 text-center group'
                              >
                                {account.profile ? (
                                  <>
                                    <img
                                      src={avatarUrl ?? undefined}
                                      alt={displayName ?? ''}
                                      className='w-12 h-12 rounded-full mx-auto mb-2 object-cover border-2 border-neutral-600'
                                    />
                                    <h4 className='text-sm font-medium text-white truncate'>{displayName}</h4>
                                    <p className='text-xs text-slate-500 truncate'>{subLabel}</p>
                                  </>
                                ) : (
                                  <>
                                    <div className='w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center mx-auto mb-2'>
                                      <platform.IconComponent
                                        size={24}
                                        color='currentColor'
                                        className={platform.color}
                                      />
                                    </div>
                                    <h4 className='text-sm font-medium text-white'>Connected</h4>
                                    <p className='text-xs text-slate-500'>Account</p>
                                  </>
                                )}
                                <button
                                  onClick={() => openDisconnectModal(platform, account)}
                                  className='absolute top-2 right-2 p-1.5 rounded-lg bg-neutral-700/80 hover:bg-red-600/20 text-slate-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100'
                                  title='Disconnect account'
                                >
                                  <Trash2 className='w-3.5 h-3.5' />
                                </button>
                              </div>
                            );
                          })}

                          <button
                            onClick={() => handleConnect(platform)}
                            disabled={isPending}
                            className='min-h-30 rounded-xl border-2 border-dashed border-neutral-600/50 bg-neutral-800/30 p-4 text-center transition-all duration-200 hover:border-purple-500/50 hover:bg-neutral-800/60 flex flex-col items-center justify-center'
                          >
                            {isPending ? (
                              <>
                                <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-2'></div>
                                <span className='text-xs text-yellow-400'>Connecting...</span>
                              </>
                            ) : (
                              <>
                                <div className='w-10 h-10 rounded-full bg-neutral-700/50 flex items-center justify-center mb-2'>
                                  <Plus className='w-5 h-5 text-purple-400' />
                                </div>
                                <span className='text-sm text-slate-400'>
                                  {hasAccounts ? 'Add Another' : 'Connect'}
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Disconnect Confirmation Modal */}
      <Dialog open={isDisconnectOpen} onOpenChange={setIsDisconnectOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Unlink className='w-5 h-5 text-red-400' />
              Disconnect Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect {selectedAccount?.profile?.displayName || 'this account'} from{' '}
              {selectedPlatform?.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='ghost'
              onClick={() => setIsDisconnectOpen(false)}
              className='text-slate-300 hover:text-white hover:bg-neutral-700'
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
              className='hover:bg-red-500'
            >
              {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
