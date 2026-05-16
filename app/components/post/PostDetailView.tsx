import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FacebookIcon, InstagramIcon, ThreadsIcon, TiktokIcon } from '@/components/ui/icons/social-icons';
import { cn } from '@/lib/utils';
import type { Post, PostMedia, PlatformPostAnalyticsValue, PostAnalysis, PlatformCommentSample, PlatformAccountInsights } from '@/models/post.model';
import { ArrowLeft, ExternalLink, FileImage, RefreshCw, MessageSquare, Heart, Users, Activity, BarChart3, TrendingUp, Info, User, Share2, Eye } from 'lucide-react';
import { MeAiFeedIcon } from '@/components/ui/icons/social-icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

function getPlatformAccent(platform: string | null) {
  switch (platform?.toLowerCase()) {
    case 'facebook':
      return {
        indicator: 'bg-blue-500',
        text: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        gradient: 'from-blue-500/20 to-blue-600/5'
      };
    case 'instagram':
      return {
        indicator: 'bg-pink-500',
        text: 'text-pink-400',
        bg: 'bg-pink-500/10',
        border: 'border-pink-500/20',
        gradient: 'from-pink-500/20 to-purple-600/5'
      };
    case 'threads':
      return {
        indicator: 'bg-white',
        text: 'text-white',
        bg: 'bg-white/10',
        border: 'border-white/20',
        gradient: 'from-white/10 to-white/5'
      };
    case 'tiktok':
      return {
        indicator: 'bg-cyan-500',
        text: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/20',
        gradient: 'from-cyan-500/20 to-teal-600/5'
      };
    case 'feed':
    default:
      return {
        indicator: 'bg-violet-500',
        text: 'text-violet-400',
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/20',
        gradient: 'from-violet-500/20 to-indigo-600/5'
      };
  }
}

function formatPlatformName(platform: string | null) {
  if (!platform) return '';
  const lower = platform.toLowerCase();
  if (lower === 'tiktok') return 'TikTok';
  if (lower === 'feed') return 'MeAI Feed';
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function getPlatformIcon(platform: string | null) {
  switch (platform?.toLowerCase()) {
    case 'facebook': return FacebookIcon;
    case 'instagram': return InstagramIcon;
    case 'threads': return ThreadsIcon;
    case 'tiktok': return TiktokIcon;
    case 'feed': return MeAiFeedIcon;
    default: return null;
  }
}

function MetricCard({ label, value, icon: Icon, color, description }: { label: string; value: string; icon: any; color: string; description?: string }) {
  return (
    <div className='relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-xl backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.06] group'>
      <div className={cn('absolute -right-4 -top-4 size-24 rounded-full opacity-10 blur-2xl transition-all group-hover:opacity-20', color)} />
      <div className='flex items-center justify-between gap-3'>
        <div className='space-y-1'>
          <span className='text-[11px] font-bold uppercase tracking-widest text-slate-500'>{label}</span>
          <div className='flex items-baseline gap-2'>
            <h3 className='text-2xl font-bold tracking-tight text-white'>{value}</h3>
          </div>
          {description && <p className='text-[10px] text-slate-500'>{description}</p>}
        </div>
        <div className={cn('flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-inner', color.replace('bg-', 'text-'))}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment }: { comment: PlatformCommentSample }) {
  return (
    <div className='group flex gap-4 rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 transition-all hover:bg-white/[0.03]'>
      <Avatar className='size-10 border border-white/10'>
        <AvatarImage src={comment.authorId ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorUsername}` : undefined} />
        <AvatarFallback className='bg-violet-900/30 text-[10px] text-violet-400'>
          {comment.authorName?.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className='flex-1 space-y-2'>
        <div className='flex items-center justify-between'>
          <div className='flex flex-col'>
            <span className='text-[13px] font-semibold text-white'>{comment.authorName}</span>
            <span className='text-[11px] text-slate-500'>@{comment.authorUsername}</span>
          </div>
          <span className='text-[11px] text-slate-600'>{formatShortDate(comment.createdAt)}</span>
        </div>
        <p className='text-[13px] leading-relaxed text-slate-300'>{comment.text}</p>
        <div className='flex items-center gap-4 pt-1'>
          <div className='flex items-center gap-1.5 text-slate-500'>
            <Heart size={12} className='text-rose-500' />
            <span className='text-[11px]'>{comment.likeCount}</span>
          </div>
          <div className='flex items-center gap-1.5 text-slate-500'>
            <MessageSquare size={12} className='text-blue-500' />
            <span className='text-[11px]'>{comment.replyCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountInsightsCard({ insights }: { insights: PlatformAccountInsights }) {
  return (
    <div className='relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-md'>
      <div className='absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent' />
      <div className='relative z-10 flex flex-col items-center gap-4 text-center'>
        <div className='relative'>
          <div className='absolute -inset-1 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 opacity-50 blur-sm' />
          <Avatar className='relative size-20 border-2 border-[#0a0d1a] shadow-2xl'>
            <AvatarImage src={insights.metadata?.avatarUrl} />
            <AvatarFallback className='bg-violet-900/40 text-xl text-white'>{insights.accountName?.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        <div className='space-y-1'>
          <h3 className='text-lg font-bold text-white'>{insights.accountName}</h3>
          <p className='text-xs text-slate-500'>@{insights.username}</p>
        </div>
        <div className='grid w-full grid-cols-3 gap-2 border-t border-white/[0.06] pt-4'>
          <div className='space-y-1'>
            <span className='block text-sm font-bold text-white'>{formatNumber(insights.followers)}</span>
            <span className='text-[10px] uppercase tracking-tighter text-slate-500'>Followers</span>
          </div>
          <div className='space-y-1 border-x border-white/[0.06]'>
            <span className='block text-sm font-bold text-white'>{formatNumber(insights.following)}</span>
            <span className='text-[10px] uppercase tracking-tighter text-slate-500'>Following</span>
          </div>
          <div className='space-y-1'>
            <span className='block text-sm font-bold text-white'>{formatNumber(insights.mediaCount)}</span>
            <span className='text-[10px] uppercase tracking-tighter text-slate-500'>Posts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlatformTab({ analytics, onRefresh }: { analytics: PlatformPostAnalyticsValue; onRefresh?: () => void }) {
  const accent = getPlatformAccent(analytics.platform);
  const stats = analytics.stats;
  const analysis = analytics.analysis;
  const isFeed = analytics.platform?.toLowerCase() === 'feed';

  const mainMetrics = [
    { label: 'Likes', value: formatNumber(stats.likes), icon: Heart, color: 'bg-rose-500' },
    { label: 'Comments', value: formatNumber(stats.comments), icon: MessageSquare, color: 'bg-blue-500' },
    { label: 'Shares', value: formatNumber(stats.shares), icon: Share2, color: 'bg-emerald-500' },
    { label: 'Engagements', value: formatNumber(stats.totalInteractions), icon: Activity, color: 'bg-violet-500' },
  ];

  return (
    <div className='grid gap-6 lg:grid-cols-[1fr_320px]'>
      {/* Main Column */}
      <div className='space-y-6'>
        {/* Sync Info Bar */}
        <div className='flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 backdrop-blur-sm'>
          <div className='flex items-center gap-3'>
             <div className={cn('size-2 rounded-full animate-pulse', accent.indicator)} />
             <span className='text-xs font-medium text-slate-300'>Real-time {formatPlatformName(analytics.platform)} Intelligence</span>
          </div>
          <div className='flex items-center gap-4'>
             <span className='text-[10px] text-slate-500'>Last synced: {analytics.retrievedAt ? formatShortDate(analytics.retrievedAt) : 'Just now'}</span>
             {onRefresh && (
               <button onClick={onRefresh} className='text-[10px] text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1'>
                 <RefreshCw size={10} /> Sync
               </button>
             )}
          </div>
        </div>

        {/* Metric Grid */}
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
           {mainMetrics.map(m => (
             <MetricCard key={m.label} {...m} />
           ))}
        </div>

        {/* Detailed Stats & Rates */}
        <div className='grid gap-6 md:grid-cols-2'>
           {/* Engagement Rates */}
           <div className='rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6'>
              <div className='mb-6 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <BarChart3 size={16} className='text-violet-400' />
                  <h3 className='text-sm font-bold uppercase tracking-widest text-slate-400'>Performance Analysis</h3>
                </div>
                <Badge variant='outline' className='border-violet-500/20 bg-violet-500/5 text-[10px] text-violet-400'>
                  {analysis?.performanceBand?.replace('_', ' ') || 'Calculating...'}
                </Badge>
              </div>

              {isFeed && stats.views === null ? (
                <div className='flex h-40 flex-col items-center justify-center text-center space-y-2'>
                  <Info size={24} className='text-slate-700' />
                  <p className='text-[12px] text-slate-500 max-w-[200px]'>View-based rates will be available once the Feed starts tracking reach.</p>
                </div>
              ) : (
                <div className='space-y-4'>
                   {[
                     { label: 'Engagement Rate', value: formatPercent(analysis?.engagementRateByViews), icon: Activity },
                     { label: 'Conversation Rate', value: formatPercent(analysis?.conversationRateByViews), icon: MessageSquare },
                     { label: 'Amplification Rate', value: formatPercent(analysis?.amplificationRateByViews), icon: Share2 },
                     { label: 'Approval Rate', value: formatPercent(analysis?.approvalRateByViews), icon: Heart }
                   ].map(r => (
                     <div key={r.label} className='flex items-center justify-between group cursor-default'>
                        <div className='flex items-center gap-2'>
                           <r.icon size={14} className='text-slate-600 transition-colors group-hover:text-slate-400' />
                           <span className='text-sm text-slate-400'>{r.label}</span>
                        </div>
                        <span className='text-sm font-mono font-bold text-white'>{r.value}</span>
                     </div>
                   ))}
                </div>
              )}
           </div>

           {/* Platform Specific Breakdown */}
           <div className='rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6'>
              <div className='mb-6 flex items-center gap-2'>
                <TrendingUp size={16} className='text-emerald-400' />
                <h3 className='text-sm font-bold uppercase tracking-widest text-slate-400'>Interaction Breakdown</h3>
              </div>
              <div className='space-y-4'>
                 {Object.entries(analytics.additionalMetrics || stats.metricBreakdown || {}).map(([key, val]) => (
                   <div key={key} className='flex items-center justify-between'>
                      <span className='text-sm capitalize text-slate-400'>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <div className='flex items-center gap-3 flex-1 px-4'>
                         <div className='h-1.5 w-full rounded-full bg-white/5 overflow-hidden'>
                            <div className='h-full bg-gradient-to-r from-violet-500 to-indigo-500' style={{ width: `${Math.min(100, (val as number / (stats.totalInteractions || 1)) * 100)}%` }} />
                         </div>
                      </div>
                      <span className='text-sm font-mono text-white'>{formatNumber(val as number)}</span>
                   </div>
                 ))}
                 {!analytics.additionalMetrics && !stats.metricBreakdown && (
                    <p className='text-xs text-slate-600 italic'>No additional breakdown available.</p>
                 )}
              </div>
           </div>
        </div>

        {/* Comment Samples */}
        <div className='rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6'>
           <div className='mb-6 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <MessageSquare size={16} className='text-blue-400' />
                <h3 className='text-sm font-bold uppercase tracking-widest text-slate-400'>Community Feedback</h3>
              </div>
              <span className='text-[11px] text-slate-500'>{analytics.commentSamples?.length || 0} Recent interactions</span>
           </div>
           
           {analytics.commentSamples && analytics.commentSamples.length > 0 ? (
             <div className='grid gap-4 md:grid-cols-2'>
                {analytics.commentSamples.map(c => (
                  <CommentItem key={c.id} comment={c} />
                ))}
             </div>
           ) : (
             <div className='flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.04] bg-white/[0.01]'>
                <p className='text-[13px] text-slate-600'>No comments recorded yet.</p>
             </div>
           )}
        </div>
      </div>

      {/* Sidebar Column */}
      <div className='space-y-6'>
        {/* Account Info */}
        {analytics.accountInsights && (
          <AccountInsightsCard insights={analytics.accountInsights} />
        )}

        {/* AI Insights / Highlights */}
        {analysis?.highlights && analysis.highlights.length > 0 && (
          <div className='rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6'>
             <div className='mb-4 flex items-center gap-2'>
                <BarChart3 size={16} className='text-violet-400' />
                <h3 className='text-xs font-bold uppercase tracking-widest text-slate-400'>Intelligence Insights</h3>
             </div>
             <ul className='space-y-3'>
                {analysis.highlights.map((h, i) => (
                  <li key={i} className='flex gap-3 text-[12px] leading-relaxed text-slate-300'>
                     <div className='mt-1 size-1.5 shrink-0 rounded-full bg-violet-500' />
                     {h}
                  </li>
                ))}
             </ul>
          </div>
        )}

        {/* Internal Navigation/Quick Actions */}
        <div className='rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5'>
           <h3 className='mb-4 text-[11px] font-bold uppercase tracking-widest text-slate-500'>Actions</h3>
           <div className='space-y-2'>
              {analytics.post?.permalink && (
                <Button variant='outline' className='w-full justify-start border-white/5 bg-white/5 hover:bg-white/10' asChild>
                  <a href={analytics.post.permalink} target='_blank' rel='noopener noreferrer'>
                    <ExternalLink size={14} className='mr-2' /> View original post
                  </a>
                </Button>
              )}
              <Button variant='outline' className='w-full justify-start border-white/5 bg-white/5 hover:bg-white/10'>
                 <Share2 size={14} className='mr-2' /> Copy share link
              </Button>
           </div>
        </div>
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
      <div className='grid gap-6 lg:grid-cols-[1fr_320px]'>
         <div className='space-y-6'>
            <div className='h-12 w-full animate-pulse rounded-xl bg-white/[0.04]' />
            <div className='grid grid-cols-4 gap-4'>
               {Array.from({ length: 4 }).map((_, i) => <div key={i} className='h-24 animate-pulse rounded-2xl bg-white/[0.04]' />)}
            </div>
            <div className='h-64 w-full animate-pulse rounded-2xl bg-white/[0.04]' />
         </div>
         <div className='space-y-6'>
            <div className='h-64 w-full animate-pulse rounded-2xl bg-white/[0.04]' />
            <div className='h-32 w-full animate-pulse rounded-2xl bg-white/[0.04]' />
         </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className='flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center'>
        <div className='flex size-16 items-center justify-center rounded-2xl bg-white/[0.02] border border-white/[0.06]'>
          <FileImage className='size-8 text-slate-600' />
        </div>
        <div>
          <h2 className='text-lg font-bold text-white'>Analytics unavailable</h2>
          <p className='text-sm text-slate-500'>We couldn't find the product data you're looking for.</p>
        </div>
        <Button onClick={onBack} size='sm' className='bg-violet-600 text-white hover:bg-violet-700'>
          <ArrowLeft className='mr-1.5 size-3.5' /> Return to list
        </Button>
      </div>
    );
  }

  const publications = post.publications ?? [];
  const defaultTab = publications.length > 0 ? (publications[0].socialMediaId) : 'overview';

  return (
    <div className='space-y-8 pb-12'>
      {/* Platform Selection Tabs */}
      {publications.length > 0 && (
        <Tabs defaultValue={defaultTab} className='w-full'>
          <div className='flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-4'>
             <div className='space-y-1'>
                <h2 className='text-lg font-bold tracking-tight text-white'>Platform Intelligence</h2>
                <p className='text-[12px] text-slate-500'>Select a connected platform to view specific engagement data.</p>
             </div>
             <TabsList className='bg-white/[0.03] p-1 border border-white/[0.06] rounded-xl'>
               {publications.map((pub) => {
                 const SocialIcon = getPlatformIcon(pub.socialMediaType);
                 return (
                   <TabsTrigger
                     key={pub.id}
                     value={pub.socialMediaId}
                     className='flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] transition-all data-[state=active]:bg-violet-600 data-[state=active]:text-white'
                   >
                     {SocialIcon && <SocialIcon size={14} />}
                     {formatPlatformName(pub.socialMediaType)}
                   </TabsTrigger>
                 );
               })}
             </TabsList>
          </div>

          <div className='mt-8'>
            {isLoadingAnalytics ? (
               <div className='flex items-center justify-center py-20'>
                  <div className='flex flex-col items-center gap-3'>
                     <RefreshCw className='size-8 animate-spin text-violet-500' />
                     <span className='text-sm text-slate-500'>Synthesizing platform data...</span>
                  </div>
               </div>
            ) : (
              publications.map((pub) => {
                const analytics = analyticsMap[pub.socialMediaId];
                return (
                  <TabsContent key={pub.id} value={pub.socialMediaId} className='focus-visible:outline-none focus-visible:ring-0'>
                    {analytics ? (
                      <PlatformTab
                        analytics={analytics}
                        onRefresh={onRefreshAnalytics && (pub.externalContentId || pub.socialMediaType?.toLowerCase() === 'feed')
                          ? () => onRefreshAnalytics(pub.socialMediaId, pub.externalContentId || post.id)
                          : undefined
                        }
                      />
                    ) : (
                      <div className='flex flex-col items-center gap-6 rounded-3xl border border-dashed border-white/[0.08] bg-white/[0.01] py-20 text-center'>
                        <div className='flex size-16 items-center justify-center rounded-2xl bg-white/[0.02] border border-white/[0.06]'>
                           <BarChart3 className='size-8 text-slate-700' />
                        </div>
                        <div className='space-y-1'>
                           <p className='text-sm font-bold text-white'>Data synchronization required</p>
                           <p className='text-xs text-slate-500 max-w-xs'>We haven't gathered analytics for this platform yet. Start a sync to see performance data.</p>
                        </div>
                        {onRefreshAnalytics && (
                          <Button 
                            onClick={() => onRefreshAnalytics(pub.socialMediaId, pub.externalContentId || post.id)}
                            className='bg-violet-600 text-white hover:bg-violet-700'
                          >
                            <RefreshCw size={14} className='mr-2' /> Sync Platform Data
                          </Button>
                        )}
                      </div>
                    )}
                  </TabsContent>
                );
              })
            )}
          </div>
        </Tabs>
      )}
    </div>
  );
}
