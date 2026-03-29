import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { useState } from 'react';
import { Settings, Link2, Plus, Check, Minus, ChevronDown, ChevronUp } from 'lucide-react';
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

import { fetchSocialMedias } from '@/services/client/social-media.client';
import {
  fetchWorkspaceSocialMedias,
  assignSocialMediaToWorkspace,
  removeSocialMediaFromWorkspace
} from '@/services/client/workspace-social-media.client';
import type { SocialMedia } from '@/models/social-media.model';

interface PlatformConfig {
  key: string;
  name: string;
  color: string;
  IconComponent: React.FC<{ size?: number; color?: string; className?: string }>;
}

const PLATFORMS: PlatformConfig[] = [
  { key: 'facebook', name: 'Facebook', color: 'text-blue-400', IconComponent: FacebookIcon },
  { key: 'instagram', name: 'Instagram', color: 'text-pink-400', IconComponent: InstagramIcon },
  { key: 'tiktok', name: 'TikTok', color: 'text-white', IconComponent: TiktokIcon },
  { key: 'threads', name: 'Threads', color: 'text-white', IconComponent: ThreadsIcon }
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
  visible: { height: 'auto', opacity: 1, transition: { duration: 0.3, ease: 'easeOut' as const } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' as const } }
};

export default function WorkspaceSettings() {
  const { workspaceId } = useParams();
  const queryClient = useQueryClient();

  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'assign' | 'remove';
    account: SocialMedia;
    platform: PlatformConfig;
  } | null>(null);

  // Fetch all user's connected social accounts
  const { data: userSocialMedias, isLoading: isLoadingUser } = useQuery({
    queryKey: ['social-medias'],
    queryFn: fetchSocialMedias
  });

  // Fetch social accounts assigned to this workspace
  const { data: workspaceSocialMedias, isLoading: isLoadingWorkspace } = useQuery({
    queryKey: ['workspace-social-medias', workspaceId],
    queryFn: () => fetchWorkspaceSocialMedias(workspaceId!),
    enabled: !!workspaceId
  });

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: ({ socialMediaId }: { socialMediaId: string }) =>
      assignSocialMediaToWorkspace(workspaceId!, socialMediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-social-medias', workspaceId] });
      setConfirmDialog(null);
    }
  });

  // Remove mutation
  const removeMutation = useMutation({
    mutationFn: ({ socialMediaId }: { socialMediaId: string }) =>
      removeSocialMediaFromWorkspace(workspaceId!, socialMediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-social-medias', workspaceId] });
      setConfirmDialog(null);
    }
  });

  const userAccounts = userSocialMedias?.value || [];
  const workspaceAccounts = workspaceSocialMedias?.value || [];
  const workspaceAccountIds = new Set(workspaceAccounts.map((a) => a.id));

  const isLoading = isLoadingUser || isLoadingWorkspace;

  const getAccountsForPlatform = (platformKey: string): SocialMedia[] => {
    return userAccounts.filter((acc: SocialMedia) => acc.type === platformKey);
  };

  const isAssigned = (accountId: string): boolean => {
    return workspaceAccountIds.has(accountId);
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

  const handleAssign = () => {
    if (confirmDialog?.account) {
      assignMutation.mutate({ socialMediaId: confirmDialog.account.id });
    }
  };

  const handleRemove = () => {
    if (confirmDialog?.account) {
      removeMutation.mutate({ socialMediaId: confirmDialog.account.id });
    }
  };

  return (
    <div className='min-h-screen py-8 px-6'>
      {/* Header */}
      <div className='mb-10'>
        <div className='flex items-center gap-3 mb-2'>
          <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center'>
            <Settings className='w-5 h-5 text-white' />
          </div>
          <h1 className='text-2xl font-bold text-white'>Workspace Settings</h1>
        </div>
        <p className='text-slate-400 ml-13'>
          Manage which social media accounts can be used in this workspace.
        </p>
      </div>

      {/* Social Media Assignment Section */}
      <div className='mb-8'>
        <div className='flex items-center gap-2 mb-4'>
          <Link2 className='w-5 h-5 text-purple-400' />
          <h2 className='text-lg font-semibold text-white'>Social Media Accounts</h2>
        </div>
        <p className='text-sm text-slate-500 mb-6'>
          Select which connected accounts should be available in this workspace for content posting.
        </p>

        {/* Loading State */}
        {isLoading && (
          <div className='flex items-center justify-center text-white py-20'>
            <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mr-3'></div>
            Loading...
          </div>
        )}

        {/* No accounts connected */}
        {!isLoading && userAccounts.length === 0 && (
          <div className='text-center py-12 rounded-xl border border-neutral-700/50 bg-neutral-900/50'>
            <Link2 className='w-12 h-12 text-slate-600 mx-auto mb-4' />
            <h3 className='text-white font-medium mb-2'>No Social Accounts Connected</h3>
            <p className='text-slate-500 text-sm mb-4'>
              Connect your social media accounts first in Settings → Social Links
            </p>
            <Button
              variant='outline'
              onClick={() => window.location.href = '/user/social-links'}
              className='border-purple-500/50 text-purple-400 hover:bg-purple-500/10'
            >
              Go to Social Links
            </Button>
          </div>
        )}

        {/* Platforms List */}
        {!isLoading && userAccounts.length > 0 && (
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
              const assignedCount = platformAccounts.filter((a) => isAssigned(a.id)).length;

              if (!hasAccounts) return null;

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
                      <div className='w-10 h-10 rounded-lg flex items-center justify-center bg-neutral-700/80'>
                        <platform.IconComponent size={20} color='currentColor' className={platform.color} />
                      </div>
                      <div className='text-left'>
                        <h3 className='text-white font-semibold'>{platform.name}</h3>
                        <p className='text-xs text-slate-500'>
                          <span className='text-green-400'>{assignedCount}</span> / {platformAccounts.length} assigned to workspace
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      {assignedCount > 0 && (
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
                          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4'>
                            {platformAccounts.map((account) => {
                              const assigned = isAssigned(account.id);
                              return (
                                <div
                                  key={account.id}
                                  className={`relative rounded-xl border p-4 text-center transition-all ${assigned
                                      ? 'bg-green-500/10 border-green-500/30'
                                      : 'bg-neutral-800/60 border-neutral-600/50'
                                    }`}
                                >
                                  {account.profile ? (
                                    <>
                                      <img
                                        src={account.profile.profilePictureUrl}
                                        alt={account.profile.displayName}
                                        className='w-12 h-12 rounded-full mx-auto mb-2 object-cover border-2 border-neutral-600'
                                      />
                                      <h4 className='text-sm font-medium text-white truncate'>
                                        {account.profile.displayName}
                                      </h4>
                                      <p className='text-xs text-slate-500 truncate'>
                                        @{account.profile.username}
                                      </p>
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

                                  {/* Assign/Remove Button */}
                                  <div className='mt-3'>
                                    {assigned ? (
                                      <Button
                                        size='sm'
                                        variant='ghost'
                                        onClick={() => setConfirmDialog({ type: 'remove', account, platform })}
                                        className='w-full text-red-400 hover:text-red-300 hover:bg-red-500/10'
                                      >
                                        <Minus className='w-4 h-4 mr-1' />
                                        Remove
                                      </Button>
                                    ) : (
                                      <Button
                                        size='sm'
                                        variant='ghost'
                                        onClick={() => setConfirmDialog({ type: 'assign', account, platform })}
                                        className='w-full text-green-400 hover:text-green-300 hover:bg-green-500/10'
                                      >
                                        <Plus className='w-4 h-4 mr-1' />
                                        Add to Workspace
                                      </Button>
                                    )}
                                  </div>

                                  {/* Assigned Badge */}
                                  {assigned && (
                                    <div className='absolute top-2 right-2 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs'>
                                      Assigned
                                    </div>
                                  )}
                                </div>
                              );
                            })}
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

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              {confirmDialog?.type === 'assign' ? (
                <>
                  <Plus className='w-5 h-5 text-green-400' />
                  Add to Workspace
                </>
              ) : (
                <>
                  <Minus className='w-5 h-5 text-red-400' />
                  Remove from Workspace
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.type === 'assign'
                ? `Add ${confirmDialog?.account?.profile?.displayName || 'this account'} (${confirmDialog?.platform?.name}) to this workspace?`
                : `Remove ${confirmDialog?.account?.profile?.displayName || 'this account'} (${confirmDialog?.platform?.name}) from this workspace?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='ghost'
              onClick={() => setConfirmDialog(null)}
              className='text-slate-300 hover:text-white hover:bg-neutral-700'
            >
              Cancel
            </Button>
            {confirmDialog?.type === 'assign' ? (
              <Button
                onClick={handleAssign}
                disabled={assignMutation.isPending}
                className='bg-green-600 hover:bg-green-500 text-white'
              >
                {assignMutation.isPending ? 'Adding...' : 'Add'}
              </Button>
            ) : (
              <Button
                variant='destructive'
                onClick={handleRemove}
                disabled={removeMutation.isPending}
                className='hover:bg-red-500'
              >
                {removeMutation.isPending ? 'Removing...' : 'Remove'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
