import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { LoaderFunctionArgs } from 'react-router';
import { Navigate, redirect, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  Link2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  SkipForward,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TiktokIcon, FacebookIcon, InstagramIcon, ThreadsIcon } from '@/components/ui/icons/social-icons';
import { cn } from '@/lib/utils';
import { AUTH_QUERY_KEYS } from '@/lib/query-keys';
import { hasRole, requireUser } from '@/services/server/session.server';
import { getFacebookAuthUrl } from '@/services/client/facebook.client';
import { getInstagramAuthUrl } from '@/services/client/instagram.client';
import { completeTutorialStep, fetchAuthMe } from '@/services/client/profile.client';
import { fetchSocialMedias } from '@/services/client/social-media.client';
import { getThreadsAuthUrl } from '@/services/client/threads.client';
import { getTikTokAuthUrl } from '@/services/client/tiktok.client';
import { createWorkspace } from '@/services/client/workspace.client';
import type { SocialMedia } from '@/models/social-media.model';
import { useUserStore } from '@/store/user.store';
import { clearOAuthReturnTo, stashOAuthReturnTo } from '@/utils/social-workspace-autolink';

type OnboardingStep = 'social' | 'workspace';
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
  { value: 'marketing', label: 'Marketing', description: 'Campaigns, launches, and weekly content.' },
  { value: 'ecommerce', label: 'E-commerce', description: 'Products, offers, and selling moments.' },
  { value: 'creator', label: 'Creator', description: 'Personal brand and audience growth.' },
  { value: 'agency', label: 'Agency', description: 'Client content production and approvals.' },
  { value: 'education', label: 'Education', description: 'Courses, lessons, and community updates.' },
  { value: 'personal', label: 'Personal', description: 'Small projects and personal publishing.' }
];

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

export default function UserOnboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setUser = useUserStore((s) => s.setUser);
  const storedUser = useUserStore((s) => s.user);
  const [step, setStep] = useState<OnboardingStep>('social');
  const [connectingPlatform, setConnectingPlatform] = useState<PlatformKey | null>(null);
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

  const currentUser = authMeData?.value ?? storedUser;

  const {
    data: socialMediaData,
    isLoading: isLoadingSocials,
    isFetching: isFetchingSocials,
    refetch: refetchSocials
  } = useQuery({
    queryKey: ['social-medias'],
    queryFn: () => fetchSocialMedias(),
    staleTime: 30_000
  });

  const accounts = socialMediaData?.value ?? [];
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
  const selectedWorkspaceType = WORKSPACE_TYPES.find((type) => type.value === workspaceType) ?? WORKSPACE_TYPES[0];

  const createWorkspaceMutation = useMutation({
    mutationFn: async () => {
      const workspaceResponse = await createWorkspace({
        name: workspaceName.trim(),
        type: workspaceType,
        description: workspaceDescription.trim() || null
      });

      if (!workspaceResponse.isSuccess) {
        throw new Error(workspaceResponse.error?.description || 'Failed to create workspace.');
      }

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
      toast.success('Workspace created.');
      navigate('/user/product', { replace: true });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to finish onboarding.');
    }
  });

  const canCreateWorkspace = workspaceName.trim().length > 0 && !createWorkspaceMutation.isPending;

  const handleConnect = async (platform: PlatformConfig) => {
    const authFnMap: Record<PlatformKey, () => Promise<any>> = {
      threads: () => getThreadsAuthUrl(undefined, '/user/onboarding'),
      tiktok: () => getTikTokAuthUrl(undefined, '/user/onboarding'),
      facebook: () => getFacebookAuthUrl(undefined, '/user/onboarding'),
      instagram: () => getInstagramAuthUrl(undefined, '/user/onboarding')
    };

    setConnectingPlatform(platform.key);
    stashOAuthReturnTo('/user/onboarding');

    try {
      const response = await authFnMap[platform.key]();
      if (response.isSuccess && response.value?.authorizationUrl) {
        window.location.href = response.value.authorizationUrl;
        return;
      }

      clearOAuthReturnTo();
      toast.error(response.error?.description || `Failed to connect ${platform.name}. Please try again.`);
      setConnectingPlatform(null);
    } catch (error) {
      clearOAuthReturnTo();
      toast.error(`Unable to connect ${platform.name}. Please check your connection and try again.`);
      setConnectingPlatform(null);
    }
  };

  if (currentUser?.tutorialStep1Completed) {
    return <Navigate to='/user/product' replace />;
  }

  return (
    <div className='relative min-h-screen overflow-x-hidden bg-[#050507] text-white'>
      <a
        href='#onboarding-content'
        className='sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-950'
      >
        Skip to setup content
      </a>

      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute inset-0 landing-grid opacity-25' />
        <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/45 to-transparent' />
        <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,7,0.18)_0%,rgba(5,5,7,0.82)_62%,#050507_100%)]' />
      </div>

      <main
        id='onboarding-content'
        className='relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8'
      >
        <header className='mb-5 flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100'>
              <Sparkles className='h-5 w-5' />
            </div>
            <div>
              <p className='text-base font-semibold text-white'>MeAI setup</p>
              <p className='text-sm text-slate-400'>One workspace is required before creating content.</p>
            </div>
          </div>

          <div className='flex w-full items-center gap-2 text-sm text-slate-300 sm:w-auto'>
            <div
              className={cn(
                'flex h-10 flex-1 items-center justify-center rounded-lg border px-3 sm:w-32 sm:flex-none',
                step === 'social'
                  ? 'border-cyan-300/35 bg-cyan-300/12 text-cyan-50'
                  : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
              )}
            >
              1 Social
            </div>
            <ArrowRight className='h-4 w-4 shrink-0 text-slate-600' />
            <div
              className={cn(
                'flex h-10 flex-1 items-center justify-center rounded-lg border px-3 sm:w-32 sm:flex-none',
                step === 'workspace'
                  ? 'border-cyan-300/35 bg-cyan-300/12 text-cyan-50'
                  : 'border-white/10 bg-white/5 text-slate-400'
              )}
            >
              2 Workspace
            </div>
          </div>
        </header>

        <section className='grid flex-1 gap-5 pb-6 lg:grid-cols-[22rem_minmax(0,1fr)]'>
          <aside className='flex min-h-80 flex-col justify-between rounded-lg border border-white/12 bg-white/[0.035] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)]'>
            <div>
              <p className='mb-3 inline-flex rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-cyan-100'>
                First run setup
              </p>
              <h1 className='text-3xl font-semibold text-white'>Build your content workspace</h1>
              <p className='mt-3 text-sm leading-6 text-slate-400'>
                Link social channels when they are ready, then create the workspace that will hold campaigns, drafts,
                and AI recommendations.
              </p>

              <div className='mt-6 space-y-3'>
                <div
                  className={cn(
                    'rounded-lg border p-4 transition-colors motion-reduce:transition-none',
                    step === 'social' ? 'border-cyan-300/35 bg-cyan-300/10' : 'border-emerald-400/25 bg-emerald-400/8'
                  )}
                >
                  <div className='flex items-start gap-3'>
                    <span className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-300/15 text-cyan-100'>
                      {step === 'social' ? <Link2 className='h-4 w-4' /> : <Check className='h-4 w-4' />}
                    </span>
                    <div>
                      <p className='font-medium text-white'>Connect social accounts</p>
                      <p className='mt-1 text-sm leading-5 text-slate-400'>
                        Optional now. {connectedPlatformCount} of {PLATFORMS.length} platforms connected.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    'rounded-lg border p-4 transition-colors motion-reduce:transition-none',
                    step === 'workspace' ? 'border-cyan-300/35 bg-cyan-300/10' : 'border-white/10 bg-black/15'
                  )}
                >
                  <div className='flex items-start gap-3'>
                    <span className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/8 text-slate-100'>
                      <Building2 className='h-4 w-4' />
                    </span>
                    <div>
                      <p className='font-medium text-white'>Create workspace</p>
                      <p className='mt-1 text-sm leading-5 text-slate-400'>Required. Name is needed to continue.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='mt-6 rounded-lg border border-white/10 bg-black/20 p-4'>
              <div className='flex items-center gap-2 text-sm font-medium text-slate-200'>
                <ShieldCheck className='h-4 w-4 text-emerald-300' />
                Tutorial progress is saved
              </div>
              <p className='mt-2 text-sm leading-5 text-slate-500'>
                Completed accounts will not see this setup again after the workspace is created.
              </p>
            </div>
          </aside>

          <section className='min-w-0 rounded-lg border border-white/12 bg-[linear-gradient(160deg,rgba(12,15,27,0.94)_0%,rgba(7,9,16,0.98)_100%)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.4)] sm:p-6'>
            {step === 'social' ? (
              <div className='flex h-full flex-col'>
                <div className='flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between'>
                  <div className='max-w-2xl'>
                    <div className='flex items-center gap-3'>
                      <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-100'>
                        <Link2 className='h-5 w-5' />
                      </div>
                      <div>
                        <h2 className='text-2xl font-semibold text-white'>Link social accounts</h2>
                        <p className='mt-1 text-sm leading-6 text-slate-400'>
                          {hasConnectedAccounts
                            ? 'Your connected accounts are ready. Continue when you are ready to create a workspace.'
                            : "You don't have any social account linked. Please link one, or skip this for now."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => void refetchSocials()}
                    className='h-10 shrink-0 rounded-lg border border-white/10 bg-white/5 text-white/85 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/50'
                  >
                    <RefreshCw className={cn('h-4 w-4', isFetchingSocials && 'animate-spin')} />
                    Sync
                  </Button>
                </div>

                <div className='mt-5 grid gap-3 sm:grid-cols-3' aria-live='polite' aria-atomic='true'>
                  <div className='rounded-lg border border-white/10 bg-black/20 p-4'>
                    <p className='text-2xl font-semibold text-white'>{accounts.length}</p>
                    <p className='mt-1 text-sm text-slate-400'>Connected accounts</p>
                  </div>
                  <div className='rounded-lg border border-white/10 bg-black/20 p-4'>
                    <p className='text-2xl font-semibold text-white'>{connectedPlatformCount}</p>
                    <p className='mt-1 text-sm text-slate-400'>Active platforms</p>
                  </div>
                  <div className='rounded-lg border border-white/10 bg-black/20 p-4'>
                    <p className='text-2xl font-semibold text-white'>{PLATFORMS.length}</p>
                    <p className='mt-1 text-sm text-slate-400'>Available channels</p>
                  </div>
                </div>

                <div className='mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                  {connectedSummary.map(({ platform, accounts: platformAccounts }) => {
                    const isPending = connectingPlatform === platform.key;
                    const hasAccounts = platformAccounts.length > 0;

                    return (
                      <article
                        key={platform.key}
                        className={cn(
                          'group flex min-h-72 flex-col rounded-lg border bg-black/22 p-4 transition-colors motion-reduce:transition-none',
                          hasAccounts
                            ? 'border-emerald-400/25 hover:border-emerald-300/45'
                            : 'border-white/10 hover:border-cyan-300/35'
                        )}
                      >
                        <div className='flex items-start justify-between gap-3'>
                          <div className='flex items-center gap-3'>
                            <div
                              className='flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5'
                              style={{ boxShadow: `inset 0 0 0 1px ${platform.brandColor}24` }}
                            >
                              <platform.IconComponent size={22} color='currentColor' className={platform.color} />
                            </div>
                            <div className='min-w-0'>
                              <h3 className='truncate font-semibold text-white'>{platform.name}</h3>
                              <p className='mt-0.5 text-xs text-slate-500'>{platform.description}</p>
                            </div>
                          </div>

                          <span
                            className={cn(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
                              hasAccounts
                                ? 'border-emerald-400/30 bg-emerald-400/15 text-emerald-200'
                                : 'border-white/10 bg-white/5 text-slate-500'
                            )}
                            aria-label={hasAccounts ? `${platform.name} connected` : `${platform.name} not connected`}
                          >
                            {hasAccounts ? <Check className='h-4 w-4' /> : <Link2 className='h-4 w-4' />}
                          </span>
                        </div>

                        <div className='mt-4 min-h-28 flex-1 space-y-2'>
                          {isLoadingSocials ? (
                            <div className='flex h-24 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03] text-sm text-slate-400'>
                              Checking accounts...
                            </div>
                          ) : platformAccounts.length > 0 ? (
                            <>
                              {platformAccounts.slice(0, 3).map((account) => (
                                <div
                                  key={account.id}
                                  className='truncate rounded-lg border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-slate-200'
                                >
                                  {getAccountLabel(account)}
                                </div>
                              ))}
                              {platformAccounts.length > 3 && (
                                <p className='px-1 text-xs text-slate-500'>+{platformAccounts.length - 3} more</p>
                              )}
                            </>
                          ) : (
                            <div className='flex h-24 items-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 text-sm leading-5 text-slate-500'>
                              Connect now or continue without this platform.
                            </div>
                          )}
                        </div>

                        <Button
                          type='button'
                          onClick={() => void handleConnect(platform)}
                          disabled={Boolean(connectingPlatform)}
                          className={cn(
                            'mt-4 h-10 rounded-lg focus-visible:ring-2 focus-visible:ring-cyan-300/50',
                            hasAccounts
                              ? 'border border-white/10 bg-white/8 text-white hover:bg-white/12'
                              : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
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

                <div className='mt-auto flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-end'>
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={() => setStep('workspace')}
                    className='h-10 rounded-lg text-slate-300 hover:bg-white/8 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/50'
                  >
                    <SkipForward className='h-4 w-4' />
                    Skip
                  </Button>
                  <Button
                    type='button'
                    onClick={() => setStep('workspace')}
                    className='h-10 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-300/50'
                  >
                    Next
                    <ArrowRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            ) : (
              <form
                className='flex h-full flex-col'
                onSubmit={(event) => {
                  event.preventDefault();
                  if (canCreateWorkspace) {
                    createWorkspaceMutation.mutate();
                  }
                }}
              >
                <div className='flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-100'>
                      <Building2 className='h-5 w-5' />
                    </div>
                    <div>
                      <h2 className='text-2xl font-semibold text-white'>Create your workspace</h2>
                      <p className='mt-1 text-sm leading-6 text-slate-400'>
                        Name the workspace where campaigns, media, and generated content will live.
                      </p>
                    </div>
                  </div>
                  <div className='rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100'>
                    Workspace required
                  </div>
                </div>

                <div className='grid flex-1 gap-5 pt-5 lg:grid-cols-[minmax(0,1fr)_22rem]'>
                  <div className='space-y-5'>
                    <div className='space-y-2'>
                      <label htmlFor='workspace-name' className='text-sm font-medium text-slate-200'>
                        Workspace name <span className='text-cyan-200'>*</span>
                        <span className='sr-only'> required</span>
                      </label>
                      <Input
                        id='workspace-name'
                        value={workspaceName}
                        onChange={(event) => setWorkspaceName(event.target.value)}
                        placeholder='Brand campaigns'
                        className='h-11 rounded-lg border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-cyan-300/50'
                        aria-describedby='workspace-name-help'
                        required
                        autoFocus
                      />
                      <p id='workspace-name-help' className='text-xs text-slate-500'>
                        This name appears in workspace lists and content tools.
                      </p>
                    </div>

                    <fieldset className='space-y-3'>
                      <legend className='text-sm font-medium text-slate-200'>Category</legend>
                      <div className='grid gap-3 sm:grid-cols-2'>
                        {WORKSPACE_TYPES.map((type) => {
                          const isSelected = workspaceType === type.value;
                          return (
                            <button
                              key={type.value}
                              type='button'
                              onClick={() => setWorkspaceType(type.value)}
                              aria-pressed={isSelected}
                              className={cn(
                                'cursor-pointer rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 motion-reduce:transition-none',
                                isSelected
                                  ? 'border-cyan-300/40 bg-cyan-300/12 text-white'
                                  : 'border-white/10 bg-black/20 text-slate-300 hover:border-white/18 hover:bg-white/[0.04]'
                              )}
                            >
                              <span className='flex items-center justify-between gap-2'>
                                <span className='font-medium'>{type.label}</span>
                                {isSelected && <Check className='h-4 w-4 text-cyan-100' />}
                              </span>
                              <span className='mt-1 block text-sm leading-5 text-slate-500'>{type.description}</span>
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>

                    <div className='space-y-2'>
                      <label htmlFor='workspace-description' className='text-sm font-medium text-slate-200'>
                        Description
                      </label>
                      <Textarea
                        id='workspace-description'
                        value={workspaceDescription}
                        onChange={(event) => setWorkspaceDescription(event.target.value)}
                        placeholder='Short description for this workspace'
                        className='min-h-32 rounded-lg border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-cyan-300/50'
                      />
                    </div>
                  </div>

                  <aside className='rounded-lg border border-white/10 bg-black/20 p-5'>
                    <div className='flex items-center gap-2 text-sm font-medium text-slate-200'>
                      <BadgeCheck className='h-4 w-4 text-cyan-200' />
                      Workspace preview
                    </div>
                    <div className='mt-5 rounded-lg border border-cyan-300/18 bg-cyan-300/8 p-4'>
                      <div className='flex items-center gap-3'>
                        <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-400 text-slate-950'>
                          <Building2 className='h-5 w-5' />
                        </div>
                        <div className='min-w-0'>
                          <p className='truncate font-semibold text-white'>
                            {workspaceName.trim() || 'Untitled workspace'}
                          </p>
                          <p className='text-xs text-cyan-100'>{selectedWorkspaceType.label}</p>
                        </div>
                      </div>
                      <p className='mt-4 text-sm leading-6 text-slate-400'>
                        {workspaceDescription.trim() || selectedWorkspaceType.description}
                      </p>
                    </div>

                    <div className='mt-5 space-y-3 text-sm text-slate-400'>
                      <div className='flex items-center gap-2'>
                        <Check className='h-4 w-4 text-emerald-300' />
                        Product drafts and media stay organized here.
                      </div>
                      <div className='flex items-center gap-2'>
                        <Check className='h-4 w-4 text-emerald-300' />
                        AI recommendation setup starts on the product page.
                      </div>
                    </div>
                  </aside>
                </div>

                <div className='mt-auto flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-end'>
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={() => setStep('social')}
                    disabled={createWorkspaceMutation.isPending}
                    className='h-10 rounded-lg text-slate-300 hover:bg-white/8 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/50'
                  >
                    <ArrowLeft className='h-4 w-4' />
                    Back
                  </Button>
                  <Button
                    type='submit'
                    disabled={!canCreateWorkspace}
                    className='h-10 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-300/50 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500'
                  >
                    {createWorkspaceMutation.isPending ? (
                      <>
                        <Loader2 className='h-4 w-4 animate-spin' />
                        Creating
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className='h-4 w-4' />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
