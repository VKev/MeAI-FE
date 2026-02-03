import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSocialMedias,
  deleteSocialMedia
} from '@/services/client/social-media.client';
import { getThreadsAuthUrl } from '@/services/client/threads.client';
import type { SocialMedia } from '@/models/social-media.model';
import { useState } from 'react';
import { Link2, Unlink, Check, Plus } from 'lucide-react';
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
import { motion } from 'framer-motion';

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

export default function SocialLinks() {
  const queryClient = useQueryClient();

  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConfig | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<SocialMedia | null>(null);

  // State for connecting platforms (to show loading per platform)
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

  const getAccountForPlatform = (platformKey: string): SocialMedia | undefined => {
    return accounts.find((acc: SocialMedia) => acc.type === platformKey);
  };

  const handlePlatformClick = async (platform: PlatformConfig) => {
    const account = getAccountForPlatform(platform.key);

    if (account) {
      setSelectedPlatform(platform);
      setSelectedAccount(account);
      setIsDisconnectOpen(true);
    } else {
      // Handle OAuth redirect based on platform
      if (platform.key === 'threads') {
        setConnectingPlatform('threads');
        try {
          const response = await getThreadsAuthUrl();
          if (response.isSuccess && response.value?.authorizationUrl) {
            // Redirect to Threads OAuth
            window.location.href = response.value.authorizationUrl;
          } else {
            console.error('Failed to get Threads auth URL:', response.error);
            setConnectingPlatform(null);
          }
        } catch (err) {
          console.error('Error getting Threads auth URL:', err);
          setConnectingPlatform(null);
        }
      } else {
        // TODO: Implement OAuth for other platforms
        console.log(`OAuth for ${platform.key} not yet implemented`);
      }
    }
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
          Connect your social media accounts to auto-post content.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className='flex items-center justify-center text-white py-20'>
          <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mr-3'></div>
          Loading...
        </div>
      )}

      {/* Platform Grid */}
      {!isLoading && (
        <motion.div
          className='grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {PLATFORMS.map((platform) => {
            const account = getAccountForPlatform(platform.key);
            const isConnected = !!account;
            const isPending = connectingPlatform === platform.key;

            return (
              <motion.button
                key={platform.key}
                variants={cardVariants}
                onClick={() => handlePlatformClick(platform)}
                disabled={isPending}
                className={`relative rounded-xl p-5 transition-all duration-200 hover:scale-[1.03] border text-center ${isConnected
                  ? 'bg-neutral-800/80 border-green-500/40 hover:border-green-400/60'
                  : 'bg-neutral-900/50 border-neutral-700/50 hover:border-neutral-600 hover:bg-neutral-800/60'
                  }`}
              >
                {/* Connected indicator */}
                {isConnected && (
                  <div className='absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center'>
                    <Check className='w-3 h-3 text-white' />
                  </div>
                )}

                {/* Icon */}
                <div className='w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center mx-auto mb-3'>
                  <platform.IconComponent size={28} color='currentColor' className={platform.color} />
                </div>

                {/* Platform Name */}
                <h3 className='text-sm font-medium text-white mb-1'>{platform.name}</h3>

                {/* Status */}
                {isPending ? (
                  <span className='text-xs text-yellow-400'>Connecting...</span>
                ) : isConnected ? (
                  <span className='text-xs text-green-400'>Connected</span>
                ) : (
                  <span className='text-xs text-slate-500 flex items-center justify-center gap-1'>
                    <Plus className='w-3 h-3' /> Connect
                  </span>
                )}
              </motion.button>
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
              Disconnect {selectedPlatform?.name}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect your {selectedPlatform?.name} account?
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
