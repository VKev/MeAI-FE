import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FacebookIcon, InstagramIcon, ThreadsIcon, TiktokIcon } from '@/components/ui/icons/social-icons';
import { cn } from '@/lib/utils';
import type { Post, PostMedia, PlatformPostAnalyticsValue, PostAnalysis } from '@/models/post.model';
import { ArrowLeft, ExternalLink, FileImage, RefreshCcw } from 'lucide-react';

type PostDetailViewProps = {
  post: Post | null;
  analyticsMap: Record<string, PlatformPostAnalyticsValue>;
  isLoadingPost: boolean;
  isLoadingAnalytics: boolean;
  onBack: () => void;
  onRefreshAnalytics?: (socialMediaId: string, platformPostId: string) => void;
};

function formatDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', { dateStyle: 'long', timeStyle: 'short' }).format(date);
}

function formatShortDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString();
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(1)}%`;
}

function shouldUseReachAsAudienceMetric(stats: { views?: number | null; reach?: number | null } | null | undefined) {
  return stats?.reach != null && (stats.views == null || stats.views === stats.reach);
}

function getPlatformIcon(platform: string | null) {
  switch (platform?.toLowerCase()) {
    case 'facebook':
      return FacebookIcon;
    case 'instagram':
      return InstagramIcon;
    case 'threads':
      return ThreadsIcon;
    case 'tiktok':
      return TiktokIcon;
    default:
      return null;
  }
}

function getPlatformAccent(platform: string | null) {
  switch (platform?.toLowerCase()) {
    case 'facebook':
      return {
        ring: 'ring-blue-500/20',
        indicator: 'bg-blue-500',
        text: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20'
      };
    case 'instagram':
      return {
        ring: 'ring-pink-500/20',
        indicator: 'bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600',
        text: 'text-pink-400',
        bg: 'bg-pink-500/10',
        border: 'border-pink-500/20'
      };
    case 'threads':
      return {
        ring: 'ring-white/10',
        indicator: 'bg-white',
        text: 'text-white',
        bg: 'bg-white/10',
        border: 'border-white/20'
      };
    case 'tiktok':
      return {
        ring: 'ring-cyan-500/20',
        indicator: 'bg-cyan-500',
        text: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/20'
      };
    default:
      return {
        ring: 'ring-violet-500/20',
        indicator: 'bg-violet-500',
        text: 'text-violet-400',
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/20'
      };
  }
}

function formatPlatformName(platform: string | null) {
  if (!platform) return '';
  const lower = platform.toLowerCase();
  if (lower === 'tiktok') return 'TikTok';
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function getMediaType(media: PostMedia) {
  const resourceType = media.resourceType?.toLowerCase();
  const contentType = media.contentType?.toLowerCase() ?? '';
  if (resourceType === 'video' || contentType.startsWith('video/')) return 'video';
  return 'image';
}

function getPerformanceLevel(band: string | null): { label: string; level: number; color: string } {
  switch (band?.toLowerCase()) {
    case 'excellent':
      return { label: 'Excellent', level: 5, color: 'text-emerald-400' };
    case 'good':
      return { label: 'Good', level: 4, color: 'text-blue-400' };
    case 'average':
      return { label: 'Average', level: 3, color: 'text-amber-400' };
    case 'below average':
      return { label: 'Below Avg', level: 2, color: 'text-orange-400' };
    case 'poor':
      return { label: 'Poor', level: 1, color: 'text-red-400' };
    default:
      return { label: 'N/A', level: 0, color: 'text-slate-500' };
  }
}

function MetricTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className='group relative flex flex-col gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.1] hover:bg-white/[0.04]'>
      <div className={cn('absolute left-0 top-0 h-full w-[3px] rounded-l-xl', accent)} />
      <span className='text-[10px] uppercase tracking-widest text-slate-500'>{label}</span>
      <span className='text-xl font-semibold tracking-tight text-white'>{value}</span>
    </div>
  );
}

function RateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-center justify-between border-b border-white/[0.04] py-2.5 last:border-b-0'>
      <span className='text-[13px] text-slate-400'>{label}</span>
      <span className='text-[13px] font-medium text-white'>{value}</span>
    </div>
  );
}

function PerformanceBar({ level, color }: { level: number; color: string }) {
  return (
    <div className='flex gap-1'>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 w-6 rounded-full transition-all',
            i < level ? color.replace('text-', 'bg-') : 'bg-white/[0.06]'
          )}
        />
      ))}
    </div>
  );
}

function PlatformTab({ analytics, onRefresh }: { analytics: PlatformPostAnalyticsValue; onRefresh?: () => void }) {
  const accent = getPlatformAccent(analytics.platform);
  const stats = analytics.stats;
  const analysis = analytics.analysis;
  const perf = getPerformanceLevel(analysis?.performanceBand);
  const usesReachAsAudienceMetric = shouldUseReachAsAudienceMetric(stats);
  const showSeparateReach = stats.reach != null && !usesReachAsAudienceMetric;
  const metrics = [
    {
      label: usesReachAsAudienceMetric ? 'Reach' : 'Views',
      value: formatNumber(usesReachAsAudienceMetric ? stats.reach : stats.views),
      accent: usesReachAsAudienceMetric ? 'bg-cyan-500' : 'bg-blue-500'
    },
    ...(showSeparateReach ? [{ label: 'Reach', value: formatNumber(stats.reach), accent: 'bg-cyan-500' }] : []),
    { label: 'Likes', value: formatNumber(stats.likes), accent: 'bg-rose-500' },
    { label: 'Comments', value: formatNumber(stats.comments), accent: 'bg-amber-500' },
    { label: 'Shares', value: formatNumber(stats.shares), accent: 'bg-emerald-500' },
    { label: 'Total', value: formatNumber(stats.totalInteractions), accent: 'bg-violet-500' }
  ];

  return (
    <div className='flex flex-col gap-5'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Badge
            className={cn(
              'border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider',
              accent.border,
              accent.bg,
              accent.text
            )}
          >
            {formatPlatformName(analytics.platform)}
          </Badge>
          {analytics.post?.permalink && (
            <a
              href={analytics.post.permalink}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-1 text-[12px] text-slate-500 transition-colors hover:text-white'
            >
              <ExternalLink size={11} />
              View original
            </a>
          )}
        </div>
        <div className='flex items-center gap-4'>
          {analytics.retrievedAt && (
            <span className='text-[11px] text-slate-600'>Synced {formatShortDate(analytics.retrievedAt)}</span>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className='flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white'
            >
              <RefreshCcw size={11} />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      <div
        className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3', showSeparateReach ? 'lg:grid-cols-6' : 'lg:grid-cols-5')}
      >
        {metrics.map((metric) => (
          <MetricTile key={metric.label} label={metric.label} value={metric.value} accent={metric.accent} />
        ))}
      </div>

      {/* Bottom section: Rates + Insights side by side */}
      {analysis && (
        <div className='grid gap-4 lg:grid-cols-2'>
          {/* Rates panel */}
          <div className='rounded-xl border border-white/[0.06] bg-white/[0.02] p-5'>
            <div className='mb-3 flex items-center justify-between'>
              <span className='text-[11px] uppercase tracking-widest text-slate-500'>Engagement Rates</span>
              <div className='flex items-center gap-2'>
                <PerformanceBar level={perf.level} color={perf.color} />
                <span className={cn('text-xs font-medium', perf.color)}>{perf.label}</span>
              </div>
            </div>
            <RateRow label='Engagement' value={formatPercent(analysis.engagementRateByViews)} />
            <RateRow label='Conversation' value={formatPercent(analysis.conversationRateByViews)} />
            <RateRow label='Amplification' value={formatPercent(analysis.amplificationRateByViews)} />
            <RateRow label='Approval' value={formatPercent(analysis.approvalRateByViews)} />
          </div>

          {/* Insights panel */}
          {analysis.highlights && analysis.highlights.length > 0 && (
            <div className='rounded-xl border border-white/[0.06] bg-white/[0.02] p-5'>
              <span className='mb-3 block text-[11px] uppercase tracking-widest text-slate-500'>Insights</span>
              <ul className='flex flex-col gap-3'>
                {analysis.highlights.map((h, idx) => (
                  <li key={idx} className='flex items-start gap-3 text-[13px] leading-relaxed text-slate-300'>
                    <span className={cn('mt-1.5 block size-1.5 shrink-0 rounded-full', accent.indicator)} />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex gap-6'>
        <div className='aspect-[4/3] w-72 animate-pulse rounded-xl bg-white/[0.04]' />
        <div className='flex flex-1 flex-col gap-3'>
          <div className='h-5 w-2/3 animate-pulse rounded bg-white/[0.05]' />
          <div className='h-4 w-1/3 animate-pulse rounded bg-white/[0.05]' />
          <div className='h-16 w-full animate-pulse rounded bg-white/[0.05]' />
        </div>
      </div>
      <div className='grid grid-cols-5 gap-3'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className='h-20 animate-pulse rounded-xl bg-white/[0.04]' />
        ))}
      </div>
    </div>
  );
}

export default function PostDetailView({
  post,
  analyticsMap,
  isLoadingPost,
  isLoadingAnalytics,
  onBack,
  onRefreshAnalytics
}: PostDetailViewProps) {
  if (isLoadingPost) {
    return (
      <div className='px-4 pb-12 pt-6 sm:px-6 xl:px-8'>
        <DetailSkeleton />
      </div>
    );
  }

  if (!post) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <div className='text-center'>
          <FileImage className='mx-auto mb-3 size-10 text-slate-600' />
          <p className='mb-4 text-sm text-slate-400'>Post not found</p>
          <Button onClick={onBack} size='sm' className='bg-violet-600 text-white hover:bg-violet-700'>
            <ArrowLeft className='mr-1.5 size-3.5' /> Go back
          </Button>
        </div>
      </div>
    );
  }

  const publications = post.publications ?? [];
  const hasMedia = post.media && post.media.length > 0;
  const firstMedia = hasMedia ? post.media[0] : null;
  const defaultTab =
    publications.length > 0 ? (publications[0].socialMediaType?.toLowerCase() ?? 'overview') : 'overview';

  return (
    <div className='px-4 pb-12 pt-6 sm:px-6 xl:px-8'>
      <div className='flex flex-col gap-6'>
        {/* ── Breadcrumb-style header ── */}
        <div className='flex items-center gap-3'>
          <button
            onClick={onBack}
            className='flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white'
          >
            <ArrowLeft size={14} />
            Products
          </button>
          <span className='text-slate-600'>/</span>
          <span className='text-[13px] text-white'>{post.title?.trim() || 'Untitled'}</span>
          <Badge className='ml-auto border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400'>
            Published
          </Badge>
        </div>

        {/* ── Content Block ── */}
        <div className='grid gap-6 lg:grid-cols-[280px_1fr]'>
          {/* Media */}
          <div className='overflow-hidden rounded-xl border border-white/[0.06]'>
            <div className='aspect-[4/3] w-full bg-[#13131e]'>
              {firstMedia ? (
                getMediaType(firstMedia) === 'video' ? (
                  <video src={firstMedia.presignedUrl} controls playsInline className='h-full w-full object-cover' />
                ) : (
                  <img
                    src={firstMedia.presignedUrl}
                    alt={post.title?.trim() || ''}
                    className='h-full w-full object-cover'
                  />
                )
              ) : (
                <div className='flex h-full w-full items-center justify-center'>
                  <FileImage className='size-8 text-slate-700' />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className='flex flex-col gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5'>
            <h1 className='text-lg font-semibold tracking-tight text-white'>{post.title?.trim() || 'Untitled Post'}</h1>
            <span className='text-[12px] text-slate-500'>{formatDate(post.createdAt)}</span>

            {post.content?.content && (
              <p className='text-[13px] leading-relaxed text-slate-300'>{post.content.content}</p>
            )}
            {post.content?.hashtag && (
              <p className='text-[13px] font-medium text-violet-400/80'>{post.content.hashtag}</p>
            )}

            {/* Platform chips */}
            <div className='flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3'>
              {publications.map((pub) => {
                const SocialIcon = getPlatformIcon(pub.socialMediaType);
                const accent = getPlatformAccent(pub.socialMediaType);
                return (
                  <span
                    key={pub.id}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium',
                      accent.border,
                      accent.bg,
                      accent.text
                    )}
                  >
                    {SocialIcon && <SocialIcon size={11} />}
                    {formatPlatformName(pub.socialMediaType)}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Analytics Tabs ── */}
        {publications.length > 0 && (
          <>
            {isLoadingAnalytics ? (
              <div className='grid grid-cols-5 gap-3'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className='h-20 animate-pulse rounded-xl bg-white/[0.04]' />
                ))}
              </div>
            ) : (
              <Tabs defaultValue={defaultTab} className='w-full'>
                <TabsList variant='line' className='w-full justify-start gap-0 border-b border-white/[0.06] pb-0'>
                  {publications.map((pub) => {
                    const SocialIcon = getPlatformIcon(pub.socialMediaType);
                    const accent = getPlatformAccent(pub.socialMediaType);
                    return (
                      <TabsTrigger
                        key={pub.id}
                        value={pub.socialMediaType?.toLowerCase() ?? pub.id}
                        className='flex items-center gap-2 px-5 py-2.5 text-[13px] text-slate-500 transition-colors data-[state=active]:text-white'
                      >
                        {SocialIcon && <SocialIcon size={14} className={cn('transition-colors', accent.text)} />}
                        {formatPlatformName(pub.socialMediaType)}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {publications.map((pub) => {
                  const analytics = analyticsMap[pub.socialMediaId];
                  const tabValue = pub.socialMediaType?.toLowerCase() ?? pub.id;

                  return (
                    <TabsContent key={pub.id} value={tabValue} className='pt-5'>
                      {analytics ? (
                        <PlatformTab
                          analytics={analytics}
                          onRefresh={
                            onRefreshAnalytics && pub.externalContentId
                              ? () => onRefreshAnalytics(pub.socialMediaId, pub.externalContentId!)
                              : undefined
                          }
                        />
                      ) : (
                        <div className='flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/[0.08] py-12'>
                          <p className='text-sm text-slate-500'>No analytics data for {pub.socialMediaType}</p>
                          {onRefreshAnalytics && pub.externalContentId && (
                            <button
                              onClick={() => onRefreshAnalytics(pub.socialMediaId, pub.externalContentId!)}
                              className='flex items-center gap-1.5 text-[12px] text-violet-400 hover:text-violet-300'
                            >
                              <RefreshCcw size={11} /> Fetch data
                            </button>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
          </>
        )}
      </div>
    </div>
  );
}
