import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { LoaderFunctionArgs } from 'react-router';
import { Navigate, redirect, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck, Building2, Check, Link2, Loader2, RefreshCw, SkipForward } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { TiktokIcon, FacebookIcon, InstagramIcon, ThreadsIcon } from '@/components/ui/icons/social-icons';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { AUTH_QUERY_KEYS } from '@/lib/query-keys';
import { hasRole, requireUser } from '@/services/server/session.server';
import { getFacebookAuthUrl } from '@/services/client/facebook.client';
import { getInstagramAuthUrl } from '@/services/client/instagram.client';
import { completeTutorialStep, fetchAuthMe } from '@/services/client/profile.client';
import { fetchSocialMedias } from '@/services/client/social-media.client';
import { getThreadsAuthUrl } from '@/services/client/threads.client';
import { getTikTokAuthUrl } from '@/services/client/tiktok.client';
import { createWorkspace, fetchWorkspaces } from '@/services/client/workspace.client';
import type { SocialMedia } from '@/models/social-media.model';
import type { Workspace } from '@/models/workspace.model';
import { useUserStore } from '@/store/user.store';
import {
  clearOAuthAutoLinkIntent,
  clearOAuthReturnTo,
  stashOAuthAutoLinkIntent,
  stashOAuthReturnTo
} from '@/utils/social-workspace-autolink';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PlatformKey = 'facebook' | 'instagram' | 'tiktok' | 'threads';

type PlatformConfig = {
  key: PlatformKey;
  name: string;
  description: string;
  color: string;
  brandColor: string;
  IconComponent: ComponentType<{ size?: number; color?: string; className?: string }>;
};

const PLATFORMS: PlatformConfig[] = [
  {
    key: 'facebook',
    name: 'Facebook',
    description: 'Pages and campaign publishing',
    color: 'text-blue-400',
    brandColor: '#1877F2',
    IconComponent: FacebookIcon
  },
  {
    key: 'instagram',
    name: 'Instagram',
    description: 'Visual posts and reels planning',
    color: 'text-pink-400',
    brandColor: '#E4405F',
    IconComponent: InstagramIcon
  },
  {
    key: 'tiktok',
    name: 'TikTok',
    description: 'Short-form content channels',
    color: 'text-white',
    brandColor: '#25F4EE',
    IconComponent: TiktokIcon
  },
  {
    key: 'threads',
    name: 'Threads',
    description: 'Conversation-first updates',
    color: 'text-white',
    brandColor: '#C7D2FE',
    IconComponent: ThreadsIcon
  }
];

const TYPE_ALIASES: Record<PlatformKey, string[]> = {
  facebook: ['facebook'],
  instagram: ['instagram', 'ig'],
  tiktok: ['tiktok'],
  threads: ['threads', 'thread']
};

const WORKSPACE_TYPES = [
  { value: 'business', label: 'Business' },
  { value: 'social', label: 'Social Media' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'photography', label: 'Photography' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'education', label: 'Education' },
  { value: 'tech', label: 'Technology' },
  { value: 'others', label: 'Others' }
];

const ONBOARDING_WORKSPACE_ID_KEY = 'meai:onboarding:workspaceId';

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);
  if (!hasRole(sessionUser, 'user')) {
    throw redirect('/forbidden');
  }

  return null;
}

function getAccountsForPlatform(accounts: SocialMedia[], platform: PlatformKey) {
  const aliases = TYPE_ALIASES[platform];
  return accounts.filter((account) => aliases.includes((account.type ?? '').toLowerCase()));
}

function getAccountLabel(account: SocialMedia) {
  if ((account.type ?? '').toLowerCase() === 'facebook') {
    return account.profile?.pageName || account.profile?.displayName || 'Facebook Page';
  }

  return account.profile?.displayName || account.profile?.username || 'Connected account';
}

function readStoredOnboardingWorkspaceId() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(ONBOARDING_WORKSPACE_ID_KEY);
}

function storeOnboardingWorkspaceId(workspaceId: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ONBOARDING_WORKSPACE_ID_KEY, workspaceId);
}

function clearStoredOnboardingWorkspaceId() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ONBOARDING_WORKSPACE_ID_KEY);
}

function resolveOnboardingWorkspace(workspaces: Workspace[], storedWorkspaceId: string | null) {
  if (storedWorkspaceId) {
    const storedWorkspace = workspaces.find((workspace) => workspace.id === storedWorkspaceId);
    if (storedWorkspace) return storedWorkspace;
  }

  return workspaces[0] ?? null;
}

export default function UserOnboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setUser = useUserStore((s) => s.setUser);
  const storedUser = useUserStore((s) => s.user);
  const [connectingPlatform, setConnectingPlatform] = useState<PlatformKey | null>(null);
  const [createdWorkspaceId, setCreatedWorkspaceId] = useState<string | null>(() => readStoredOnboardingWorkspaceId());
  const [createdWorkspace, setCreatedWorkspace] = useState<Workspace | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceType, setWorkspaceType] = useState(WORKSPACE_TYPES[0].value);
  const [workspaceDescription, setWorkspaceDescription] = useState('');

  const { data: authMeData } = useQuery({
    queryKey: AUTH_QUERY_KEYS.me(),
    queryFn: () => fetchAuthMe(),
    staleTime: 30_000,
    retry: false
  });

  useEffect(() => {
    if (authMeData?.value) {
      setUser(authMeData.value);
    }
  }, [authMeData, setUser]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const currentUser = authMeData?.value ?? storedUser;

  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => fetchWorkspaces()
  });

  const workspaces = workspacesData?.value ?? [];
  const onboardingWorkspace = useMemo(
    () => createdWorkspace ?? resolveOnboardingWorkspace(workspaces, createdWorkspaceId),
    [createdWorkspace, workspaces, createdWorkspaceId]
  );
  const isRestoringOnboardingWorkspace = Boolean(createdWorkspaceId && !onboardingWorkspace && isLoadingWorkspaces);

  useEffect(() => {
    if (onboardingWorkspace?.id) {
      storeOnboardingWorkspaceId(onboardingWorkspace.id);
    }
  }, [onboardingWorkspace?.id]);

  const {
    data: socialMediaData,
    isLoading: isLoadingSocials,
    isFetching: isFetchingSocials,
    refetch: refetchSocials
  } = useQuery({
    queryKey: ['social-medias'],
    queryFn: () => fetchSocialMedias()
  });

  const accounts = socialMediaData?.value ?? [];
  const canConnectMore = accounts.length < 2 || false;
  const hasConnectedAccounts = accounts.length > 0;

  const connectedSummary = useMemo(
    () =>
      PLATFORMS.map((platform) => ({
        platform,
        accounts: getAccountsForPlatform(accounts, platform.key)
      })),
    [accounts]
  );
  const connectedPlatformCount = connectedSummary.filter(({ accounts }) => accounts.length > 0).length;
  const canCreateWorkspace = workspaceName.trim().length > 0;

  const createWorkspaceMutation = useMutation({
    mutationFn: async () => {
      const workspaceResponse = await createWorkspace({
        name: workspaceName.trim(),
        type: workspaceType,
        description: workspaceDescription.trim() || null
      });

      if (!workspaceResponse.isSuccess || !workspaceResponse.value) {
        throw new Error(workspaceResponse.error?.description || 'Failed to create workspace.');
      }

      return workspaceResponse.value;
    },
    onSuccess: (workspace) => {
      setCreatedWorkspace(workspace);
      setCreatedWorkspaceId(workspace.id);
      storeOnboardingWorkspaceId(workspace.id);
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace created. Now connect social accounts.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create workspace.');
    }
  });

  const finishOnboardingMutation = useMutation({
    mutationFn: async () => {
      const profileResponse = await completeTutorialStep(1);
      if (!profileResponse.isSuccess || !profileResponse.value) {
        throw new Error(profileResponse.error?.description || 'Failed to update onboarding progress.');
      }

      return profileResponse;
    },
    onSuccess: (profileResponse) => {
      queryClient.setQueryData(AUTH_QUERY_KEYS.me(), profileResponse);
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['session-check'] });
      setUser(profileResponse.value);
      clearStoredOnboardingWorkspaceId();
      toast.success('Onboarding completed.');
      navigate(onboardingWorkspace ? `/workspace/${onboardingWorkspace.id}/product` : '/user/product', { replace: true });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to finish onboarding.');
    }
  });

  const handleConnect = async (platform: PlatformConfig) => {
    if (!onboardingWorkspace) {
      toast.error('Create a workspace before connecting social accounts.');
      return;
    }

    const authFnMap: Record<PlatformKey, () => Promise<any>> = {
      threads: () => getThreadsAuthUrl(undefined, '/user/onboarding'),
      tiktok: () => getTikTokAuthUrl(undefined, '/user/onboarding'),
      facebook: () => getFacebookAuthUrl(undefined, '/user/onboarding'),
      instagram: () => getInstagramAuthUrl(undefined, '/user/onboarding')
    };

    setConnectingPlatform(platform.key);
    stashOAuthAutoLinkIntent({
      workspaceId: onboardingWorkspace.id,
      platform: platform.key,
      returnTo: '/user/onboarding'
    });
    stashOAuthReturnTo('/user/onboarding');

    try {
      const response = await authFnMap[platform.key]();
      if (response.isSuccess && response.value?.authorizationUrl) {
        window.location.href = response.value.authorizationUrl;
        return;
      }

      clearOAuthReturnTo();
      clearOAuthAutoLinkIntent();
      toast.error(response.error?.description || `Failed to connect ${platform.name}. Please try again.`);
      setConnectingPlatform(null);
    } catch (error: any) {
      clearOAuthReturnTo();
      clearOAuthAutoLinkIntent();
      toast.error(error.message || `Failed to connect ${platform.name}. Please try again.`);
      setConnectingPlatform(null);
    }
  };

  if (currentUser?.tutorialStep1Completed) {
    const workspaceId = onboardingWorkspace?.id ?? createdWorkspaceId;
    return <Navigate to={workspaceId ? `/workspace/${workspaceId}/product` : '/user/product'} replace />;
  }

  return (
    <div className='relative grid min-h-screen place-items-center overflow-x-hidden bg-[#050507] px-4 py-6 text-white sm:px-6 lg:px-8'>
      <a
        href='#onboarding-content'
        className='sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-950'
      >
        Skip to setup content
      </a>

      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute inset-0 landing-grid opacity-25' />
        <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/35 to-transparent' />
        <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,7,0.18)_0%,rgba(5,5,7,0.82)_62%,#050507_100%)]' />
      </div>

      <main id='onboarding-content' className='relative z-10 w-full max-w-6xl'>
        {isRestoringOnboardingWorkspace ? (
          <section className='mx-auto flex w-full max-w-2xl items-center gap-4 rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] p-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:p-7'>
            <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-violet-500/12 text-violet-100'>
              <Loader2 className='h-6 w-6 animate-spin' />
            </div>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.24em] text-violet-200/80'>Restoring setup</p>
              <h1 className='mt-2 text-2xl font-semibold tracking-tight text-white'>Loading your workspace</h1>
              <p className='mt-2 text-sm leading-6 text-slate-400'>
                Returning you to social account linking.
              </p>
            </div>
          </section>
        ) : !onboardingWorkspace ? (
          <section className='mx-auto w-full max-w-2xl rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] p-5 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:p-7'>
            <div className='flex items-start gap-4 border-b border-white/10 pb-5'>
              <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-violet-500/12 text-violet-100'>
                <Building2 className='h-6 w-6' />
              </div>
              <div className='min-w-0'>
                <p className='text-xs font-semibold uppercase tracking-[0.24em] text-violet-200/80'>Step 1</p>
                <h1 className='mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Create workspace</h1>
                <p className='mt-2 text-sm leading-6 text-slate-400'>
                  Create the workspace first. Any social account you connect next will be linked to this workspace automatically.
                </p>
              </div>
            </div>

            <form
              className='space-y-5 pt-5'
              onSubmit={(event) => {
                event.preventDefault();
                if (canCreateWorkspace) {
                  createWorkspaceMutation.mutate();
                }
              }}
            >
              <div className='space-y-2'>
                <label htmlFor='onboarding-workspace-name' className='text-sm font-medium text-slate-200'>
                  Workspace name <span className='text-violet-200'>*</span>
                </label>
                <Input
                  id='onboarding-workspace-name'
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  placeholder='Digital camera campaign'
                  className='h-11! rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-violet-500/40'
                  autoFocus
                  required
                />
              </div>

              <div className='space-y-2'>
                <label htmlFor='onboarding-workspace-type' className='text-sm font-medium text-slate-200'>
                  Category
                </label>
                <Select value={workspaceType} onValueChange={setWorkspaceType}>
                  <SelectTrigger
                    id='onboarding-workspace-type'
                    className='h-11! w-full rounded-2xl border border-white/10 bg-[#11131c] text-sm text-white hover:border-white/16 focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/30'
                  >
                    <SelectValue placeholder='Select workspace type' />
                  </SelectTrigger>

                  <SelectContent className='border-white/10 bg-[#11131c] text-white'>
                    {WORKSPACE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <label htmlFor='onboarding-workspace-description' className='text-sm font-medium text-slate-200'>
                  Description
                </label>
                <Textarea
                  id='onboarding-workspace-description'
                  value={workspaceDescription}
                  onChange={(event) => setWorkspaceDescription(event.target.value)}
                  placeholder='Short description for the content this workspace will manage.'
                  className='min-h-28 resize-none rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-violet-500/40'
                />
              </div>

              <div className='flex justify-end border-t border-white/10 pt-5'>
                <Button
                  type='submit'
                  disabled={!canCreateWorkspace || createWorkspaceMutation.isPending}
                  className='h-11 rounded-2xl bg-linear-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20 hover:from-violet-700 hover:to-purple-700 focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-60'
                >
                  {createWorkspaceMutation.isPending ? (
                    <>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Creating
                    </>
                  ) : (
                    <>
                      Create workspace
                      <ArrowRight className='h-4 w-4' />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </section>
        ) : (
          <section className='w-full rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] p-5 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:p-7'>
            <div className='flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between'>
              <div className='flex max-w-2xl items-start gap-4'>
                <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-violet-200 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'>
                  <Link2 className='h-6 w-6' />
                </div>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-[0.24em] text-violet-200/80'>Step 2</p>
                  <h1 className='mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Link social accounts</h1>
                  <p className='mt-2 text-sm leading-6 text-slate-400'>
                    {hasConnectedAccounts
                      ? 'Your connected accounts are ready. Add more channels or continue to the workspace.'
                      : "Connect a social account now, or skip social linking for later."}
                  </p>
                </div>
              </div>

              <Button
                type='button'
                variant='outline'
                onClick={() => void refetchSocials()}
                className='h-10 shrink-0 rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-500/40'
              >
                <RefreshCw className={cn('h-4 w-4', isFetchingSocials && 'animate-spin')} />
                Sync
              </Button>
            </div>

            <div className='mt-5 flex flex-wrap gap-2 text-sm' aria-live='polite' aria-atomic='true'>
              <span className='rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-violet-200'>
                Workspace: {onboardingWorkspace.name}
              </span>
              <span className='rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-slate-300'>
                {accounts.length} account{accounts.length === 1 ? '' : 's'} connected
              </span>
              <span className='rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-violet-200'>
                {connectedPlatformCount} active platform{connectedPlatformCount === 1 ? '' : 's'}
              </span>
            </div>

            <div className='mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
              {connectedSummary.map(({ platform, accounts: platformAccounts }) => {
                const isPending = connectingPlatform === platform.key;
                const hasAccounts = platformAccounts.length > 0;

                return (
                  <article
                    key={platform.key}
                    className={cn(
                      'group flex min-h-56 flex-col rounded-2xl border bg-black/20 p-4 transition-colors motion-reduce:transition-none',
                      hasAccounts
                        ? 'border-emerald-400/25 hover:border-emerald-300/45'
                        : 'border-white/10 hover:border-violet-400/35'
                    )}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='flex min-w-0 items-center gap-3'>
                        <div
                          className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5'
                          style={{ boxShadow: `inset 0 0 0 1px ${platform.brandColor}24` }}
                        >
                          <platform.IconComponent size={22} color='currentColor' className={platform.color} />
                        </div>
                        <div className='min-w-0'>
                          <h2 className='truncate font-semibold text-white'>{platform.name}</h2>
                          <p className='mt-0.5 text-xs text-slate-500'>{platform.description}</p>
                        </div>
                      </div>

                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border',
                          hasAccounts
                            ? 'border-emerald-400/30 bg-emerald-400/15 text-emerald-200'
                            : 'border-white/10 bg-white/5 text-slate-500'
                        )}
                        aria-label={hasAccounts ? `${platform.name} connected` : `${platform.name} not connected`}
                      >
                        {hasAccounts ? <Check className='h-4 w-4' /> : <Link2 className='h-4 w-4' />}
                      </span>
                    </div>

                    <div className='mt-4 min-h-20 flex-1 space-y-2'>
                      {isLoadingSocials ? (
                        <div className='flex h-20 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-sm text-slate-400'>
                          Checking accounts...
                        </div>
                      ) : platformAccounts.length > 0 ? (
                        <>
                          {platformAccounts.slice(0, 2).map((account) => (
                            <div
                              key={account.id}
                              className='truncate rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-slate-200'
                            >
                              {getAccountLabel(account)}
                            </div>
                          ))}
                          {platformAccounts.length > 2 && (
                            <p className='px-1 text-xs text-slate-500'>+{platformAccounts.length - 2} more</p>
                          )}
                        </>
                      ) : (
                        <div className='flex h-20 items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-3 text-sm leading-5 text-slate-500'>
                          Not connected
                        </div>
                      )}
                    </div>

                    <Button
                      type='button'
                      onClick={() => void handleConnect(platform)}
                      disabled={Boolean(connectingPlatform) || finishOnboardingMutation.isPending || !canConnectMore}
                      className={cn(
                        'mt-4 h-10 rounded-2xl focus-visible:ring-2 focus-visible:ring-violet-500/40',
                        hasAccounts
                          ? 'border border-white/10 bg-white/8 text-white hover:bg-white/12'
                          : 'bg-linear-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20 hover:from-violet-700 hover:to-purple-700'
                      )}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className='h-4 w-4 animate-spin' />
                          Connecting
                        </>
                      ) : hasAccounts ? (
                        <>
                          <BadgeCheck className='h-4 w-4' />
                          Add another
                        </>
                      ) : (
                        <>
                          <Link2 className='h-4 w-4' />
                          Connect
                        </>
                      )}
                    </Button>
                  </article>
                );
              })}
            </div>

            <div className='mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => finishOnboardingMutation.mutate()}
                disabled={finishOnboardingMutation.isPending}
                className='h-10 rounded-2xl text-slate-300 hover:bg-white/8 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-500/40'
              >
                <SkipForward className='h-4 w-4' />
                Skip social linking
              </Button>
              <Button
                type='button'
                onClick={() => finishOnboardingMutation.mutate()}
                disabled={finishOnboardingMutation.isPending}
                className='h-10 rounded-2xl bg-linear-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20 hover:from-violet-700 hover:to-purple-700 focus-visible:ring-2 focus-visible:ring-violet-500/40'
              >
                {finishOnboardingMutation.isPending ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Continuing
                  </>
                ) : (
                  <>
                    Continue to workspace
                    <ArrowRight className='h-4 w-4' />
                  </>
                )}
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
