import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSocialMedias,
  deleteSocialMedia
} from '@/services/client/social-media.client';
import { getThreadsAuthUrl } from '@/services/client/threads.client';
import { getTikTokAuthUrl } from '@/services/client/tiktok.client';
import { getFacebookAuthUrl } from '@/services/client/facebook.client';
import type { SocialMedia } from '@/models/social-media.model';
import { useState } from 'react';
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
import {
  TiktokIcon,
  FacebookIcon,
  InstagramIcon,
  ThreadsIcon
} from '@/components/ui/icons/social-icons';
import { motion, AnimatePresence } from 'framer-motion';

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const expandVariants = {
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

  const { data, isLoading } = useQuery({
    queryKey: ['social-medias'],
    queryFn: fetchSocialMedias
  });

  const disconnectMutation = useMutation({
    mutationFn: deleteSocialMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-medias'] });
      setIsDisconnectOpen(false);
      setSelectedPlatform(null);
      setSelectedAccount(null);
    }
  });

  const accounts = data?.value || [];

  const getAccountsForPlatform = (platformKey: string): SocialMedia[] => {
    return accounts.filter((acc: SocialMedia) => acc.type === platformKey);
  };
  const togglePlatform = (platformKey: string) => {
    setExpandedPlatforms(prev => {
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
    if (platform.key === 'threads') {
      setConnectingPlatform('threads');
      try {
        const response = await getThreadsAuthUrl();
        if (response.isSuccess && response.value?.authorizationUrl) {
          window.location.href = response.value.authorizationUrl;
        } else {
          console.error('Failed to get Threads auth URL:', response.error);
          setConnectingPlatform(null);
        }
      } catch (err) {
        console.error('Error getting Threads auth URL:', err);
        setConnectingPlatform(null);
      }
    } else if (platform.key === 'tiktok') {
      setConnectingPlatform('tiktok');
      try {
        const response = await getTikTokAuthUrl();
        if (response.isSuccess && response.value?.authorizationUrl) {
          window.location.href = response.value.authorizationUrl;
        } else {
          console.error('Failed to get TikTok auth URL:', response.error);
          setConnectingPlatform(null);
        }
      } catch (err) {
        console.error('Error getting TikTok auth URL:', err);
        setConnectingPlatform(null);
      }
    } else if (platform.key === 'facebook') {
      setConnectingPlatform('facebook');
      try {
        const response = await getFacebookAuthUrl();
        if (response.isSuccess && response.value?.authorizationUrl) {
          window.location.href = response.value.authorizationUrl;
        } else {
          console.error('Failed to get Facebook auth URL:', response.error);
          setConnectingPlatform(null);
        }
      } catch (err) {
        console.error('Error getting Facebook auth URL:', err);
        setConnectingPlatform(null);
      }
    } else {
      console.log(`OAuth for ${platform.key} not yet implemented`);
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
      <div className='mb-10'>
        <div className='flex items-center gap-3 mb-2'>
          <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center'>
            <Link2 className='w-5 h-5 text-white' />
          </div>
          <h1 className='text-2xl font-bold text-white'>Social Links</h1>
        </div>
        <p className='text-slate-400 ml-13'>
          Connect your social media accounts to auto-post content. You can connect multiple accounts per platform.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className='flex items-center justify-center text-white py-20'>
          <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mr-3'></div>
          Loading...
        </div>
      )}

      {!isLoading && (
        <motion.div
          className='flex flex-col gap-4 max-w-3xl'
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
                className='rounded-xl border border-neutral-700/50 bg-neutral-900/50 overflow-hidden'
              >
                <button
                  onClick={() => togglePlatform(platform.key)}
                  className='w-full flex items-center justify-between p-4 hover:bg-neutral-800/50 transition-colors'
                >
                  <div className='flex items-center gap-3'>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hasAccounts ? 'bg-neutral-700/80' : 'bg-neutral-800'}`}>
                      <platform.IconComponent size={20} color='currentColor' className={platform.color} />
                    </div>
                    <div className='text-left'>
                      <h3 className='text-white font-semibold'>{platform.name}</h3>
                      <p className='text-xs text-slate-500'>
                        {hasAccounts ? (
                          <span className='text-green-400'>{platformAccounts.length} account{platformAccounts.length > 1 ? 's' : ''} connected</span>
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
                        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4'>
                          {platformAccounts.map((account) => (
                            <div
                              key={account.id}
                              className='relative rounded-xl bg-neutral-800/60 border border-neutral-600/50 p-4 text-center group'
                            >
                              {account.profile ? (
                                <>
                                  <img
                                    src={account.profile.profilePictureUrl}
                                    alt={account.profile.displayName}
                                    className='w-12 h-12 rounded-full mx-auto mb-2 object-cover border-2 border-neutral-600'
                                  />
                                  <h4 className='text-sm font-medium text-white truncate'>{account.profile.displayName}</h4>
                                </>
                              ) : (
                                <>
                                  <div className='w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center mx-auto mb-2'>
                                    <platform.IconComponent size={24} color='currentColor' className={platform.color} />
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
                          ))}

                          <button
                            onClick={() => handleConnect(platform)}
                            disabled={isPending}
                            className='rounded-xl border-2 border-dashed border-neutral-600/50 hover:border-purple-500/50 bg-neutral-800/30 hover:bg-neutral-800/60 p-4 text-center transition-all duration-200 min-h-[120px] flex flex-col items-center justify-center'
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
              Are you sure you want to disconnect {selectedAccount?.profile?.displayName || 'this account'} from {selectedPlatform?.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='ghost' onClick={() => setIsDisconnectOpen(false)} className='text-slate-300 hover:text-white hover:bg-neutral-700'>
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
