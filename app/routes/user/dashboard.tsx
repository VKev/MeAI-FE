import {
  BarChart3,
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
  Users,
  ArrowUpRight,
  BarChart3Icon,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { FacebookIcon, InstagramIcon, ThreadsIcon, TiktokIcon } from '@/components/ui/icons/social-icons';
import { DashboardOverviewCharts } from '@/components/dashboard/overview-charts';
import type { PlatformAccountInsights, PlatformDashboardSummaryValue, PlatformPostStats } from '@/models/post.model';
import type { SocialMedia } from '@/models/social-media.model';
import { fetchBatchDashboardSummary, fetchPlatformDashboardSummary } from '@/services/client/post.client';
import { fetchFacebookPages, fetchSocialMedias } from '@/services/client/social-media.client';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';

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

function SummaryStatsGrid({
  stats,
  showSummarySaves,
  variant = 'compact',
  platform
}: {
  stats: PlatformPostStats;
  showSummarySaves: boolean;
  variant?: 'compact' | 'detailed';
  platform?: string;
}) {
  const usesReachAsAudienceMetric = shouldUseReachAsAudienceMetric(stats);
  const isTikTok = platform?.toLowerCase() === 'tiktok';

  const metrics = [
    {
      icon: usesReachAsAudienceMetric ? Users : BarChart3,
      label: usesReachAsAudienceMetric ? 'Reach' : 'Views',
      value: usesReachAsAudienceMetric ? stats.reach : stats.views,
      color: 'text-indigo-400'
    },
    {
      icon: Heart,
      label: 'Likes',
      value: stats.likes,
      color: 'text-pink-400'
    },
    { icon: MessageCircle, label: 'Comments', value: stats.comments, color: 'text-blue-400' },
    { icon: Share2, label: 'Shares', value: stats.shares, color: 'text-emerald-400' },
    ...(showSummarySaves ? [{ icon: Bookmark, label: 'Saves', value: stats.saves, color: 'text-amber-400' }] : [])
  ];

  if (variant === 'compact') {
    return (
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
        {metrics.map((metric) => (
          <div key={metric.label} className='flex items-center gap-[15px] rounded-xl bg-white/[0.02] border border-white/5 px-4 py-3'>
            <metric.icon className={cn('size-4', metric.color)} />
            <div className='flex flex-col leading-none'>
              <span className='text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1'>{metric.label}</span>
              <span className='font-mono text-xs font-bold text-white'>{formatCompactNumber(metric.value)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className='grid grid-cols-2 gap-5 sm:grid-cols-4'>
      {metrics.map((metric) => (
        <div key={metric.label} className='flex flex-col gap-3 rounded-2xl bg-white/[0.03] border border-white/5 p-5 transition-all hover:bg-white/[0.05] hover:border-white/10'>
          <div className='flex items-center gap-[15px]'>
            <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ml-[-10px]', metric.color)}>
              <metric.icon size={20} />
            </div>
            <span className='text-[10px] font-bold uppercase tracking-widest text-slate-500'>{metric.label}</span>
          </div>
          <span className='font-mono text-2xl font-bold text-white'>{formatCompactNumber(metric.value)}</span>
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
  const accountType = account.type.toLowerCase();
  const showDetailedPosts = accountType === 'facebook' || accountType === 'instagram' || accountType === 'tiktok';
  const showSummarySaves = accountType === 'instagram';
  const accountInsights = summary?.accountInsights ?? null;
  const avatarUrl = getAccountAvatar(account, accountInsights);
  const displayName = getAccountDisplayName(account, accountInsights);
  const identity = getAccountIdentity(account, accountInsights);
  const fetchedPostCount = summary?.fetchedPostCount ?? 0;
  const meta = PLATFORM_META[accountType as SupportedPlatform];
  const Icon = meta?.Icon;

  const stats = summary?.aggregatedStats;
  const usesReachAsAudienceMetric = shouldUseReachAsAudienceMetric(stats);
  const reachValue = usesReachAsAudienceMetric ? stats?.reach : stats?.views;
  const performanceBand = summary?.latestAnalysis?.performanceBand ?? 'N/A';
  const [showAllPosts, setShowAllPosts] = React.useState(false);

  return (
    <Dialog>
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
            <p className='truncate text-[11px] text-slate-500 font-mono'>
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

          {/* Dialog Trigger — replaces expand button */}
          {summary && (
            <DialogTrigger asChild>
              <button
                className='flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white'
              >
                <ChevronDown className='size-4 -rotate-90' />
              </button>
            </DialogTrigger>
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
      </div>

      {/* Expanded Modal Content */}
      <DialogContent className='!max-w-6xl h-[90vh] border-white/10 bg-[#0a0c16] p-0 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden sm:rounded-[28px] flex flex-col gap-0'>
        <DialogHeader className='border-b border-white/5 px-8 py-6 shrink-0'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-5'>
              <div className='relative'>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className='size-14 rounded-2xl border border-white/10 object-cover'
                  />
                ) : (
                  <div className='flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg font-bold text-slate-300'>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className='absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#0a0c16] border border-white/10'>
                  {Icon && <Icon size={12} className={meta.accentClass} />}
                </div>
              </div>
              <div className='text-left'>
                <DialogTitle className='text-xl font-bold text-white'>{displayName}</DialogTitle>
                <p className='text-xs text-slate-500 font-mono mt-1'>
                  {parentAccountName && <span>{parentAccountName} · </span>}
                  {identity.value}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className='flex flex-col lg:flex-row overflow-hidden flex-1 min-h-0'>
          {/* Left panel — Metrics & AI */}
          <div className='flex-1 overflow-y-auto p-8 lg:p-10 custom-scrollbar'>
            <div className='space-y-10'>
              {/* Detailed Metrics */}
              <div>
                <p className='mb-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500'>Operational Performance</p>
                <SummaryStatsGrid
                  stats={summary?.aggregatedStats || ({} as PlatformPostStats)}
                  showSummarySaves={showSummarySaves}
                  variant='detailed'
                  platform={accountType}
                />
              </div>

              {/* AI Intelligence */}
              <div className='space-y-5'>
                <p className='text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500'>AI Intelligence Analysis</p>
                {summary?.latestAnalysis ? (
                  <div className='relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.02] p-8 shadow-[0_0_50px_-12px_rgba(99,102,241,0.15)]'>
                    <div className='absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent' />
                    <div className='flex items-center gap-3 mb-5'>
                      <div className='flex size-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400'>
                        <Sparkles size={20} />
                      </div>
                      <span className={cn(
                        'text-xs font-bold uppercase tracking-[0.1em]',
                        performanceBand.includes('HIGH') ? 'text-emerald-400' : 'text-indigo-400'
                      )}>
                        {performanceBand.replace(/_/g, ' ')} Performance
                      </span>
                    </div>
                    <p className='text-sm leading-relaxed text-slate-300'>
                      {summary.latestAnalysis.highlights?.length > 0
                        ? summary.latestAnalysis.highlights[0]
                        : `Tracked engagement rate by views is ${summary.latestAnalysis.engagementRateByViews ?? 'N/A'}%.`}
                    </p>
                    {summary.latestAnalysis.highlights?.length > 1 && (
                      <ul className='mt-6 space-y-3 border-t border-white/5 pt-6'>
                        {summary.latestAnalysis.highlights.slice(1).map((highlight, idx) => (
                          <li key={idx} className='flex items-start gap-3 text-xs leading-relaxed text-slate-400'>
                            <span className='mt-1.5 size-1.5 shrink-0 rounded-full bg-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.4)]' />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] py-14 text-center'>
                    <div className='mb-4 flex size-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400/50'>
                      <Sparkles size={24} />
                    </div>
                    <p className='text-xs uppercase font-bold tracking-widest text-slate-400'>AI Analysis Pending</p>
                    <p className='mt-2 text-xs text-slate-600 max-w-[240px] leading-relaxed'>
                      Sync more posts to allow our AI to generate deeper performance insights.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar — Recent Activity */}
          <div className='w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-white/5 bg-white/[0.01] overflow-y-auto custom-scrollbar shrink-0'>
            <div className='sticky top-0 z-10 bg-[#0a0c16] px-8 pt-8 lg:px-10 lg:pt-10 pb-4 flex items-center justify-between'>
              <p className='text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500'>Recent Activity</p>
              <button
                onClick={() => setShowAllPosts(!showAllPosts)}
                className='text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors'
              >
                {showAllPosts ? 'Show Less' : 'View All'}
              </button>
            </div>

            <div className='px-8 pb-8 lg:px-10 lg:pb-10'>
              {showDetailedPosts && summary && summary.posts.length > 0 ? (
                <div className='space-y-4'>
                  {summary.posts.slice(0, showAllPosts ? undefined : 5).map((item) => {
                    const postStats = item.post.stats;
                    const postReach = shouldUseReachAsAudienceMetric(postStats) ? postStats?.reach : postStats?.views;
                    return (
                      <a
                        key={item.post.platformPostId}
                        href={item.post.permalink || '#'}
                        target='_blank'
                        rel='noreferrer'
                        className='group/post flex flex-col gap-3 rounded-2xl border border-white/5 bg-[#0d0f1a] p-5 transition-all hover:border-white/20 hover:bg-white/[0.03]'
                      >
                        <h4 className='line-clamp-2 text-xs font-medium leading-relaxed text-white/80 group-hover/post:text-white'>
                          {item.post.title || item.post.text || item.post.description || 'Untitled Post'}
                        </h4>
                        <div className='flex items-center justify-between mt-1'>
                          <div className='flex items-center gap-3 text-[10px] text-slate-500 font-mono'>
                            <span>{formatNullableCompactNumber(postReach)} reach</span>
                            <span>·</span>
                            <span>{formatDate(item.post.publishedAt)}</span>
                          </div>
                          <ExternalLink size={12} className='text-slate-600 group-hover/post:text-indigo-400 transition-colors' />
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] py-16 text-center'>
                  <div className='mb-4 flex size-12 items-center justify-center rounded-full bg-white/5 text-slate-500'>
                    <BarChart3Icon size={24} />
                  </div>
                  <p className='text-xs uppercase font-bold tracking-widest text-slate-400'>No recent activity</p>
                  <p className='mt-2 text-xs text-slate-600'>Active posts will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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

