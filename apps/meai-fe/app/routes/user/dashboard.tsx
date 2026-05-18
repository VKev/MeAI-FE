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
  ExternalLink,
  Info,
  ImageIcon,
  Trophy
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
    <div className='flex flex-wrap items-center gap-x-12 gap-y-6'>
      {metrics.map((metric, idx) => (
        <React.Fragment key={metric.label}>
          <div className='flex flex-col items-start gap-1'>
            <span className='font-mono text-3xl font-bold text-white tracking-tight leading-none'>
              {formatCompactNumber(metric.value)}
            </span>
            <span className='text-[10px] font-semibold text-slate-500 uppercase tracking-widest'>
              {metric.label}
            </span>
          </div>
          {idx < metrics.length - 1 && <div className='hidden lg:block h-8 w-px bg-white/5 self-center' />}
        </React.Fragment>
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
      <div className='group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04] min-h-[180px]'>
        <div>
          {/* Header: Platform & Status */}
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              {Icon && <Icon size={14} className={meta.accentClass} />}
              <span className='text-xs font-medium text-slate-300'>{meta.label}</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <div className='size-1.5 rounded-full bg-emerald-500' />
              <span className='text-[10px] font-bold uppercase tracking-wider text-emerald-500/90'>Connected</span>
            </div>
          </div>

          {/* Identity */}
          <div className='flex items-center gap-3 mb-5'>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className='size-10 rounded-full border border-white/10 object-cover'
              />
            ) : (
              <div className='flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-slate-300'>
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className='min-w-0 flex-1'>
              <h3 className='truncate text-sm font-bold text-white/90'>{displayName}</h3>
              <p className='truncate text-[11px] text-slate-500 font-mono'>
                {parentAccountName && <span className='text-indigo-400/80'>{parentAccountName} · </span>}
                {identity.value}
              </p>
            </div>
          </div>

          {/* Metrics */}
          {summary ? (
            <div className='flex flex-wrap items-center gap-x-4 gap-y-2 mb-5'>
              <div className='text-[11px] text-slate-400'>
                <span className='font-mono font-bold text-slate-200 mr-1'>{formatNullableCompactNumber(reachValue)}</span>
                Reach
              </div>
              <div className='text-[11px] text-slate-400'>
                <span className='font-mono font-bold text-slate-200 mr-1'>{summary.hasMorePosts ? `${fetchedPostCount}+` : fetchedPostCount}</span>
                Posts
              </div>
              {summary.latestAnalysis?.engagementRateByViews != null && (
                <div className='text-[11px] text-slate-400'>
                  <span className='font-mono font-bold text-slate-200 mr-1'>{summary.latestAnalysis.engagementRateByViews}%</span>
                  Eng.
                </div>
              )}
            </div>
          ) : (isLoading || isRefreshing) ? (
            <div className='flex flex-col gap-2 mb-5 animate-pulse'>
              <div className='h-3 w-24 rounded bg-white/5' />
              <div className='h-3 w-16 rounded bg-white/5' />
            </div>
          ) : null}

          {errorMessage && (
            <div className='mb-4 rounded border border-red-500/20 bg-red-500/10 px-3 py-2'>
              <p className='text-[10px] font-medium text-red-400 line-clamp-2'>{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Footer: Health & Expand */}
        {summary && (
          <div className='flex items-center justify-between pt-3 border-t border-white/5 mt-auto'>
            <div className={cn(
              'text-[10px] font-bold uppercase tracking-wider',
              performanceBand.includes('HIGH') ? 'text-emerald-400' : performanceBand === 'N/A' ? 'text-slate-500' : 'text-indigo-400'
            )}>
              {performanceBand.replace(/_/g, ' ')}
            </div>
            <DialogTrigger asChild>
              <button className='text-[11px] font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1'>
                Expand
              </button>
            </DialogTrigger>
          </div>
        )}
      </div>

      <DialogContent className='!max-w-5xl h-[85vh] border-white/5 bg-[#080910] p-0 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden sm:rounded-[32px] !flex !flex-col !gap-0 !justify-start !items-stretch'>
        <div className='border-b border-white/5 bg-[#0d0f1a]/40 px-6 h-16 flex items-center justify-between shrink-0'>
          <div className='flex items-center gap-4'>
            <div className='relative'>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className='size-9 rounded-xl border border-white/10 object-cover shadow-lg'
                />
              ) : (
                <div className='flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-bold text-slate-300'>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              {Icon && (
                <div className='absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0d0f1a] border border-white/10 shadow-md'>
                  <Icon size={9} className={meta.accentClass} />
                </div>
              )}
            </div>
            <div className='text-left'>
              <div className='flex items-center gap-2'>
                <DialogTitle className='text-lg font-semibold text-white tracking-tight leading-none'>
                  {displayName}
                </DialogTitle>
                <div className='flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 border border-emerald-500/20'>
                  <div className='size-1 rounded-full bg-emerald-500' />
                  <span className='text-[8px] font-bold uppercase tracking-wider text-emerald-400'>Live</span>
                </div>
              </div>
              <p className='text-[11px] text-slate-500 mt-1 leading-none'>
                {parentAccountName && <span className='text-indigo-400/80 font-medium'>{parentAccountName} · </span>}
                {identity.value}
              </p>
            </div>
          </div>
          <div className='hidden md:block text-right'>
            <p className='text-[8px] font-bold uppercase tracking-[0.15em] text-slate-600 mb-0.5'>Last Sync</p>
            <p className='text-[11px] font-medium text-slate-400 font-mono'>Just now</p>
          </div>
        </div>

        <div className='flex-1 overflow-hidden flex flex-col lg:flex-row'>
          {/* Left Panel: Analytics & Insights */}
          <div className='flex-1 overflow-y-auto custom-scrollbar p-6 pt-4 lg:p-8 lg:pt-6 border-r border-white/5'>
            <div className='space-y-10'>
              {/* Performance Section */}
              <section>
                <div className='flex items-center gap-2 mb-4 !mt-5 '>
                  <BarChart3 className='size-3.5 text-indigo-400' />
                  <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-400'>Performance</h3>
                </div>
                <div className='bg-white/[0.01] rounded-2xl border border-white/5 p-6 lg:p-7'>
                  <SummaryStatsGrid
                    stats={summary?.aggregatedStats || ({} as PlatformPostStats)}
                    showSummarySaves={showSummarySaves}
                    variant='detailed'
                    platform={accountType}
                  />
                </div>
              </section>

              {/* AI Insight Section */}
              <section>
                <div className='flex items-center gap-2 mb-5'>
                  <Sparkles className='size-3.5 text-pink-400' />
                  <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-400'>AI Insight</h3>
                </div>

                <div className='relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-6 lg:p-7'>
                  <div className='absolute top-0 right-0 p-4 opacity-5'>
                    <Sparkles size={60} className='text-white' />
                  </div>

                  {summary?.latestAnalysis ? (
                    <div className='relative space-y-5'>
                      <div className='flex items-center gap-3'>
                        <span className={cn(
                          'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all',
                          performanceBand.includes('HIGH')
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        )}>
                          {performanceBand.replace(/_/g, ' ')}
                        </span>
                        {summary.latestAnalysis.engagementRateByViews != null && (
                          <span className='text-xs font-medium text-slate-500'>
                            {summary.latestAnalysis.engagementRateByViews}% Efficiency
                          </span>
                        )}
                      </div>

                      <div className='space-y-4'>
                        <p className='text-base leading-relaxed text-slate-200 font-medium'>
                          {summary.latestAnalysis.highlights?.length > 0
                            ? summary.latestAnalysis.highlights[0]
                            : 'Generating account-specific performance models...'}
                        </p>

                        {summary.latestAnalysis.highlights?.length > 1 && (
                          <div className='grid grid-cols-1 gap-2 pt-2'>
                            {summary.latestAnalysis.highlights.slice(1).map((highlight, idx) => (
                              <div key={idx} className='flex items-start gap-3 text-xs text-slate-400 bg-white/2 rounded-xl p-2.5 border border-white/5'>
                                <Info className='size-3.5 text-slate-600 mt-0.5 shrink-0' />
                                <span className='leading-normal'>{highlight}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className='flex flex-col items-center justify-center py-8 text-center'>
                      <div className='size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-600 mb-3'>
                        <Sparkles size={20} />
                      </div>
                      <p className='text-xs font-medium text-slate-400'>Analysis in Progress</p>
                      <p className='text-[11px] text-slate-500 mt-1 max-w-[200px]'>
                        Not enough engagement data yet.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Right Panel: Recent Activity */}
          <div className='w-full lg:w-[380px] bg-black/20 overflow-y-auto custom-scrollbar flex flex-col shrink-0'>
            <div className='sticky top-0 z-10 bg-[#080910]/90 backdrop-blur-xl px-6 py-4 border-b border-white/5 flex items-center justify-between'>
              <h3 className='text-[11px] font-bold uppercase tracking-wider text-slate-500'>Recent Activity</h3>
              <button
                onClick={() => setShowAllPosts(!showAllPosts)}
                className='text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors'
              >
                {showAllPosts ? 'Collapse' : 'View all'}
              </button>
            </div>

            <div className='p-5 space-y-3'>
              {showDetailedPosts && summary && summary.posts.length > 0 ? (
                summary.posts.slice(0, showAllPosts ? undefined : 6).map((item) => {
                  const postStats = item.post.stats;
                  const postReach = shouldUseReachAsAudienceMetric(postStats) ? postStats?.reach : postStats?.views;
                  return (
                    <a
                      key={item.post.platformPostId}
                      href={item.post.permalink || '#'}
                      target='_blank'
                      rel='noreferrer'
                      className='group flex gap-3 rounded-xl border border-white/5 bg-white/[0.01] p-3 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.03] hover:translate-x-1'
                    >
                      <div className='relative size-14 shrink-0 overflow-hidden rounded-lg bg-white/5 border border-white/5'>
                        {item.post.thumbnailUrl ? (
                          <img
                            src={item.post.thumbnailUrl}
                            alt=''
                            className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-110'
                          />
                        ) : (
                          <div className='flex h-full w-full items-center justify-center text-slate-700'>
                            <ImageIcon size={16} />
                          </div>
                        )}
                      </div>
                      <div className='flex flex-col justify-between py-0.5 min-w-0'>
                        <h4 className='line-clamp-2 text-xs font-medium text-slate-300 group-hover:text-white transition-colors leading-snug'>
                          {item.post.title || item.post.text || item.post.description || 'Untitled Post'}
                        </h4>
                        <div className='flex items-center gap-2 text-[10px] text-slate-500 mt-1.5'>
                          <span className='font-mono font-bold text-indigo-400/80'>{formatNullableCompactNumber(postReach)} reach</span>
                          <span className='text-slate-800'>•</span>
                          <span>{formatDate(item.post.publishedAt)}</span>
                        </div>
                      </div>
                    </a>
                  );
                })
              ) : (
                <div className='flex flex-col items-center justify-center py-20 text-center opacity-40'>
                  <div className='size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-600 mb-3'>
                    <BarChart3Icon size={20} />
                  </div>
                  <p className='text-[10px] font-semibold uppercase tracking-widest text-slate-500'>No activity</p>
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

  const allRecentPosts = React.useMemo(() => {
    const allPosts = [];
    for (const account of accounts) {
      const summary = summariesByAccountId.get(account.id);
      if (summary && summary.posts) {
        for (const item of summary.posts) {
          const reach = item.post.stats?.reach ?? 0;
          const views = item.post.stats?.views ?? 0;
          const likes = item.post.stats?.likes ?? 0;
          const score = reach > 0 ? reach : views > 0 ? views : likes * 2;

          allPosts.push({
            ...item.post,
            accountType: account.type,
            accountName: getAccountDisplayName(account, summary.accountInsights),
            score,
          });
        }
      }
    }
    return allPosts.sort((a, b) => b.score - a.score).slice(0, 4);
  }, [accounts, summariesByAccountId]);

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

          {allRecentPosts.length > 0 && (
            <section className='relative'>
              <div className='mb-6 flex items-center gap-3'>
                <div className='flex size-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner'>
                  <Trophy size={18} className='text-indigo-400' />
                </div>
                <h2 className='text-lg font-bold tracking-tight text-white/90'>Top Performing Posts</h2>
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                {allRecentPosts.map((post) => {
                  const meta = PLATFORM_META[post.accountType.toLowerCase() as SupportedPlatform];
                  const Icon = meta?.Icon;

                  return (
                    <a
                      key={post.platformPostId}
                      href={post.permalink || '#'}
                      target='_blank'
                      rel='noreferrer'
                      className='group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04] hover:-translate-y-1'
                    >
                      <div className='flex items-center gap-2 mb-3'>
                        {Icon && <Icon size={12} className={meta.accentClass} />}
                        <span className='text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate'>{post.accountName}</span>
                      </div>

                      <div className='relative h-32 mb-3 w-full shrink-0 overflow-hidden rounded-xl bg-white/5 border border-white/5'>
                        {post.thumbnailUrl ? (
                          <img
                            src={post.thumbnailUrl}
                            alt=''
                            className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
                          />
                        ) : (
                          <div className='flex h-full w-full items-center justify-center text-slate-700'>
                            <ImageIcon size={24} />
                          </div>
                        )}
                      </div>

                      <div className='flex flex-col flex-1 min-w-0'>
                        <h4 className='line-clamp-2 text-xs font-medium text-slate-300 group-hover:text-white transition-colors leading-relaxed mb-2'>
                          {post.title || post.text || post.description || 'Untitled Post'}
                        </h4>

                        <div className='mt-auto flex flex-wrap items-center gap-3 pt-3 border-t border-white/5'>
                          {post.stats?.reach != null ? (
                            <div className='flex flex-col'>
                              <span className='text-[9px] font-bold uppercase tracking-widest text-slate-500'>Reach</span>
                              <span className='font-mono text-sm font-bold text-white'>{formatCompactNumber(post.stats.reach)}</span>
                            </div>
                          ) : post.stats?.views != null ? (
                            <div className='flex flex-col'>
                              <span className='text-[9px] font-bold uppercase tracking-widest text-slate-500'>Views</span>
                              <span className='font-mono text-sm font-bold text-white'>{formatCompactNumber(post.stats.views)}</span>
                            </div>
                          ) : null}

                          <div className='flex flex-col'>
                            <span className='text-[9px] font-bold uppercase tracking-widest text-slate-500'>Eng.</span>
                            <span className='font-mono text-xs font-bold text-emerald-400'>
                              {formatCompactNumber((post.stats?.likes || 0) + (post.stats?.comments || 0) + (post.stats?.shares || 0))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          )}

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

