import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSocialMedias, deleteSocialMedia } from '@/services/client/social-media.client';
import { getThreadsAuthUrl } from '@/services/client/threads.client';
import { getTikTokAuthUrl } from '@/services/client/tiktok.client';
import { getFacebookAuthUrl } from '@/services/client/facebook.client';
import { getInstagramAuthUrl } from '@/services/client/instagram.client';
import type { SocialMedia } from '@/models/social-media.model';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link2, Unlink, Check, Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
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

interface AccountGroup {
  accountId: string;
  accountName: string;
  accountAvatarUrl: string | null;
  pages: SocialMedia[];
}

function groupFacebookByAccount(accounts: SocialMedia[]): AccountGroup[] {
  const groupMap = new Map<string, AccountGroup>();

  for (const account of accounts) {
    const userId = account.profile?.userId || account.id;
    const existing = groupMap.get(userId);

    if (existing) {
      existing.pages.push(account);
    } else {
      groupMap.set(userId, {
        accountId: userId,
        accountName: account.profile?.displayName || 'Facebook Account',
        accountAvatarUrl: account.profile?.profilePictureUrl || null,
        pages: [account]
      });
    }
  }

  return Array.from(groupMap.values());
}

export default function SocialLinks() {
  const queryClient = useQueryClient();

  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConfig | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<SocialMedia | null>(null);

  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());

  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['social-medias'],
    queryFn: fetchSocialMedias,
    retry: 2
  });

  const disconnectMutation = useMutation({
    mutationFn: deleteSocialMedia,
    onSuccess: () => {
      toast.success('Account disconnected successfully.');
      queryClient.invalidateQueries({ queryKey: ['social-medias'] });
      setIsDisconnectOpen(false);
      setSelectedPlatform(null);
      setSelectedAccount(null);
      setActionError(null);
    },
    onError: (error: any) => {
      const errData = error.response?.data;
      let message: string;
      if (errData?.type === 'Subscription.Required') {
        message = errData.detail || 'An active subscription is required.';
      } else {
        message = errData?.detail || error.message || 'Failed to disconnect account.';
      }
      setActionError(message);
      toast.error(message);
    }
  });

  const accounts = data?.value || [];

  const getAccountsForPlatform = (platformKey: string): SocialMedia[] => {
    return accounts.filter((acc: SocialMedia) => acc.type === platformKey);
  };

  const getDisplayName = (account: SocialMedia): string => {
    return account.profile?.displayName || account.profile?.username || 'Connected';
  };

  const getAvatarUrl = (account: SocialMedia): string | null => {
    return account.profile?.profilePictureUrl || null;
  };

  const getPageName = (account: SocialMedia): string => {
    return account.profile?.pageName || account.profile?.displayName || 'Page';
  };

  const getPageAvatarUrl = (account: SocialMedia): string | null => {
    return account.profile?.pageProfilePictureUrl || account.profile?.profilePictureUrl || null;
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
    setActionError(null);
    const authFnMap: Record<string, () => Promise<any>> = {
      threads: () => getThreadsAuthUrl(),
      tiktok: () => getTikTokAuthUrl(),
      facebook: () => getFacebookAuthUrl(),
      instagram: () => getInstagramAuthUrl()
    };

    const authFn = authFnMap[platform.key];
    if (!authFn) {
      setActionError(`OAuth for ${platform.name} is not available yet.`);
      return;
    }

    setConnectingPlatform(platform.key);
    try {
      const response = await authFn();
      if (response.isSuccess && response.value?.authorizationUrl) {
        window.location.href = response.value.authorizationUrl;
      } else {
        const message = response.error?.description || `Failed to connect ${platform.name}. Please try again.`;
        setActionError(message);
        toast.error(message);
        setConnectingPlatform(null);
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message.trim()
          ? err.message
          : `Unable to connect ${platform.name}. Please check your connection and try again.`;
      setActionError(message);
      toast.error(message);
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

  const hasPages = (platformKey: string) => platformKey === 'facebook';

  const renderAccountCard = (platform: PlatformConfig, account: SocialMedia) => {
    const avatarUrl = getAvatarUrl(account);
    const displayName = getDisplayName(account);
    const username = account.profile?.username;

    return (
      <div
        key={account.id}
        className='relative rounded-xl bg-neutral-800/50 border border-neutral-700/40 p-4 text-center group hover:bg-neutral-800/70 hover:border-neutral-600/50 transition-all duration-150'
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className='w-13 h-13 rounded-full mx-auto mb-2.5 object-cover ring-2 ring-neutral-700 ring-offset-2 ring-offset-neutral-900'
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className='w-13 h-13 rounded-full bg-neutral-700/60 flex items-center justify-center mx-auto mb-2.5 ring-2 ring-neutral-700 ring-offset-2 ring-offset-neutral-900'>
            <platform.IconComponent size={24} color='currentColor' className={platform.color} />
          </div>
        )}
        <h4 className='text-sm font-medium text-white truncate'>{displayName}</h4>
        {username && <p className='text-xs text-slate-500 truncate mt-0.5'>@{username}</p>}
        <button
          onClick={() => openDisconnectModal(platform, account)}
          className='absolute top-2 right-2 p-1.5 rounded-lg bg-neutral-700/80 hover:bg-red-600/20 text-slate-400 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100'
          title='Disconnect account'
        >
          <Trash2 className='w-3.5 h-3.5' />
        </button>
      </div>
    );
  };

  const renderFacebookAccountGroup = (platform: PlatformConfig, group: AccountGroup) => (
    <div key={group.accountId} className='rounded-xl bg-neutral-800/40 border border-neutral-700/40 overflow-hidden'>
      {/* Account header */}
      <div className='flex items-center gap-3 p-4'>
        {group.accountAvatarUrl ? (
          <img
            src={group.accountAvatarUrl}
            alt={group.accountName}
            className='w-11 h-11 rounded-full object-cover ring-2 ring-neutral-700 ring-offset-2 ring-offset-neutral-800 shrink-0'
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className='w-11 h-11 rounded-full bg-neutral-700/60 flex items-center justify-center shrink-0 ring-2 ring-neutral-700 ring-offset-2 ring-offset-neutral-800'>
            <platform.IconComponent size={20} color='currentColor' className={platform.color} />
          </div>
        )}
        <div className='min-w-0'>
          <h4 className='text-sm font-medium text-white truncate'>{group.accountName}</h4>
          <p className='text-xs text-slate-500 mt-0.5'>
            {group.pages.length} page{group.pages.length > 1 ? 's' : ''} connected
          </p>
        </div>
      </div>
      {/* Pages grid */}
      <div className='border-t border-neutral-700/30 px-4 pb-4 pt-3 bg-neutral-900/20'>
        <p className='text-[11px] uppercase tracking-wider text-slate-600 font-medium mb-2.5'>Pages</p>
        <div className='grid grid-cols-2 sm:grid-cols-3 gap-2.5'>
          {group.pages.map((page) => {
            const pageAvatar = getPageAvatarUrl(page);
            const pageName = getPageName(page);

            return (
              <div
                key={page.id}
                className='relative rounded-lg bg-neutral-800/60 border border-neutral-700/30 p-3 text-center group/page hover:bg-neutral-800/80 hover:border-neutral-600/40 transition-all duration-150'
              >
                {pageAvatar ? (
                  <img
                    src={pageAvatar}
                    alt={pageName}
                    className='w-10 h-10 rounded-full mx-auto mb-2 object-cover ring-1 ring-neutral-700'
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className='w-10 h-10 rounded-full bg-neutral-700/50 flex items-center justify-center mx-auto mb-2'>
                    <platform.IconComponent size={18} color='currentColor' className={platform.color} />
                  </div>
                )}
                <p className='text-xs font-medium text-slate-300 truncate'>{pageName}</p>
                <button
                  onClick={() => openDisconnectModal(platform, page)}
                  className='absolute top-1.5 right-1.5 p-1 rounded-md bg-neutral-700/80 hover:bg-red-600/20 text-slate-400 hover:text-red-400 transition-all opacity-0 group-hover/page:opacity-100'
                  title='Disconnect page'
                >
                  <Trash2 className='w-3 h-3' />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen py-10 px-6 flex flex-col items-center'>
      <div className='w-full max-w-2xl'>
        {/* Header */}
        <div className='mb-10 text-center'>
          <div className='flex items-center justify-center gap-3 mb-3'>
            <div className='w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20'>
              <Link2 className='w-5 h-5 text-white' />
            </div>
            <h1 className='text-2xl font-bold text-white'>Social Links</h1>
          </div>
          <p className='text-slate-400 text-sm max-w-md mx-auto'>
            Connect your social media accounts to auto-post content. You can connect multiple accounts per platform.
          </p>
        </div>

        {actionError && (
          <div className='mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300'>
            {actionError}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className='flex flex-col items-center justify-center text-white py-20'>
            <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-3'></div>
            <span className='text-sm text-slate-400'>Loading accounts...</span>
          </div>
        )}

        {/* Error State */}
        {!isLoading && isError && (
          <div className='flex flex-col items-center justify-center text-center py-20'>
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
            className='flex flex-col gap-4'
            variants={containerVariants}
            initial='hidden'
            animate='visible'
          >
          {PLATFORMS.map((platform) => {
            const platformAccounts = getAccountsForPlatform(platform.key);
            const isExpanded = expandedPlatforms.has(platform.key);
            const hasAccounts = platformAccounts.length > 0;
            const isPending = connectingPlatform === platform.key;
            const accountGroups = hasPages(platform.key) ? groupFacebookByAccount(platformAccounts) : null;
            const accountCount = accountGroups ? accountGroups.length : platformAccounts.length;

            return (
              <motion.div
                key={platform.key}
                variants={cardVariants}
                className='rounded-2xl border border-neutral-700/40 bg-neutral-900/60 backdrop-blur-sm overflow-hidden shadow-sm hover:shadow-md hover:shadow-black/20 transition-shadow duration-200'
              >
                <button
                  onClick={() => togglePlatform(platform.key)}
                  className='w-full flex items-center justify-between p-5 hover:bg-neutral-800/40 transition-colors'
                >
                  <div className='flex items-center gap-4'>
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${hasAccounts ? 'bg-neutral-700/60' : 'bg-neutral-800/80'}`}
                    >
                      <platform.IconComponent size={22} color='currentColor' className={platform.color} />
                    </div>
                    <div className='text-left'>
                      <h3 className='text-white font-semibold text-[15px]'>{platform.name}</h3>
                      <p className='text-xs text-slate-500 mt-0.5'>
                        {hasAccounts ? (
                          <span className='text-emerald-400'>
                            {accountCount} account{accountCount > 1 ? 's' : ''} connected
                            {accountGroups && platformAccounts.length > accountCount && (
                              <span className='text-slate-500'>
                                {' '}&middot; {platformAccounts.length} page{platformAccounts.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </span>
                        ) : (
                          'Not connected'
                        )}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    {hasAccounts && (
                      <div className='w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center'>
                        <Check className='w-3 h-3 text-white' />
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronUp className='w-5 h-5 text-slate-500' />
                    ) : (
                      <ChevronDown className='w-5 h-5 text-slate-500' />
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
                      <div className='px-5 pb-5 pt-0 border-t border-neutral-700/30'>
                        <div className='flex flex-col gap-3 mt-4'>
                          {/* Facebook: grouped by account with pages inside */}
                          {accountGroups &&
                            accountGroups.map((group) => renderFacebookAccountGroup(platform, group))}

                          {/* Other platforms: flat cards */}
                          {!accountGroups && (
                            <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                              {platformAccounts.map((account) => renderAccountCard(platform, account))}
                            </div>
                          )}

                          {/* Add Another button */}
                          <button
                            onClick={() => handleConnect(platform)}
                            disabled={isPending}
                            className='rounded-xl border-2 border-dashed border-neutral-600/40 hover:border-purple-500/50 bg-neutral-800/20 hover:bg-neutral-800/50 py-4 text-center transition-all duration-200 flex items-center justify-center gap-2.5'
                          >
                            {isPending ? (
                              <>
                                <div className='animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500'></div>
                                <span className='text-sm text-yellow-400 font-medium'>Connecting...</span>
                              </>
                            ) : (
                              <>
                                <div className='w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center'>
                                  <Plus className='w-4 h-4 text-purple-400' />
                                </div>
                                <span className='text-sm text-slate-400 font-medium'>
                                  {hasAccounts ? 'Add Another Account' : 'Connect Account'}
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
      </div>

      {/* Disconnect Confirmation Modal */}
      <Dialog open={isDisconnectOpen} onOpenChange={setIsDisconnectOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Unlink className='w-5 h-5 text-red-400' />
              Disconnect Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect {selectedAccount?.profile?.pageName || selectedAccount?.profile?.displayName || 'this account'} from{' '}
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
