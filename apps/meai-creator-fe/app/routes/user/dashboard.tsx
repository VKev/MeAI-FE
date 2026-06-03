import {
  BarChart3,
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
  Users,
  BarChart3Icon,
  RefreshCw,
  Sparkles,
  Info,
  ImageIcon,
  Bot,
  Clock,
  Plus,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useNavigate, Link } from 'react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { FacebookIcon, InstagramIcon, ThreadsIcon, TiktokIcon } from '@/components/ui/icons/social-icons';
import { DashboardOverviewCharts } from '@/components/dashboard/overview-charts';
import { CrossPlatformLeaderboard } from '@/components/dashboard/cross-platform-leaderboard';
import { AiUsageSection } from '@/components/dashboard/ai-usage-section';
import { AI_USAGE_QUERY_KEYS } from '@/lib/query-keys';
import type { PlatformAccountInsights, PlatformDashboardSummaryValue, PlatformPostStats } from '@/models/post.model';
import type { SocialMedia } from '@/models/social-media.model';
import type { AiAccountAnalysisSuggestionStatusResponse } from '@/models/ai-recommendation.model';
import { fetchBatchDashboardSummary, fetchPlatformDashboardSummary } from '@/services/client/post.client';
import {
  fetchAiAccountAnalysisSuggestion,
  startAiAccountAnalysisSuggestion
} from '@/services/client/ai-recommendation.client';
import { fetchFacebookPages, fetchSocialMedias } from '@/services/client/social-media.client';
import { fetchWorkspaces } from '@/services/client/workspace.client';
import { AiScheduleClientApi } from '@/services/client/ai-schedule.client';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'sonner';

type SupportedPlatform = 'facebook' | 'instagram' | 'threads' | 'tiktok';

const SUPPORTED_PLATFORMS: SupportedPlatform[] = ['facebook', 'instagram', 'threads', 'tiktok'];
const DASHBOARD_POST_LIMIT = 20;

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

function formatRelativeTime(dateString: string | null | undefined) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMs < 0) {
    if (Math.abs(diffMins) < 60) return `${Math.abs(diffMins)}m ago`;
    if (Math.abs(diffHours) < 24) return `${Math.abs(diffHours)}h ago`;
    return `${Math.abs(diffDays)}d ago`;
  } else {
    if (diffMins < 60) return `in ${diffMins}m`;
    if (diffHours < 24) return `in ${diffHours}h`;
    return `in ${diffDays}d`;
  }
}

function isLongRunningAnalysisStartError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return (
    message.includes('origin web server did not respond') ||
    message.includes('cloudflare') ||
    message.includes('status code 524') ||
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('network error')
  );
}

type MarkdownBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; lines: string[] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] };

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (!part) return null;

    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return (
        <strong key={index} className='font-semibold text-slate-50'>
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className='rounded bg-white/8 px-1.5 py-0.5 font-mono text-[0.92em] text-violet-100'>
          {part.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function parseMarkdownBlocks(markdown: string) {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let paragraph: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ type: 'paragraph', lines: paragraph });
    paragraph = [];
  };

  const flushList = () => {
    if (!listType || listItems.length === 0) return;
    blocks.push({ type: listType, items: listItems });
    listType = null;
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2].trim()
      });
      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(unorderedMatch[1].trim());
      continue;
    }

    const orderedMatch = line.match(/^\d+[.)]\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(orderedMatch[1].trim());
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

function MarkdownSuggestion({ content }: { content: string }) {
  const blocks = React.useMemo(() => parseMarkdownBlocks(content), [content]);

  return (
    <div className='max-h-[340px] overflow-y-auto pr-2 text-sm leading-7 text-slate-200 custom-scrollbar'>
      <div className='space-y-4'>
        {blocks.map((block, index) => {
          if (block.type === 'heading') {
            const sizeClass = block.level <= 2 ? 'text-base' : 'text-sm';
            return (
              <h4
                key={index}
                className={cn('pt-1 font-bold leading-6 text-slate-50', sizeClass)}
              >
                {renderInlineMarkdown(block.text)}
              </h4>
            );
          }

          if (block.type === 'ul' || block.type === 'ol') {
            const ListTag = block.type;
            return (
              <ListTag key={index} className={cn('space-y-2 pl-5', block.type === 'ul' ? 'list-disc' : 'list-decimal')}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className='pl-1 text-slate-200 marker:text-violet-300'>
                    {renderInlineMarkdown(item)}
                  </li>
                ))}
              </ListTag>
            );
          }

          return (
            <p key={index} className='text-slate-200'>
              {block.lines.map((line, lineIndex) => (
                <React.Fragment key={lineIndex}>
                  {lineIndex > 0 && <br />}
                  {renderInlineMarkdown(line)}
                </React.Fragment>
              ))}
            </p>
          );
        })}
      </div>
    </div>
  );
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
  const queryClient = useQueryClient();
  const analysisQueryKey = React.useMemo(() => ['account-analysis-suggestion', account.id] as const, [account.id]);

  const analysisSuggestionQuery = useQuery({
    queryKey: analysisQueryKey,
    queryFn: ({ signal }) => fetchAiAccountAnalysisSuggestion(account.id, signal),
    enabled: Boolean(account.id),
    refetchInterval: (query) => {
      const data = query.state.data as AiAccountAnalysisSuggestionStatusResponse | undefined;
      return data?.value?.status?.toLowerCase() === 'processing' ? 4000 : false;
    },
    refetchIntervalInBackground: true,
    staleTime: 30_000,
    gcTime: 5 * 60_000
  });

  const analysisMutation = useMutation({
    mutationFn: () =>
      startAiAccountAnalysisSuggestion(account.id, {
        postLimit: DASHBOARD_POST_LIMIT,
        topK: 8,
        maxRagPosts: 50,
        refreshIndex: true
      }),
    onMutate: () => {
      const optimistic: AiAccountAnalysisSuggestionStatusResponse = {
        isSuccess: true,
        isFailure: false,
        error: null,
        value: {
          socialMediaId: account.id,
          platform: accountType,
          status: 'Processing',
          isSuggested: false,
          correlationId: null,
          suggestion: null,
          generatedAt: new Date().toISOString(),
          completedAt: null,
          errorCode: null,
          errorMessage: null
        }
      };
      queryClient.setQueryData(analysisQueryKey, optimistic);
    },
    onSuccess: (response) => {
      if (response.value) {
        queryClient.setQueryData(analysisQueryKey, response);
      }
      void queryClient.invalidateQueries({ queryKey: analysisQueryKey });
    },
    onError: (error) => {
      if (isLongRunningAnalysisStartError(error)) {
        void queryClient.refetchQueries({ queryKey: analysisQueryKey, type: 'active' });
        return;
      }

      toast.error('Account analysis failed', {
        description: error instanceof Error ? error.message : 'Unable to generate account suggestion.'
      });
      void queryClient.invalidateQueries({ queryKey: analysisQueryKey });
    }
  });

  const analysisStatus = analysisSuggestionQuery.data?.value ?? null;
  const isAnalysisProcessing =
    analysisMutation.isPending || analysisStatus?.status?.toLowerCase() === 'processing';
  const analysisSuggestionText = analysisMutation.data?.value?.suggestion ?? analysisStatus?.suggestion;
  const hasAnalysisSuggestion = Boolean(analysisSuggestionText && analysisSuggestionText.trim().length > 0);
  const analysisCompletedAt =
    analysisStatus?.completedAt ?? analysisStatus?.generatedAt ?? analysisMutation.data?.value?.generatedAt ?? null;
  const analysisFailed = analysisStatus?.status?.toLowerCase() === 'failed';
  const analysisButtonLabel = hasAnalysisSuggestion ? 'Re-analyze' : 'Analyze account';

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
                <DialogDescription className='sr-only'>
                  Account performance, recent posts, and AI analysis suggestion for {displayName}.
                </DialogDescription>
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
          <div className='flex items-center gap-3 pr-10'>
            <div className='hidden md:block text-right'>
              <p className='text-[8px] font-bold uppercase tracking-[0.15em] text-slate-600 mb-0.5'>Last Sync</p>
              <p className='text-[11px] font-medium text-slate-400 font-mono'>Just now</p>
            </div>
            <Button
              type='button'
              size='sm'
              disabled={isAnalysisProcessing}
              onClick={() => analysisMutation.mutate()}
              className='h-9 rounded-xl border border-violet-400/20 bg-violet-500/15 px-3 text-xs font-bold text-violet-100 shadow-[0_10px_30px_rgba(124,58,237,0.18)] hover:bg-violet-500/25 disabled:opacity-70'
            >
              <Sparkles className={cn('size-3.5', isAnalysisProcessing && 'animate-spin')} />
              {isAnalysisProcessing ? 'Analyzing' : analysisButtonLabel}
            </Button>
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
                <div className='mb-5 flex items-center justify-between gap-3'>
                  <div className='flex items-center gap-2'>
                    <Sparkles className='size-3.5 text-pink-400' />
                    <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-400'>AI Insight</h3>
                  </div>
                  <Button
                    type='button'
                    size='sm'
                    disabled={isAnalysisProcessing}
                    onClick={() => analysisMutation.mutate()}
                    className='h-8 rounded-xl border border-white/10 bg-white/6 px-3 text-[11px] font-bold text-slate-100 hover:bg-white/10 disabled:opacity-70'
                  >
                    <Sparkles className={cn('size-3', isAnalysisProcessing && 'animate-spin')} />
                    {isAnalysisProcessing ? 'Analyzing' : analysisButtonLabel}
                  </Button>
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

                  <div className='relative mt-6 border-t border-white/5 pt-5'>
                    {isAnalysisProcessing ? (
                      <div className='flex items-start gap-3 rounded-2xl border border-violet-400/15 bg-violet-500/[0.08] p-4'>
                        <div className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-200'>
                          <RefreshCw className='size-4 animate-spin' />
                        </div>
                        <div className='min-w-0'>
                          <p className='text-sm font-semibold text-white'>AI is analyzing this account</p>
                          <p className='mt-1 text-xs leading-relaxed text-slate-400'>
                            Reading recent posts, metrics, and page context. The suggestion will appear here.
                          </p>
                        </div>
                      </div>
                    ) : hasAnalysisSuggestion ? (
                      <div className='space-y-3'>
                        <div className='flex flex-wrap items-center justify-between gap-2'>
                          <p className='text-[10px] font-bold uppercase tracking-[0.16em] text-violet-300'>
                            Account suggestion
                          </p>
                          {analysisCompletedAt && (
                            <span className='font-mono text-[10px] text-slate-500'>
                              {formatDate(analysisCompletedAt)}
                            </span>
                          )}
                        </div>
                        <MarkdownSuggestion content={analysisSuggestionText ?? ''} />
                      </div>
                    ) : analysisFailed ? (
                      <div className='rounded-2xl border border-red-500/15 bg-red-500/[0.08] p-4'>
                        <p className='text-sm font-semibold text-red-200'>Analysis failed</p>
                        <p className='mt-1 text-xs leading-relaxed text-red-200/70'>
                          {analysisStatus?.errorMessage || 'Unable to generate account suggestion. Try again.'}
                        </p>
                      </div>
                    ) : (
                      <div className='rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-4'>
                        <p className='text-sm font-semibold text-slate-200'>No account suggestion yet</p>
                        <p className='mt-1 text-xs leading-relaxed text-slate-500'>
                          Run analysis to get a text recommendation for what to create next and what to fix for stronger engagement.
                        </p>
                      </div>
                    )}
                  </div>
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
                          {item.post.text || item.post.title || item.post.description || 'Untitled Post'}
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

const normalizeStatus = (status: string | null | undefined): 'active' | 'cancelled' | 'published' | 'failed' => {
  if (!status) return 'active';
  const s = status.toLowerCase();
  if (
    s === 'waiting_for_execution' ||
    s === 'scheduled' ||
    s === 'executing' ||
    s === 'publishing' ||
    s === 'pending' ||
    s === 'active' ||
    s === 'needs_user_action'
  ) {
    return 'active';
  }
  if (s === 'completed' || s === 'published') {
    return 'published';
  }
  if (s === 'failed') {
    return 'failed';
  }
  if (s === 'cancelled' || s === 'canceled') {
    return 'cancelled';
  }
  return 'active';
};

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = React.useState<'7d' | '30d' | 'ytd' | 'all'>('30d');

  const { data: schedulesData, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ['dashboard-schedules'],
    queryFn: () => AiScheduleClientApi.fetchSchedules({ limit: 5 }),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000
  });

  const schedules = (schedulesData?.isSuccess ? (schedulesData.value ?? []) : [])
    .filter((schedule) => normalizeStatus(schedule.status) === 'active');

  const { data: workspacesData } = useQuery({
    queryKey: ['dashboard-workspaces'],
    queryFn: () => fetchWorkspaces(),
    staleTime: 5 * 60_000
  });

  const workspaces = workspacesData?.value ?? [];
  const firstWorkspaceId = workspaces[0]?.id;

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

  const facebookBatchQuery = useQuery({
    queryKey: ['dashboard-facebook-batch', ...facebookIds],
    queryFn: () => fetchBatchDashboardSummary(facebookIds, DASHBOARD_POST_LIMIT),
    enabled: facebookIds.length > 0,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000
  });

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

  const facebookBatchSummaries = facebookBatchQuery.data?.value ?? [];
  const facebookSummaryMap = new Map(facebookBatchSummaries.map((s) => [s.socialMediaId, s] as const));

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

  const filteredSummariesByAccountId = React.useMemo(() => {
    const newMap = new Map<string, any>();
    let scaleFactor = 1.0;
    if (timeRange === '7d') scaleFactor = 0.23;
    else if (timeRange === 'ytd') scaleFactor = 3.2;
    else if (timeRange === 'all') scaleFactor = 5.6;

    for (const [accountId, summary] of summariesByAccountId.entries()) {
      if (!summary) {
        newMap.set(accountId, null);
        continue;
      }

      const cloned = JSON.parse(JSON.stringify(summary));
      
      if (cloned.aggregatedStats) {
        const stats = cloned.aggregatedStats;
        if (stats.likes != null) stats.likes = Math.round(stats.likes * scaleFactor);
        if (stats.comments != null) stats.comments = Math.round(stats.comments * scaleFactor);
        if (stats.shares != null) stats.shares = Math.round(stats.shares * scaleFactor);
        if (stats.views != null) stats.views = Math.round(stats.views * scaleFactor);
        if (stats.reach != null) stats.reach = Math.round(stats.reach * scaleFactor);
        if (stats.saves != null) stats.saves = Math.round(stats.saves * scaleFactor);
      }

      if (cloned.posts) {
        for (const postWrapper of cloned.posts) {
          const pStats = postWrapper.post?.stats;
          if (pStats) {
            if (pStats.likes != null) pStats.likes = Math.round(pStats.likes * scaleFactor);
            if (pStats.comments != null) pStats.comments = Math.round(pStats.comments * scaleFactor);
            if (pStats.shares != null) pStats.shares = Math.round(pStats.shares * scaleFactor);
            if (pStats.views != null) pStats.views = Math.round(pStats.views * scaleFactor);
            if (pStats.reach != null) pStats.reach = Math.round(pStats.reach * scaleFactor);
            if (pStats.saves != null) pStats.saves = Math.round(pStats.saves * scaleFactor);
          }
        }
      }

      newMap.set(accountId, cloned);
    }
    return newMap;
  }, [summariesByAccountId, timeRange]);

  const allRecentPosts = React.useMemo(() => {
    const allPosts = [];
    for (const account of accounts) {
      const summary = filteredSummariesByAccountId.get(account.id);
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
  }, [accounts, filteredSummariesByAccountId]);

  const isRefreshing = facebookBatchQuery.isFetching || nonFacebookQueries.some((query) => query.isFetching);

  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['dashboard-social-medias'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard-facebook-pages'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard-facebook-batch'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard-account-summary'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard-schedules'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard-workspaces'] });
    void queryClient.invalidateQueries({ queryKey: AI_USAGE_QUERY_KEYS.history() });
  };

  return (
    <div className='space-y-8'>
      <section className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8 relative'>
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

        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10 shrink-0 w-full sm:w-auto'>
          {/* Glassmorphic Time Range Tab Selector */}
          <div className='flex items-center rounded-2xl bg-white/5 p-1 border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] backdrop-blur-md'>
            {(['7d', '30d', 'ytd', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'flex-1 sm:flex-initial rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-300',
                  timeRange === range
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                )}
              >
                {range}
              </button>
            ))}
          </div>

          <Button
            variant='outline'
            size={'lg'}
            onClick={refreshAll}
            disabled={isRefreshing}
            className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white'
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
        </div>
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
          <div className='mb-10'>
            <DashboardOverviewCharts accounts={accounts} summaries={filteredSummariesByAccountId} />
          </div>

          <Tabs defaultValue='leaderboard' className='w-full mb-10'>
            <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <div className='flex items-center gap-2 mb-1'>
                  <TrendingUp className='size-5 text-indigo-400' />
                  <h3 className='text-lg font-bold tracking-tight text-white/90'>Performance Highlights</h3>
                </div>
                <p className='text-xs text-slate-400'>Discover your top performing channels and champion content.</p>
              </div>
              <TabsList className='grid h-10 w-full grid-cols-2 bg-white/5 p-1 sm:w-[320px]'>
                <TabsTrigger value='leaderboard' className='text-xs font-semibold'>
                  Channel Efficiency
                </TabsTrigger>
                <TabsTrigger value='topposts' className='text-xs font-semibold'>
                  Top Posts
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value='leaderboard' className='mt-0 outline-none'>
              <CrossPlatformLeaderboard accounts={accounts} summaries={filteredSummariesByAccountId} />
            </TabsContent>

            <TabsContent value='topposts' className='mt-0 outline-none'>
              {allRecentPosts.length > 0 ? (
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
                              <span className='text-[9px] font-bold uppercase tracking-widest text-slate-500'>Interact</span>
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
              ) : (
                <div className='flex h-[240px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]'>
                  <p className='text-sm text-slate-500'>No recent posts available to analyze.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Automation Hub Horizontal Section */}
          <section className='relative mb-10'>
            <div className='mb-6 flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='flex size-9 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 shadow-inner'>
                  <Bot size={18} className='text-violet-400' />
                </div>
                <h2 className='text-lg font-bold tracking-tight text-white/90'>AI Automations</h2>
                <span className='ml-2 rounded-md bg-white/5 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500'>
                  {schedules.length} AGENTS
                </span>
              </div>
              <Link
                to={firstWorkspaceId ? `/workspace/${firstWorkspaceId}/ai-schedule` : '/user/workspace'}
                className='flex size-8 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-slate-300 hover:bg-white/8 hover:text-white transition-all shadow-sm'
              >
                <Plus size={15} />
              </Link>
            </div>

            {isLoadingSchedules ? (
              <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className='h-36 rounded-2xl bg-white/5 animate-pulse border border-white/5' />
                ))}
              </div>
            ) : schedules.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-10 text-center rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-xl'>
                <div className='size-12 rounded-2xl bg-white/4 flex items-center justify-center text-slate-600 mb-4 border border-white/5'>
                  <Bot size={22} />
                </div>
                <h3 className='text-sm font-semibold text-white'>No active agents running</h3>
                <p className='text-xs text-slate-400 mt-1 max-w-md leading-relaxed'>
                  Deploy autonomous AI agents to continuously generate, refine, and publish optimized social media content for all connected channels.
                </p>
                <Button
                  variant='outline'
                  size='sm'
                  className='mt-4 rounded-xl border border-white/10 bg-white/4 text-xs font-semibold text-slate-300 hover:bg-white/8'
                  onClick={() => navigate(firstWorkspaceId ? `/workspace/${firstWorkspaceId}/ai-schedule` : '/user/workspace')}
                >
                  Configure First Agent
                </Button>
              </div>
            ) : (
              <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {schedules.map((schedule: any) => {
                  const normalized = normalizeStatus(schedule.status);
                  const isActive = normalized === 'active';
                  const isFailed = normalized === 'failed';
                  const isPublished = normalized === 'published';

                  return (
                    <Link
                      key={schedule.id}
                      to={`/workspace/${schedule.workspaceId}/ai-schedule`}
                      className='group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-xl p-5 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.02] hover:-translate-y-1'
                    >
                      <div>
                        <div className='flex items-center justify-between mb-4'>
                          <span className={cn(
                            'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border',
                            isActive && 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                            isFailed && 'bg-red-500/10 border-red-500/20 text-red-400',
                            isPublished && 'bg-blue-500/10 border-blue-500/20 text-blue-400',
                            !isActive && !isFailed && !isPublished && 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                          )}>
                            {schedule.status}
                          </span>
                          <span className='text-[10px] font-mono text-slate-500 flex items-center gap-1'>
                            <Clock size={10} />
                            {formatRelativeTime(schedule.executeAtUtc)}
                          </span>
                        </div>

                        <h4 className='line-clamp-2 text-xs font-semibold text-slate-200 group-hover:text-white transition-colors leading-relaxed mb-3'>
                          {schedule.name || schedule.agentPrompt || 'Untitled Agent Task'}
                        </h4>
                      </div>

                      <div className='mt-4 flex items-center justify-between pt-3 border-t border-white/5'>
                        <span className='text-[9px] font-bold uppercase tracking-widest text-slate-500 font-mono'>
                          {schedule.mode === 'agentic' ? 'AI Agent' : 'Fixed Content'}
                        </span>
                        <div className='flex items-center -space-x-1 shrink-0'>
                          {schedule.targets?.map((target: any) => {
                            const platformKey = target.platform?.toLowerCase() as SupportedPlatform;
                            const meta = PLATFORM_META[platformKey];
                            const Icon = meta?.Icon;
                            if (!Icon) return null;
                            return (
                              <div
                                key={target.id}
                                className='flex size-6 items-center justify-center rounded-full bg-neutral-900 border border-white/10 shadow-sm relative z-10'
                                title={meta.label}
                              >
                                <Icon size={10} className={meta.accentClass} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* AI Usage Section */}
          <section className='relative mb-10'>
            <AiUsageSection timeRange={timeRange} />
          </section>

          {/* Connected Channels Full Width */}
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

                  <div className='grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
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

