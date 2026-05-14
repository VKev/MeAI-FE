import { BarChart3, Bookmark, Heart, MessageCircle, Share2, Users, ArrowUpRight, BarChart3Icon, RefreshCw, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

import { FacebookIcon, InstagramIcon, ThreadsIcon, TiktokIcon } from '@/components/ui/icons/social-icons';
import { DashboardOverviewCharts } from '@/components/dashboard/overview-charts';
import type { PlatformAccountInsights, PlatformDashboardSummaryValue, PlatformPostStats } from '@/models/post.model';
import type { SocialMedia } from '@/models/social-media.model';
import { fetchBatchDashboardSummary, fetchPlatformDashboardSummary } from '@/services/client/post.client';
import { fetchFacebookPages, fetchSocialMedias } from '@/services/client/social-media.client';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

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

function sortAccounts(accounts: SocialMedia[]) {
  return [...accounts].sort((left, right) => {
    const leftType = left.type?.toLowerCase() as SupportedPlatform;
    const rightType = right.type?.toLowerCase() as SupportedPlatform;
    const typeOrder = SUPPORTED_PLATFORMS.indexOf(leftType) - SUPPORTED_PLATFORMS.indexOf(rightType);
    if (typeOrder !== 0) return typeOrder;
    return getAccountSortKey(left).localeCompare(getAccountSortKey(right), undefined, { sensitivity: 'base' });
  });
}

function mergeAccounts(socialMedias: SocialMedia[], facebookPages: SocialMedia[] | null): SocialMedia[] {
  const nonFacebook = socialMedias.filter((a) => {
    const type = a.type?.toLowerCase();
    return type !== 'facebook' && SUPPORTED_PLATFORMS.includes(type as SupportedPlatform);
  });
  const facebook = facebookPages ?? socialMedias.filter((a) => a.type?.toLowerCase() === 'facebook');
  return sortAccounts([...facebook, ...nonFacebook]);
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
  const accountType = account.type.toLowerCase();

  // For Facebook, prefer page avatar
  if (accountType === 'facebook') {
    return (
      account.profile?.pageProfilePictureUrl ||
      accountInsights?.metadata?.profilePictureUrl ||
      accountInsights?.metadata?.avatarUrl ||
      account.profile?.profilePictureUrl ||
      undefined
    );
  }

  return (
    account.profile?.profilePictureUrl ||
    accountInsights?.metadata?.profilePictureUrl ||
    accountInsights?.metadata?.avatarUrl ||
    undefined
  );
}

function getAccountDisplayName(account: SocialMedia, accountInsights?: PlatformAccountInsights | null) {
  if (account.type.toLowerCase() === 'facebook') {
    return account.profile?.pageName || accountInsights?.accountName || account.profile?.displayName || 'Facebook Page';
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
  return account.profile?.pageName || accountInsights?.accountName || account.profile?.username || null;
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
 
  const metrics = [
    {
      icon: usesReachAsAudienceMetric ? Users : BarChart3,
      label: usesReachAsAudienceMetric ? 'Reach' : 'Views',
      value: usesReachAsAudienceMetric ? stats.reach : stats.views
    },
    { icon: Heart, label: 'Likes', value: stats.likes },
    { icon: MessageCircle, label: 'Comments', value: stats.comments },
    { icon: Share2, label: 'Shares', value: stats.shares },
    ...(showSummarySaves ? [{ icon: Bookmark, label: 'Saves', value: stats.saves }] : [])
  ];
 
  return (
    <div className='flex flex-wrap items-center gap-3'>
      {metrics.map((metric) => (
        <div key={metric.label} className='flex items-center gap-2 rounded-xl bg-white/[0.02] border border-white/5 px-3 py-2'>
          <metric.icon className='size-3.5 text-slate-500' />
          <div className='flex flex-col leading-none'>
            <span className='text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-0.5'>{metric.label}</span>
            <span className='font-mono text-[11px] font-bold text-white'>{formatCompactNumber(metric.value)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AccountCard({
  account,
  summary,
  isLoading,
  isRefreshing,
  errorMessage,
  parentAccountName
}: {
  account: SocialMedia;
  summary?: PlatformDashboardSummaryValue | null;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage?: string | null;
  parentAccountName?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const accountType = account.type.toLowerCase();
  const isTikTok = accountType === 'tiktok';
  const showDetailedPosts = accountType === 'facebook' || accountType === 'instagram' || accountType === 'tiktok';
  const showSummarySaves = accountType === 'instagram';
  const accountInsights = summary?.accountInsights ?? null;
  const avatarUrl = getAccountAvatar(account, accountInsights);
  const displayName = getAccountDisplayName(account, accountInsights);
  const identity = getAccountIdentity(account, accountInsights);
  const fetchedPostCount = summary?.fetchedPostCount ?? 0;
  const postsBadgeLabel = 'Tracked Posts';
  const meta = PLATFORM_META[accountType as SupportedPlatform];
  const Icon = meta?.Icon;
 
  const stats = summary?.aggregatedStats;
  const usesReachAsAudienceMetric = shouldUseReachAsAudienceMetric(stats);
  const reachValue = usesReachAsAudienceMetric ? stats?.reach : stats?.views;
  const performanceBand = summary?.latestAnalysis?.performanceBand ?? 'N/A';
 
  return (
    <div className='group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d0f1a]/80 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/20'>
      {/* Collapsed Row — always single horizontal line */}
      <div className='flex items-center gap-4 p-5'>
        {/* Avatar */}
        <div className='relative shrink-0'>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className='size-11 rounded-full border border-white/10 object-cover'
            />
          ) : (
            <div className='flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-slate-300'>
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          {Icon && (
            <div className='absolute -bottom-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#0d0f1a] border border-white/10'>
              <Icon size={9} className={meta.accentClass} />
            </div>
          )}
        </div>

        {/* Name + handle */}
        <div className='min-w-0 shrink'>
          <div className='flex items-center gap-2'>
            <h3 className='truncate text-sm font-bold text-white/90'>{displayName}</h3>
            <div className='flex shrink-0 items-center rounded-full bg-emerald-500/10 px-1.5 py-px border border-emerald-500/20'>
              <span className='mr-1 size-1 rounded-full bg-emerald-400' />
              <span className='text-[8px] font-bold uppercase tracking-wider text-emerald-400'>Connected</span>
            </div>
          </div>
          <p className='truncate text-[11px] text-slate-500'>
            {parentAccountName && <span className='text-indigo-400/80'>{parentAccountName} · </span>}
            {identity.value}
          </p>
        </div>

        {/* Spacer */}
        <div className='flex-1' />

        {/* Inline metrics */}
        {summary && (
          <div className='hidden sm:flex items-center gap-5 text-center'>
            <div>
              <p className='text-[9px] font-bold uppercase tracking-widest text-slate-500'>Reach</p>
              <p className='font-mono text-xs font-bold text-white'>{formatNullableCompactNumber(reachValue)}</p>
            </div>
            <div className='h-5 w-px bg-white/10' />
            <div>
              <p className='text-[9px] font-bold uppercase tracking-widest text-slate-500'>Posts</p>
              <p className='font-mono text-xs font-bold text-white'>
                {summary.hasMorePosts ? `${fetchedPostCount}+` : fetchedPostCount}
              </p>
            </div>
            <div className='h-5 w-px bg-white/10' />
            <div>
              <p className='text-[9px] font-bold uppercase tracking-widest text-slate-500'>Health</p>
              <p className={cn(
                'text-[10px] font-bold uppercase',
                performanceBand.includes('HIGH') ? 'text-emerald-400' : performanceBand === 'N/A' ? 'text-slate-500' : 'text-indigo-400'
              )}>
                {performanceBand.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        )}

        {/* Expand button — always pinned right */}
        {summary && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className='flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white'
          >
            <ChevronDown className={cn('size-4 transition-transform duration-300', isExpanded && 'rotate-180')} />
          </button>
        )}

        {!summary && (isLoading || isRefreshing) && (
          <div className='flex items-center gap-3 animate-pulse'>
            <div className='h-6 w-16 rounded bg-white/5' />
            <div className='h-6 w-16 rounded bg-white/5' />
          </div>
        )}
      </div>

      {errorMessage && (
        <div className='mx-5 mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5'>
          <p className='text-xs font-medium text-red-400'>{errorMessage}</p>
        </div>
      )}

      {/* Expanded Detail View */}
      <div className={cn(
        'overflow-hidden transition-all duration-500 ease-in-out',
        isExpanded ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className='border-t border-white/5 px-6 py-6'>
          {/* Mobile-only metrics (show below on small screens) */}
          {summary && (
            <div className='mb-6 flex sm:hidden items-center gap-5'>
              <div>
                <p className='text-[9px] font-bold uppercase tracking-widest text-slate-500'>Reach</p>
                <p className='font-mono text-xs font-bold text-white'>{formatNullableCompactNumber(reachValue)}</p>
              </div>
              <div className='h-5 w-px bg-white/10' />
              <div>
                <p className='text-[9px] font-bold uppercase tracking-widest text-slate-500'>Posts</p>
                <p className='font-mono text-xs font-bold text-white'>
                  {summary.hasMorePosts ? `${fetchedPostCount}+` : fetchedPostCount}
                </p>
              </div>
              <div className='h-5 w-px bg-white/10' />
              <div>
                <p className='text-[9px] font-bold uppercase tracking-widest text-slate-500'>Health</p>
                <p className={cn(
                  'text-[10px] font-bold uppercase',
                  performanceBand.includes('HIGH') ? 'text-emerald-400' : performanceBand === 'N/A' ? 'text-slate-500' : 'text-indigo-400'
                )}>
                  {performanceBand.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          )}

          <div className='grid grid-cols-1 gap-8 xl:grid-cols-[1fr_320px]'>
            {/* Left column — detailed metrics + AI */}
            <div className='space-y-6'>
              <div>
                <p className='mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500'>Detailed Metrics</p>
                <SummaryStatsGrid stats={summary?.aggregatedStats || ({} as PlatformPostStats)} showSummarySaves={showSummarySaves} />
              </div>

              {summary?.latestAnalysis && (
                <div className='flex items-start gap-4 rounded-2xl border border-indigo-500/10 bg-indigo-500/[0.03] p-4'>
                  <div className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20'>
                    <Sparkles size={16} />
                  </div>
                  <div className='min-w-0'>
                    <p className='text-[10px] font-bold uppercase tracking-widest text-indigo-400/80'>
                      AI Analysis · {performanceBand.replace(/_/g, ' ')}
                    </p>
                    <p className='mt-1 text-xs leading-relaxed text-slate-300'>
                      {summary.latestAnalysis.highlights?.length > 0
                        ? summary.latestAnalysis.highlights[0]
                        : `Tracked engagement rate by views is ${summary.latestAnalysis.engagementRateByViews ?? 'N/A'}%.`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right column — recent posts */}
            {showDetailedPosts && summary && summary.posts.length > 0 && (
              <div className='xl:border-l xl:border-white/5 xl:pl-8'>
                <p className='mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500'>Recent Posts</p>
                <div className='space-y-2.5'>
                  {summary.posts.slice(0, 3).map((item) => {
                    const postStats = item.post.stats;
                    const postReach = shouldUseReachAsAudienceMetric(postStats) ? postStats?.reach : postStats?.views;
                    return (
                      <a
                        key={item.post.platformPostId}
                        href={item.post.permalink || '#'}
                        target='_blank'
                        rel='noreferrer'
                        className='group/post flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:bg-white/5 hover:border-white/10'
                      >
                        <div className='min-w-0 flex-1'>
                          <h4 className='truncate text-xs font-medium text-white/80 group-hover/post:text-white'>
                            {item.post.title || item.post.text || item.post.description || 'Untitled post'}
                          </h4>
                          <p className='mt-1 text-[10px] text-slate-500 font-mono'>
                            {formatNullableCompactNumber(postReach)} reach · {formatDate(item.post.publishedAt)}
                          </p>
                        </div>
                        <ArrowUpRight className='size-3.5 shrink-0 text-slate-600 group-hover/post:text-indigo-400' />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const queryClient = useQueryClient();

  // Fetch accounts client-side (non-blocking, shows loading state)
  const { data: socialMediasData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['dashboard-social-medias'],
    queryFn: () => fetchSocialMedias(),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000
  });

  const { data: facebookPagesData } = useQuery({
    queryKey: ['dashboard-facebook-pages'],
    queryFn: () => fetchFacebookPages(),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000
  });

  const accounts = mergeAccounts(
    socialMediasData?.value ?? [],
    facebookPagesData?.isSuccess ? (facebookPagesData.value ?? []) : null
  );

  const facebookAccounts = accounts.filter((a) => a.type?.toLowerCase() === 'facebook');
  const nonFacebookAccounts = accounts.filter((a) => a.type?.toLowerCase() !== 'facebook');
  const facebookIds = facebookAccounts.map((a) => a.id);

  // Single batch request for all Facebook pages
  const facebookBatchQuery = useQuery({
    queryKey: ['dashboard-facebook-batch', ...facebookIds],
    queryFn: () => fetchBatchDashboardSummary(facebookIds, DASHBOARD_POST_LIMIT),
    enabled: facebookIds.length > 0,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000
  });

  // Individual requests for non-Facebook platforms
  const nonFacebookQueries = useQueries({
    queries: nonFacebookAccounts.map((account) => ({
      queryKey: ['dashboard-account-summary', account.id],
      queryFn: () => fetchPlatformDashboardSummary(account.id, DASHBOARD_POST_LIMIT),
      staleTime: 5 * 60_000,
      gcTime: 10 * 60_000
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

  // Build Facebook summaries from batch response
  const facebookBatchSummaries = facebookBatchQuery.data?.value ?? [];
  const facebookSummaryMap = new Map(facebookBatchSummaries.map((s) => [s.socialMediaId, s] as const));

  // Merge into unified maps for all accounts
  const summariesByAccountId = new Map<string, (typeof facebookBatchSummaries)[number] | null>();
  const errorsByAccountId = new Map<string, string | null>();
  const loadingByAccountId = new Map<string, boolean>();
  const refreshingByAccountId = new Map<string, boolean>();

  for (const account of facebookAccounts) {
    summariesByAccountId.set(account.id, facebookSummaryMap.get(account.id) ?? null);
    errorsByAccountId.set(
      account.id,
      facebookBatchQuery.error instanceof Error ? facebookBatchQuery.error.message : null
    );
    loadingByAccountId.set(account.id, facebookBatchQuery.isPending);
    refreshingByAccountId.set(account.id, facebookBatchQuery.isFetching);
  }

  for (let i = 0; i < nonFacebookAccounts.length; i++) {
    const account = nonFacebookAccounts[i];
    const query = nonFacebookQueries[i];
    summariesByAccountId.set(account.id, query?.data?.value ?? null);
    errorsByAccountId.set(account.id, query?.error instanceof Error ? query.error.message : null);
    loadingByAccountId.set(account.id, query?.isPending ?? false);
    refreshingByAccountId.set(account.id, query?.isFetching ?? false);
  }

  const isRefreshing = facebookBatchQuery.isFetching || nonFacebookQueries.some((query) => query.isFetching);

  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['dashboard-social-medias'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard-facebook-pages'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard-facebook-batch'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard-account-summary'] });
  };

  return (
    <div className='space-y-8'>
      <section className='flex items-center justify-between overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8 relative'>
        <div className='absolute top-0 right-0 w-1/3 h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none' />
        <div className='flex items-center gap-4 relative z-10'>
          <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'>
            <BarChart3Icon className='h-7 w-7' />
          </div>

          <div className='space-y-1'>
            <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Analytics</h1>
            <p className='text-sm leading-relaxed text-slate-400'>
              Aggregated performance insights across your social footprint.
            </p>
          </div>
        </div>
        <Button
          variant='outline'
          size={'lg'}
          onClick={refreshAll}
          disabled={isRefreshing}
          className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white relative z-10'
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Sync Now
        </Button>
      </section>

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

          <div className='space-y-10'>
            {SUPPORTED_PLATFORMS.map((platform) => {
              const sectionAccounts = grouped[platform];
              if (sectionAccounts.length === 0) return null;

              const meta = PLATFORM_META[platform];
              const Icon = meta.Icon;
              const accountCount = sectionAccounts.length;
 
              return (
                <section key={platform} className='relative'>
                  <div className='mb-6 flex items-center gap-3'>
                    <div className='flex size-9 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.05] shadow-inner'>
                      <Icon size={18} className={meta.accentClass} />
                    </div>
                    <h2 className='text-lg font-bold tracking-tight text-white/90'>{meta.label}</h2>
                    <span className='ml-2 rounded-md bg-white/5 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500'>
                      {accountCount} {accountCount === 1 ? 'ACCOUNT' : 'ACCOUNTS'}
                    </span>
                  </div>
 
                  <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                    {sectionAccounts.map((account) => (
                      <AccountCard
                        key={account.id}
                        account={account}
                        summary={summariesByAccountId.get(account.id)}
                        isLoading={loadingByAccountId.get(account.id) ?? false}
                        isRefreshing={refreshingByAccountId.get(account.id) ?? false}
                        errorMessage={errorsByAccountId.get(account.id)}
                        parentAccountName={
                          platform === 'facebook'
                            ? (account.profile?.displayName || undefined)
                            : undefined
                        }
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
