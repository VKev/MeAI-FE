import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { Settings, Link2, Plus, Check, Minus, ChevronDown, ChevronUp, AlertTriangle, RefreshCw } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';

import { fetchSocialMedias } from '@/services/client/social-media.client';
import {
  fetchWorkspaceSocialMedias,
  assignSocialMediaToWorkspace,
  removeSocialMediaFromWorkspace
} from '@/services/client/workspace-social-media.client';
import { getThreadsAuthUrl } from '@/services/client/threads.client';
import { getTikTokAuthUrl } from '@/services/client/tiktok.client';
import { getFacebookAuthUrl } from '@/services/client/facebook.client';
import { getInstagramAuthUrl } from '@/services/client/instagram.client';
import type { SocialMedia } from '@/models/social-media.model';
import { getSocialMediaDisplayName, getSocialMediaAvatar } from '@/utils/social-media-display';
import { stashOAuthAutoLinkIntent } from '@/utils/social-workspace-autolink';

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
  const location = useLocation();
  const queryClient = useQueryClient();

  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'assign' | 'remove';
    account: SocialMedia;
    platform: PlatformConfig;
  } | null>(null);

  // Fetch all user's connected social accounts
  const {
    data: userSocialMedias,
    isLoading: isLoadingUser,
    isFetching: isFetchingUser,
    isError: isErrorUser,
    refetch: refetchUser
  } = useQuery({
    queryKey: ['social-medias'],
    queryFn: fetchSocialMedias,
    retry: 2
  });

  // Fetch social accounts assigned to this workspace
  const {
    data: workspaceSocialMedias,
    isLoading: isLoadingWorkspace,
    isFetching: isFetchingWorkspace,
    isError: isErrorWorkspace,
    refetch: refetchWorkspace
  } = useQuery({
    queryKey: ['workspace-social-medias', workspaceId],
    queryFn: () => fetchWorkspaceSocialMedias(workspaceId!),
    enabled: !!workspaceId,
    retry: 2
  });

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: ({ socialMediaId }: { socialMediaId: string }) =>
      assignSocialMediaToWorkspace(workspaceId!, socialMediaId),
    onSuccess: () => {
      toast.success('Account assigned to workspace.');
      queryClient.invalidateQueries({ queryKey: ['workspace-social-medias', workspaceId] });
      setConfirmDialog(null);
    },
    onError: (error: any) => {
      const errData = error.response?.data;
      if (errData?.type === 'Subscription.Required') {
        toast.error(errData.detail || 'An active subscription is required.');
      } else {
        toast.error(errData?.detail || error.message || 'Failed to assign account.');
      }
    }
  });

  // Remove mutation
  const removeMutation = useMutation({
    mutationFn: ({ socialMediaId }: { socialMediaId: string }) =>
      removeSocialMediaFromWorkspace(workspaceId!, socialMediaId),
    onSuccess: () => {
      toast.success('Account removed from workspace.');
      queryClient.invalidateQueries({ queryKey: ['workspace-social-medias', workspaceId] });
      setConfirmDialog(null);
    },
    onError: (error: any) => {
      const errData = error.response?.data;
      if (errData?.type === 'Subscription.Required') {
        toast.error(errData.detail || 'An active subscription is required.');
      } else {
        toast.error(errData?.detail || error.message || 'Failed to remove account.');
      }
    }
  });

  const userAccounts = userSocialMedias?.value || [];
  const workspaceAccounts = workspaceSocialMedias?.value || [];
  const workspaceAccountIds = new Set(workspaceAccounts.map((a) => a.id));

  const isLoading = isLoadingUser || isLoadingWorkspace;
  const isError = isErrorUser || isErrorWorkspace;

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

  const handleConnect = async (platform: PlatformConfig) => {
    const redirectUrl = window.location.origin + location.pathname;

    // Stash the OAuth auto-link intent to enable automatic page assignment upon return
    stashOAuthAutoLinkIntent({
      workspaceId: workspaceId!,
      platform: platform.key as any,
      returnTo: redirectUrl
    });

    const authFnMap: Record<string, () => Promise<any>> = {
      threads: () => getThreadsAuthUrl(undefined, redirectUrl),
      tiktok: () => getTikTokAuthUrl(undefined, redirectUrl),
      facebook: () => getFacebookAuthUrl(undefined, redirectUrl),
      instagram: () => getInstagramAuthUrl(undefined, redirectUrl)
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
    } catch (err: any) {
      toast.error(err.message || `Failed to connect ${platform.name}. Please try again.`);
      setConnectingPlatform(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <section className='mb-8 flex items-center justify-between overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8'>
        <div className='flex items-center gap-4'>
          <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'>
            <Settings className='h-7 w-7' />
          </div>

          <div className='space-y-1'>
            <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Workspace Settings</h1>
            <p className='text-sm leading-relaxed text-slate-400'>Manage your workspace integrations and preferences</p>
          </div>
        </div>

        <Button
          type='button'
          variant='outline'
          onClick={() => {
            void refetchUser();
            void refetchWorkspace();
          }}
          className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white'
        >
          <RefreshCw className={`h-4 w-4 ${isFetchingUser || isFetchingWorkspace ? 'animate-spin' : ''}`} />
          Sync Now
        </Button>
      </section>

      <div className='w-full'>
        {/* Main Content */}
        <div className='w-full'>
          <div className='rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] overflow-hidden'>
            <div className='p-6 border-b border-neutral-800/50'>
              <div className='flex items-center gap-2 mb-2'>
                <Link2 className='w-5 h-5 text-purple-400' />
                <h2 className='text-xl font-semibold text-white'>Social Media Accounts</h2>
              </div>
              <p className='text-sm text-slate-400'>
                Connect new accounts or select from existing connected accounts to assign them to this workspace.
              </p>
            </div>

            <div className='p-6'>
              {/* Loading State */}
              {isLoading && (
                <div className='flex items-center justify-center text-white py-20'>
                  <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mr-3'></div>
                  Loading...
                </div>
              )}

              {/* Error State */}
              {!isLoading && isError && (
                <div className='flex flex-col items-center justify-center text-center py-20'>
                  <div className='w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4'>
                    <AlertTriangle className='w-6 h-6 text-red-400' />
                  </div>
                  <h3 className='text-lg font-semibold text-white mb-2'>Failed to load accounts</h3>
                  <p className='text-sm text-slate-400 mb-6'>
                    We couldn't load your social media accounts. Please try again.
                  </p>
                  <Button
                    onClick={() => {
                      void refetchUser();
                      void refetchWorkspace();
                    }}
                    className='bg-purple-600 text-white hover:bg-purple-700'
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Platforms List */}
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
                    const assignedCount = platformAccounts.filter((a) => isAssigned(a.id)).length;
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
                            <div className='w-10 h-10 rounded-lg flex items-center justify-center bg-neutral-800'>
                              <platform.IconComponent size={20} color='currentColor' className={platform.color} />
                            </div>
                            <div className='text-left'>
                              <h3 className='text-white font-medium'>{platform.name}</h3>
                              <p className='text-xs text-slate-500'>
                                {platformAccounts.length > 0 ? (
                                  <>
                                    <span className='text-green-400'>{assignedCount}</span> / {platformAccounts.length}{' '}
                                    assigned to workspace
                                  </>
                                ) : (
                                  'No accounts connected'
                                )}
                              </p>
                            </div>
                          </div>
                          <div className='flex items-center gap-2'>
                            {assignedCount > 0 && (
                              <div className='w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20'>
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
                              className='overflow-hidden bg-neutral-900/30'
                            >
                              <div className='p-4 border-t border-neutral-800/80'>
                                {platform.key === 'facebook' &&
                                  platformAccounts.length > 0 &&
                                  (() => {
                                    // Group FB accounts by the owning user
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
                                        className='mt-2 mb-4 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 flex items-center justify-between gap-3'
                                      >
                                        <div className='flex items-center gap-3'>
                                          {group.avatar ? (
                                            <img
                                              src={group.avatar}
                                              alt={group.name}
                                              className='w-9 h-9 rounded-full object-cover border border-blue-500/30'
                                            />
                                          ) : (
                                            <div className='w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center'>
                                              <platform.IconComponent
                                                size={16}
                                                color='currentColor'
                                                className='text-blue-300'
                                              />
                                            </div>
                                          )}
                                          <div>
                                            <p className='text-sm font-medium text-white'>{group.name}</p>
                                            <p className='text-xs text-slate-400'>
                                              {group.accounts.length} page{group.accounts.length > 1 ? 's' : ''}{' '}
                                              connected
                                            </p>
                                          </div>
                                        </div>
                                        <div className='text-[11px] font-medium text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-md'>
                                          Linked Account
                                        </div>
                                      </div>
                                    ));
                                  })()}
                                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2'>
                                  {/* Render existing connected accounts for this platform */}
                                  {platformAccounts.map((account) => {
                                    const assigned = isAssigned(account.id);
                                    const displayName = getSocialMediaDisplayName(account);
                                    const avatarUrl = getSocialMediaAvatar(account);
                                    const isFacebook = account.type?.toLowerCase() === 'facebook';
                                    const subLabel = account.profile?.username || (isFacebook ? 'Page' : '');

                                    return (
                                      <div
                                        key={account.id}
                                        className={`relative flex flex-col rounded-xl border p-4 text-center transition-all ${
                                          assigned
                                            ? 'bg-green-500/5 border-green-500/30'
                                            : 'bg-neutral-900 border-neutral-800'
                                        }`}
                                      >
                                        <div className='flex-1'>
                                          {account.profile ? (
                                            <>
                                              {avatarUrl ? (
                                                <img
                                                  src={avatarUrl}
                                                  alt={displayName}
                                                  className='w-12 h-12 rounded-full mx-auto mb-2 object-cover border-2 border-neutral-700'
                                                />
                                              ) : (
                                                <div className='w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-2'>
                                                  <platform.IconComponent
                                                    size={24}
                                                    color='currentColor'
                                                    className={platform.color}
                                                  />
                                                </div>
                                              )}
                                              <h4 className='text-sm font-medium text-white truncate'>{displayName}</h4>
                                              <p className='text-xs text-slate-500 truncate'>
                                                {subLabel ? `@${subLabel}` : ''}
                                              </p>
                                            </>
                                          ) : (
                                            <>
                                              <div className='w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-2'>
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
                                        </div>

                                        {/* Assign/Remove Button */}
                                        <div className='mt-4'>
                                          {assigned ? (
                                            <Button
                                              size='sm'
                                              variant='ghost'
                                              onClick={() => setConfirmDialog({ type: 'remove', account, platform })}
                                              className='w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/10'
                                            >
                                              <Minus className='w-4 h-4 mr-1' />
                                              Remove
                                            </Button>
                                          ) : (
                                            <Button
                                              size='sm'
                                              variant='ghost'
                                              onClick={() => setConfirmDialog({ type: 'assign', account, platform })}
                                              className='w-full text-green-400 hover:text-green-300 hover:bg-green-500/10 border border-green-500/10'
                                            >
                                              <Plus className='w-4 h-4 mr-1' />
                                              Assign
                                            </Button>
                                          )}
                                        </div>

                                        {/* Assigned Badge */}
                                        {assigned && (
                                          <div className='absolute top-2 right-2 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-medium uppercase tracking-wider'>
                                            Active
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}

                                  {/* Connect New Button */}
                                  <button
                                    onClick={() => handleConnect(platform)}
                                    disabled={isPending}
                                    className='min-h-40 rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-900/50 p-4 text-center transition-all duration-200 hover:border-purple-500/50 hover:bg-neutral-800 flex flex-col items-center justify-center group'
                                  >
                                    {isPending ? (
                                      <>
                                        <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-2'></div>
                                        <span className='text-xs text-purple-400 font-medium'>Connecting...</span>
                                      </>
                                    ) : (
                                      <>
                                        <div className='w-12 h-12 rounded-full bg-neutral-800 group-hover:bg-purple-500/10 flex items-center justify-center mb-3 transition-colors'>
                                          <Plus className='w-6 h-6 text-slate-400 group-hover:text-purple-400 transition-colors' />
                                        </div>
                                        <h4 className='text-sm font-medium text-slate-300 group-hover:text-purple-300 transition-colors'>
                                          {platformAccounts.length > 0 ? 'Connect Another' : 'Connect Account'}
                                        </h4>
                                        <p className='text-xs text-slate-500 mt-1 px-4'>
                                          Link a new {platform.name} account to this workspace
                                        </p>
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
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent className='sm:max-w-md bg-neutral-900 border-neutral-800 text-white'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              {confirmDialog?.type === 'assign' ? (
                <>
                  <Plus className='w-5 h-5 text-green-400' />
                  Assign to Workspace
                </>
              ) : (
                <>
                  <Minus className='w-5 h-5 text-red-400' />
                  Remove from Workspace
                </>
              )}
            </DialogTitle>
            <DialogDescription className='text-slate-400'>
              {confirmDialog?.type === 'assign'
                ? `Are you sure you want to assign ${getSocialMediaDisplayName(confirmDialog?.account)} (${confirmDialog?.platform?.name}) to this workspace?`
                : `Are you sure you want to remove ${getSocialMediaDisplayName(confirmDialog?.account)} (${confirmDialog?.platform?.name}) from this workspace?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button
              variant='ghost'
              onClick={() => setConfirmDialog(null)}
              className='text-slate-300 hover:text-white hover:bg-neutral-800'
            >
              Cancel
            </Button>
            {confirmDialog?.type === 'assign' ? (
              <Button
                onClick={handleAssign}
                disabled={assignMutation.isPending}
                className='bg-green-600 hover:bg-green-500 text-white'
              >
                {assignMutation.isPending ? 'Assigning...' : 'Assign Account'}
              </Button>
            ) : (
              <Button
                variant='destructive'
                onClick={handleRemove}
                disabled={removeMutation.isPending}
                className='bg-red-600 hover:bg-red-500 text-white'
              >
                {removeMutation.isPending ? 'Removing...' : 'Remove Account'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
