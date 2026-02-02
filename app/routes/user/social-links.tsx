import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSocialMedias,
  createSocialMedia,
  deleteSocialMedia
} from '@/services/client/social-media.client';
import type { SocialMedia } from '@/models/social-media.model';
import { useState } from 'react';
import { Link2, Unlink } from 'lucide-react';
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

interface PlatformConfig {
  key: string;
  name: string;
  color: string;
  bgGradient: string;
  IconComponent: React.FC<{ size?: number; color?: string; className?: string }>;
}

const PLATFORMS: PlatformConfig[] = [
  { key: 'facebook', name: 'Facebook', color: 'text-blue-500', bgGradient: 'from-blue-500/20 to-blue-600/10', IconComponent: FacebookIcon },
  { key: 'instagram', name: 'Instagram', color: 'text-pink-500', bgGradient: 'from-pink-500/20 to-purple-600/10', IconComponent: InstagramIcon },
  { key: 'tiktok', name: 'TikTok', color: 'text-white', bgGradient: 'from-neutral-800/50 to-neutral-900/50', IconComponent: TiktokIcon },
  { key: 'threads', name: 'Threads', color: 'text-white', bgGradient: 'from-neutral-700/30 to-neutral-800/30', IconComponent: ThreadsIcon }
];

export default function SocialLinks() {
  const queryClient = useQueryClient();

  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConfig | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<SocialMedia | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['social-medias'],
    queryFn: fetchSocialMedias
  });

  const connectMutation = useMutation({
    mutationFn: (type: string) => createSocialMedia({ type, metadata: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-medias'] });
    }
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

  const handlePlatformClick = (platform: PlatformConfig) => {
    const account = getAccountForPlatform(platform.key);

    if (account) {
      setSelectedPlatform(platform);
      setSelectedAccount(account);
      setIsDisconnectOpen(true);
    } else {
      // TODO: Later replace with OAuth redirect
      // window.location.href = `/api/auth/${platform.key}`;
      connectMutation.mutate(platform.key);
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
          Connect your social media accounts to auto-post AI-generated content from your workspaces.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className='flex items-center justify-center text-white py-20'>
          <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mr-3'></div>
          Loading accounts...
        </div>
      )}

      {/* Platform Grid - Always show all 4 platforms */}
      {!isLoading && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {PLATFORMS.map((platform) => {
            const account = getAccountForPlatform(platform.key);
            const isConnected = !!account;
            const isPending = connectMutation.isPending && connectMutation.variables === platform.key;

            return (
              <button
                key={platform.key}
                onClick={() => handlePlatformClick(platform)}
                disabled={isPending}
                className={`relative rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/10 bg-gradient-to-br ${platform.bgGradient} border ${isConnected ? 'border-green-500/50' : 'border-neutral-700/50'} hover:border-indigo-500/50 text-left`}
              >
                {/* Icon */}
                <div className='w-14 h-14 rounded-xl bg-neutral-800/50 flex items-center justify-center mb-4'>
                  <platform.IconComponent size={32} color='currentColor' className={platform.color} />
                </div>

                {/* Platform Name */}
                <h3 className={`text-lg font-semibold ${platform.color} mb-2`}>{platform.name}</h3>

                {/* Status Badge */}
                {isPending ? (
                  <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-yellow-400 bg-yellow-500/20'>
                    <div className='w-2 h-2 rounded-full bg-yellow-400 animate-pulse'></div>
                    Connecting...
                  </span>
                ) : isConnected ? (
                  <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-green-400 bg-green-500/20'>
                    <div className='w-2 h-2 rounded-full bg-green-400'></div>
                    Connected
                  </span>
                ) : (
                  <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-400 bg-neutral-700/50'>
                    <div className='w-2 h-2 rounded-full bg-slate-500'></div>
                    Unconnected
                  </span>
                )}

                {/* Connected Date */}
                {isConnected && account?.createdAt && (
                  <p className='text-slate-500 text-xs mt-3'>
                    Linked {new Date(account.createdAt).toLocaleDateString()}
                  </p>
                )}

                {/* Action Hint */}
                <p className='text-slate-600 text-xs mt-2'>
                  {isConnected ? 'Click to disconnect' : 'Click to connect'}
                </p>
              </button>
            );
          })}
        </div>
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
              Are you sure you want to disconnect your {selectedPlatform?.name} account? You will need to reconnect it to post content.
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
