import { useQueries, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Bookmark, Heart, MessageCircle, Share2, Users, ArrowUpRight } from 'lucide-react';
import { data, type LoaderFunctionArgs, useLoaderData, useRevalidator } from 'react-router';

import { FacebookIcon, InstagramIcon, ThreadsIcon, TiktokIcon } from '@/components/ui/icons/social-icons';
import { DashboardOverviewCharts } from '@/components/dashboard/overview-charts';
import type { PlatformAccountInsights, PlatformDashboardSummaryValue, PlatformPostStats } from '@/models/post.model';
import type { SocialMedia } from '@/models/social-media.model';
import { fetchPlatformDashboardSummary } from '@/services/client/post.client';
import { fetchSocialMediasServer } from '@/services/server/social-media.server';

type SupportedPlatform = 'facebook' | 'instagram' | 'threads' | 'tiktok';

const SUPPORTED_PLATFORMS: SupportedPlatform[] = ['facebook', 'instagram', 'threads', 'tiktok'];
const DASHBOARD_POST_LIMIT = 10;

const PLATFORM_META: Record<
  SupportedPlatform,
  {
    label: string;
    Icon: React.FC<{ size?: number; color?: string; className?: string }>;
    accentClass: string;
  }
> = {
  facebook: {
    label: 'Facebook',
    Icon: FacebookIcon,
    accentClass: 'text-blue-400'
  },
  instagram: {
    label: 'Instagram',
    Icon: InstagramIcon,
    accentClass: 'text-pink-400'
  },
  tiktok: {
    label: 'TikTok',
    Icon: TiktokIcon,
    accentClass: 'text-white'
  },
  threads: {
    label: 'Threads',
    Icon: ThreadsIcon,
    accentClass: 'text-white'
  }
};

export async function loader({ request }: LoaderFunctionArgs) {
  const response = await fetchSocialMediasServer(request);

  if (!response.isSuccess) {
    throw new Error(response.error?.description || 'Unable to load social accounts.');
  }

  const accounts = (response.value ?? [])
    .filter((account) => {
      const type = account.type?.toLowerCase();
      return SUPPORTED_PLATFORMS.includes(type as SupportedPlatform);
    })
    .sort((left, right) => {
      const leftType = left.type?.toLowerCase() as SupportedPlatform;
      const rightType = right.type?.toLowerCase() as SupportedPlatform;
      const typeOrder = SUPPORTED_PLATFORMS.indexOf(leftType) - SUPPORTED_PLATFORMS.indexOf(rightType);

      if (typeOrder !== 0) {
        return typeOrder;
      }

      return getAccountSortKey(left).localeCompare(getAccountSortKey(right), undefined, {
        sensitivity: 'base'
      });
    });

  return data({ accounts });
}

function getAccountSortKey(account: SocialMedia) {
  return account.profile?.displayName || account.profile?.username || account.profile?.userId || account.id;
}

function formatCompactNumber(value: number | null | undefined) {
  if (value == null) {
    return '0';
  }

  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function formatNullableCompactNumber(value: number | null | undefined) {
  if (value == null) {
    return 'N/A';
  }

  return formatCompactNumber(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function hasOnlyZeroTrackedMetrics(
  stats:
    | {
        views?: number | null;
        reach?: number | null;
        likes?: number | null;
        comments?: number | null;
        shares?: number | null;
        impressions?: number | null;
      }
    | null
    | undefined
) {
  if (!stats) {
    return false;
  }

  const trackedValues = [stats.views, stats.reach, stats.likes, stats.comments, stats.shares, stats.impressions].filter(
    (value): value is number => value != null
  );

  return trackedValues.length > 0 && trackedValues.every((value) => value === 0);
}

function shouldUseReachAsAudienceMetric(
  stats:
    | {
        views?: number | null;
        reach?: number | null;
      }
    | null
    | undefined
) {
  return stats?.reach != null && (stats.views == null || stats.views === stats.reach);
}

function getAccountAvatar(account: SocialMedia, accountInsights?: PlatformAccountInsights | null) {
  return (
    account.profile?.profilePictureUrl ||
    accountInsights?.metadata?.profilePictureUrl ||
    accountInsights?.metadata?.avatarUrl ||
    undefined
  );
}

function getAccountDisplayName(account: SocialMedia, accountInsights?: PlatformAccountInsights | null) {
  if (account.type.toLowerCase() === 'facebook') {
    return account.profile?.displayName || account.profile?.username || 'Connected account';
  }

  return (
    account.profile?.displayName ||
    accountInsights?.accountName ||
    account.profile?.username ||
    accountInsights?.username ||
    'Connected account'
  );
}

function getFacebookPageName(account: SocialMedia, accountInsights?: PlatformAccountInsights | null) {
  return accountInsights?.accountName || account.profile?.username || null;
}

function getAccountIdentity(account: SocialMedia, accountInsights?: PlatformAccountInsights | null) {
  const accountType = account.type.toLowerCase();
  const username = account.profile?.username || accountInsights?.username;
  const accountId = account.profile?.userId || accountInsights?.accountId || account.id;

  if (accountType === 'facebook') {
    const pageName = getFacebookPageName(account, accountInsights);
    return {
      label: pageName ? 'Page' : 'Page ID',
      value: pageName || accountId || 'Unavailable'
    };
  }

  if (username) {
    return {
      label: 'Handle',
      value: `@${username}`
    };
  }

  return {
    label: 'Account ID',
    value: accountId || 'Unavailable'
  };
}

function SummaryStatsGrid({ stats, showSummarySaves }: { stats: PlatformPostStats; showSummarySaves: boolean }) {
  const usesReachAsAudienceMetric = shouldUseReachAsAudienceMetric(stats);

  const MetricItem = ({
    icon: Icon,
    label,
    value
  }: {
    icon: React.FC<any>;
    label: string;
    value: number | null | undefined;
  }) => (
    <div className='group relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.015] p-3.5 transition-colors hover:bg-white/[0.03]'>
      <div className='absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none' />
      <span className='mb-2.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500'>
        <Icon className='size-3.5 text-slate-400 transition-colors group-hover:text-indigo-400' /> {label}
      </span>
      <p className='font-mono text-xl font-bold tracking-tight text-white/95'>{formatCompactNumber(value)}</p>
    </div>
  );

  const metrics = [
    {
      icon: usesReachAsAudienceMetric ? Users : BarChart3,
      label: usesReachAsAudienceMetric ? 'Reach' : 'Views',
      value: usesReachAsAudienceMetric ? stats.reach : stats.views
    },
    { icon: Heart, label: 'Likes', value: stats.likes },
    { icon: MessageCircle, label: 'Comments', value: stats.comments },
    ...(usesReachAsAudienceMetric || stats.reach == null ? [] : [{ icon: Users, label: 'Reach', value: stats.reach }]),
    { icon: Share2, label: 'Shares', value: stats.shares },
    ...(showSummarySaves ? [{ icon: Bookmark, label: 'Saves', value: stats.saves }] : [])
  ];

  return (
    <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
      {metrics.map((metric) => (
        <MetricItem key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} />
      ))}
    </div>
  );
}

function AccountCard({
  account,
  summary,
  isLoading,
  isRefreshing,
  errorMessage
}: {
  account: SocialMedia;
  summary?: PlatformDashboardSummaryValue | null;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage?: string | null;
}) {
  const accountType = account.type.toLowerCase();
  const isTikTok = accountType === 'tiktok';
  const showDetailedPosts = accountType === 'facebook' || accountType === 'instagram' || accountType === 'tiktok';
  const showSummarySaves = accountType === 'instagram';
  const accountInsights = summary?.accountInsights ?? null;
  const avatarUrl = getAccountAvatar(account, accountInsights);
  const displayName = getAccountDisplayName(account, accountInsights);
  const identity = getAccountIdentity(account, accountInsights);
  const fetchedPostCount = summary?.fetchedPostCount ?? 0;
  const postsBadgeLabel = isTikTok ? 'Fetched' : 'Posts';
  const showTikTokZeroMetricsNote = isTikTok && hasOnlyZeroTrackedMetrics(summary?.aggregatedStats);

  const meta = PLATFORM_META[accountType as SupportedPlatform];
  const Icon = meta?.Icon;

  return (
    <div className='group relative flex flex-col overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent p-6 shadow-2xl transition-all hover:border-white/[0.1] hover:bg-white/[0.04]'>
      <div className='absolute right-0 top-0 -mr-8 -mt-8 opacity-[0.03] transition-transform duration-700 ease-out group-hover:scale-110 pointer-events-none'>
        {Icon && <Icon size={160} />}
      </div>

      <div className='relative z-10 mb-6 flex items-start justify-between gap-4'>
        <div className='flex items-center gap-4'>
          {avatarUrl ? (
            <div className='relative'>
              <img
                src={avatarUrl}
                alt={displayName}
                className='size-14 rounded-full border border-white/10 ring-2 ring-transparent transition-all group-hover:ring-white/20 object-cover'
              />
              {Icon && (
                <div className='absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#13131e] border border-white/10'>
                  <Icon size={10} className={meta.accentClass} />
                </div>
              )}
            </div>
          ) : (
            <div className='flex size-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg font-medium text-slate-300'>
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className='text-lg font-bold tracking-tight text-white/95'>{displayName}</h3>
            <p className='text-sm text-slate-400'>
              <span className='text-slate-500'>{identity.label}:</span> {identity.value}
            </p>
          </div>
        </div>
        <div className='flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 backdrop-blur-md'>
          <span className='mr-1.5 size-1.5 rounded-full bg-emerald-400 animate-pulse' />
          <span className='text-[10px] font-medium uppercase tracking-wider text-slate-300'>Connected</span>
        </div>
      </div>

      {accountInsights && (
        <div className='relative z-10 mb-6 grid grid-cols-3 gap-y-4 gap-x-2 border-y border-white/[0.04] py-4'>
          <div>
            <p className='text-[10px] font-semibold uppercase tracking-wider text-slate-500'>Followers</p>
            <p className='mt-1 font-mono text-lg font-bold text-white'>
              {formatNullableCompactNumber(accountInsights.followers)}
            </p>
          </div>
          <div>
            <p className='text-[10px] font-semibold uppercase tracking-wider text-slate-500'>Following</p>
            <p className='mt-1 font-mono text-lg font-bold text-white'>
              {formatNullableCompactNumber(accountInsights.following)}
            </p>
          </div>
          <div>
            <p className='text-[10px] font-semibold uppercase tracking-wider text-slate-500'>{postsBadgeLabel}</p>
            <p className='mt-1 font-mono text-lg font-bold text-white'>
              {summary?.hasMorePosts ? `${fetchedPostCount}+` : fetchedPostCount}
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className='relative z-10 mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4'>
          <p className='text-sm font-medium text-red-400'>{errorMessage}</p>
        </div>
      )}

      {!summary && (isLoading || isRefreshing) && (
        <div className='relative z-10 space-y-4'>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`${account.id}-loading-${index}`}
                className='h-20 rounded-xl border border-white/[0.02] bg-white/[0.02] animate-pulse'
              />
            ))}
          </div>
        </div>
      )}

      {summary ? (
        <div className='relative z-10 flex flex-col gap-6'>
          <SummaryStatsGrid stats={summary.aggregatedStats} showSummarySaves={showSummarySaves} />

          {summary.latestAnalysis && (
            <div className='rounded-xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-indigo-500/[0.02] p-4 backdrop-blur-md'>
              <div className='mb-2 flex items-center justify-between'>
                <p className='text-xs font-semibold uppercase tracking-wider text-indigo-300'>
                  AI Analysis • {summary.latestAnalysis.performanceBand || 'N/A'}
                </p>
              </div>
              {summary.latestAnalysis.highlights?.length > 0 && (
                <p className='text-sm leading-relaxed text-indigo-100/80'>{summary.latestAnalysis.highlights[0]}</p>
              )}
            </div>
          )}

          {showTikTokZeroMetricsNote && (
            <p className='rounded-xl border border-sky-500/20 bg-sky-500/10 p-4 text-xs leading-relaxed text-sky-200/80'>
              TikTok engagement counters can lag behind the public post. Official API metrics may report zero until sync
              completes.
            </p>
          )}

          {showDetailedPosts && summary.posts.length > 0 && (
            <div className='mt-2'>
              <p className='mb-4 text-xs font-bold uppercase tracking-widest text-slate-500'>Recent Performance</p>
              <div className='space-y-3'>
                {summary.posts.slice(0, 3).map((item) => {
                  const stats = item.post.stats;
                  const usesReachAsAudienceMetric = shouldUseReachAsAudienceMetric(stats);
                  return (
                    <a
                      key={item.post.platformPostId}
                      href={item.post.permalink || '#'}
                      target='_blank'
                      rel='noreferrer'
                      className='group/post block rounded-2xl border border-white/[0.04] bg-[#0b0c16]/50 p-4 transition-all hover:bg-white/[0.03] hover:border-white/10'
                    >
                      <div className='mb-3 flex items-start justify-between gap-3'>
                        <h4 className='line-clamp-2 min-w-0 text-sm font-medium leading-snug text-white/90 group-hover/post:text-white transition-colors'>
                          {item.post.title || item.post.text || item.post.description || 'Draft post'}
                        </h4>
                        <ArrowUpRight className='size-4 shrink-0 text-slate-600 transition-colors group-hover/post:text-white group-hover/post:translate-x-0.5 group-hover/post:-translate-y-0.5' />
                      </div>
                      <div className='flex items-center gap-4 text-xs text-slate-400'>
                        <span className='font-mono text-slate-300'>
                          {formatNullableCompactNumber(usesReachAsAudienceMetric ? stats?.reach : stats?.views)}{' '}
                          <span className='text-slate-500 font-sans'>
                            {usesReachAsAudienceMetric ? 'reach' : 'views'}
                          </span>
                        </span>
                        <span className='font-mono text-slate-300'>
                          {formatNullableCompactNumber(stats?.likes)}{' '}
                          <span className='text-slate-500 font-sans'>likes</span>
                        </span>
                        <span className='font-mono text-slate-300'>{formatDate(item.post.publishedAt)}</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        !errorMessage &&
        !isLoading &&
        !isRefreshing && (
          <div className='relative z-10 flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]'>
            <p className='text-sm text-slate-400 text-center px-6'>
              No analytics available. <br />
              Publish a post to see data here.
            </p>
          </div>
        )
      )}
    </div>
  );
}

export default function Dashboard() {
  const { accounts } = useLoaderData<typeof loader>();
  const queryClient = useQueryClient();
  const revalidator = useRevalidator();

  const summaryQueries = useQueries({
    queries: accounts.map((account) => ({
      queryKey: ['dashboard-account-summary', account.id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchPlatformDashboardSummary(account.id, DASHBOARD_POST_LIMIT, signal),
      staleTime: 60_000
    }))
  });

  const totalAccounts = accounts.length;
  const grouped: Record<SupportedPlatform, SocialMedia[]> = {
    facebook: [],
    instagram: [],
    threads: [],
    tiktok: []
  };

  for (const account of accounts) {
    const key = account.type.toLowerCase() as SupportedPlatform;
    if (grouped[key]) {
      grouped[key].push(account);
    }
  }

  const summariesByAccountId = new Map(
    accounts.map((account, index) => [account.id, summaryQueries[index]?.data?.value ?? null] as const)
  );
  const errorsByAccountId = new Map(
    accounts.map((account, index) => {
      const query = summaryQueries[index];
      const errorMessage = query?.error instanceof Error ? query.error.message : null;
      return [account.id, errorMessage] as const;
    })
  );
  const loadingByAccountId = new Map(
    accounts.map((account, index) => [account.id, summaryQueries[index]?.isPending ?? false] as const)
  );
  const refreshingByAccountId = new Map(
    accounts.map((account, index) => [account.id, summaryQueries[index]?.isFetching ?? false] as const)
  );

  const isRefreshing = revalidator.state !== 'idle' || summaryQueries.some((query) => query.isFetching);

  const refreshAll = () => {
    revalidator.revalidate();
    void queryClient.invalidateQueries({ queryKey: ['dashboard-account-summary'] });
  };

  return (
    <div className='mx-auto max-w-7xl space-y-12 pb-16'>
      <header className='flex flex-wrap items-end justify-between gap-6 border-b border-white/[0.05] pb-8'>
        <div>
          <h1 className='text-4xl font-extrabold tracking-tighter text-white'>Analytics</h1>
          <p className='mt-2.5 max-w-xl text-base text-slate-400'>
            Aggregated performance insights across your social footprint. Make decisions backed by integrated data.
          </p>
        </div>

        <button
          type='button'
          onClick={refreshAll}
          disabled={isRefreshing}
          className='flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-2.5 text-sm font-semibold text-white shadow backdrop-blur-md transition-all hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50'
        >
          {isRefreshing ? (
            <span className='size-4 animate-spin rounded-full border-2 border-slate-400 border-t-white' />
          ) : (
            <svg
              className='size-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
          )}
          {isRefreshing ? 'Syncing...' : 'Sync Data'}
        </button>
      </header>

      {totalAccounts === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 px-6 py-24 text-center'>
          <div className='mb-4 rounded-full bg-white/5 p-4'>
            <Share2 className='size-8 text-slate-400' />
          </div>
          <h3 className='text-xl font-semibold text-white'>No accounts connected</h3>
          <p className='mt-2 max-w-sm text-slate-400'>
            Link your Facebook, Instagram, TikTok, or Threads accounts to see engagement analytics here.
          </p>
        </div>
      ) : (
        <>
          <DashboardOverviewCharts accounts={accounts} summaries={summariesByAccountId} />

          <div className='space-y-16'>
            {SUPPORTED_PLATFORMS.map((platform) => {
              const sectionAccounts = grouped[platform];
              if (sectionAccounts.length === 0) return null;

              const meta = PLATFORM_META[platform];
              const Icon = meta.Icon;

              return (
                <section key={platform} className='relative'>
                  <div className='mb-6 flex items-center gap-3'>
                    <div className='flex size-10 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.05] shadow-inner'>
                      <Icon size={20} className={meta.accentClass} />
                    </div>
                    <h2 className='text-xl font-bold tracking-tight text-white'>{meta.label}</h2>
                    <span className='ml-2 rounded-md bg-white/5 px-2 py-1 font-mono text-xs font-bold text-slate-400'>
                      {sectionAccounts.length} {sectionAccounts.length === 1 ? 'ACCOUNT' : 'ACCOUNTS'}
                    </span>
                  </div>

                  <div className='grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8'>
                    {sectionAccounts.map((account) => (
                      <AccountCard
                        key={account.id}
                        account={account}
                        summary={summariesByAccountId.get(account.id)}
                        isLoading={loadingByAccountId.get(account.id) ?? false}
                        isRefreshing={refreshingByAccountId.get(account.id) ?? false}
                        errorMessage={errorsByAccountId.get(account.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
