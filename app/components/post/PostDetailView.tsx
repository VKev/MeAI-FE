import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FacebookIcon, InstagramIcon, ThreadsIcon, TiktokIcon } from '@/components/ui/icons/social-icons';
import { cn } from '@/lib/utils';
import type { Post, PlatformPostAnalyticsValue, PlatformCommentSample, PlatformAccountInsights } from '@/models/post.model';
import { ArrowLeft, ExternalLink, FileImage, RefreshCw, MessageSquare, Heart, Activity, BarChart3, TrendingUp, Info, Eye, Sparkles, Share2 } from 'lucide-react';
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

// --- Utilities ---
function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString();
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0%';
  return `${(value * 100).toFixed(1)}%`;
}

function formatShortDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
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

function formatPlatformName(platform: string | null) {
  if (!platform) return '';
  const lower = platform.toLowerCase();
  if (lower === 'tiktok') return 'TikTok';
  if (lower === 'feed') return 'MeAI Feed';
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

// Map performance band to numeric score for the UI
function getPerformanceScore(band: string | null | undefined): number {
  if (!band) return 0;
  switch (band.toLowerCase()) {
    case 'excellent': return 95;
    case 'good': return 75;
    case 'fair': return 50;
    case 'poor': return 25;
    default: return 0;
  }
}

// --- Components ---

function AIHealthScore({ band }: { band: string | null | undefined }) {
  const score = getPerformanceScore(band);
  const isCollecting = score === 0;

  const color = score >= 90 ? 'text-emerald-500' :
    score >= 70 ? 'text-violet-500' :
      score >= 40 ? 'text-amber-500' :
        isCollecting ? 'text-violet-400/40' : 'text-rose-500';

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      <div className="relative size-32">
        <svg className="size-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
          <circle
            cx="50" cy="50" r="45"
            stroke="currentColor" strokeWidth="8" fill="transparent"
            strokeDasharray="283"
            strokeDashoffset={isCollecting ? 283 * 0.95 : 283 - (283 * score) / 100}
            className={cn("transition-all duration-1000", color, isCollecting && "animate-pulse")}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-bold transition-colors", isCollecting ? "text-white/20" : "text-white")}>
            {score || '—'}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Score</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className={cn("text-[10px] font-bold uppercase tracking-widest transition-all", color, isCollecting && "animate-pulse")}>
          {isCollecting ? 'Collecting Data' : band?.replace(/_/g, ' ')}
        </div>
      </div>
    </div>
  );
}

function CompactAccountStrip({ insights, platform }: { insights: PlatformAccountInsights, platform: string }) {
  const SocialIcon = getPlatformIcon(platform);
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] p-3 border border-white/[0.04]">
      <Avatar className="size-10 border border-white/10">
        <AvatarImage src={insights.metadata?.avatarUrl} />
        <AvatarFallback className="bg-violet-900/40 text-xs">{insights.accountName?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-white">{insights.accountName}</span>
          {SocialIcon && <SocialIcon size={12} className="shrink-0 text-slate-500" />}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span>{formatNumber(insights.followers)} followers</span>
          <span className="size-1 rounded-full bg-slate-700" />
          <span>{formatNumber(insights.mediaCount)} posts</span>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment }: { comment: PlatformCommentSample }) {
  const isCreator = comment.authorUsername?.toLowerCase().includes('meai');
  return (
    <div className={cn(
      "group flex gap-4 p-4 transition-all border-l-2",
      isCreator ? "border-violet-500 bg-violet-500/[0.03]" : "border-transparent hover:bg-white/[0.02]"
    )}>
      <Avatar className="size-9 border border-white/10">
        <AvatarImage src={comment.authorUsername ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorUsername}` : undefined} />
        <AvatarFallback className="text-[10px]">{comment.authorName?.charAt(0) || 'U'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-white">{comment.authorName}</span>
            {isCreator && <Badge className="h-4 bg-violet-500/20 text-violet-400 text-[9px] border-none px-1.5 uppercase tracking-tighter">Creator</Badge>}
            {comment.authorUsername && <span className="text-[11px] text-slate-500">@{comment.authorUsername}</span>}
          </div>
          <span className="text-[10px] text-slate-600">{formatShortDate(comment.createdAt)}</span>
        </div>
        <p className="text-[13px] leading-relaxed text-slate-300">{comment.text}</p>
        <div className="flex items-center gap-4 pt-1">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Heart size={12} className={cn((comment.likeCount ?? 0) > 0 ? "text-rose-500" : "text-slate-600")} />
            {formatNumber(comment.likeCount)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer hover:text-slate-300">
            <MessageSquare size={12} />
            {formatNumber(comment.replyCount)}
          </div>
        </div>
      </div>
    </div>
  );
}

function PrimaryMetric({ label, value, icon: Icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
        <Icon size={12} className="text-violet-400" />
        {label}
      </div>
      <div className="flex items-baseline gap-4">
        <div className="text-4xl font-black tracking-tighter text-white">{value}</div>
      </div>
    </div>
  );
}

function PlatformTab({ analytics, post }: { analytics: PlatformPostAnalyticsValue, post: Post }) {
  const stats = analytics.stats;
  const analysis = analytics.analysis;

  return (
    <div className="flex flex-col gap-10">
      {/* 1. Hero Summary Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/[0.04] pb-10">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase text-[10px] font-bold tracking-widest px-2">Published</Badge>
            <span className="size-1 rounded-full bg-slate-700" />
            <span className="text-xs text-slate-500">Last synced {analytics.retrievedAt ? formatShortDate(analytics.retrievedAt) : 'Just now'}</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white leading-[1.1]">{post.title || "Social Content"}</h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-xl">{post.content?.content?.slice(0, 160)}...</p>
        </div>

        <div className="flex items-center gap-6 lg:border-l border-white/[0.04] lg:pl-10">
          <AIHealthScore band={analysis?.performanceBand} />
          <div className="flex flex-col gap-2">
            {analytics.post?.permalink && (
              <Button variant="outline" className="h-10 rounded-xl border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white" asChild>
                <a href={analytics.post.permalink} target='_blank' rel='noopener noreferrer'>
                  <ExternalLink size={14} className='mr-2' /> View Post
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Primary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <PrimaryMetric label="Total Reach" value={formatNumber(stats.views || stats.reach || stats.impressions)} icon={Eye} />
        <PrimaryMetric label="Engagement" value={formatPercent(analysis?.engagementRateByViews)} icon={Activity} />

        <div className="lg:col-span-2 grid grid-cols-3 gap-6 border-l border-white/[0.04] pl-10">
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Likes</div>
            <div className="text-2xl font-bold text-white">{formatNumber(stats.likes)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Comments</div>
            <div className="text-2xl font-bold text-white">{formatNumber(stats.comments || stats.replies)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Shares</div>
            <div className="text-2xl font-bold text-white">{formatNumber(stats.shares || stats.reposts)}</div>
          </div>
        </div>
      </div>

      {/* 3. Narrative Intelligence Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Insights (8 columns) */}
        <div className="lg:col-span-8 space-y-12">

          {/* Performance Intelligence */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="size-1 w-6 rounded-full bg-violet-500" />
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Engagement Intelligence</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 rounded-2xl bg-white/[0.01] border border-white/[0.04] p-8">
              <div className="space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Engagement Rates</h3>
                <div className="space-y-5">
                  {[
                    { label: 'Growth Ratio', value: analysis?.engagementRateByViews, icon: TrendingUp },
                    { label: 'Conversational Depth', value: analysis?.conversationRateByViews, icon: MessageSquare },
                    { label: 'Amplification Power', value: analysis?.amplificationRateByViews, icon: Share2 },
                    { label: 'Approval Strength', value: analysis?.approvalRateByViews, icon: Heart }
                  ].map(r => (
                    <div key={r.label} className="group cursor-default space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <r.icon size={14} className="text-slate-500 group-hover:text-violet-400 transition-colors" />
                          <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">{r.label}</span>
                        </div>
                        <span className="text-sm font-black text-white">{formatPercent(r.value)}</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 transition-all duration-700" style={{ width: `${(r.value || 0) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6 border-l border-white/[0.04] pl-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Interaction Velocity</h3>
                <div className="space-y-5">
                  {Object.entries(analytics.additionalMetrics || stats.metricBreakdown || {}).map(([key, val]) => (
                    <div key={key} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium capitalize text-slate-400">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="text-xs font-black text-white">{formatNumber(val as number)}</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${Math.min(100, (val as number / (stats.totalInteractions || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                  {(!analytics.additionalMetrics && !stats.metricBreakdown) && (
                    <p className="text-xs text-slate-600 italic py-4">Detailed breakdown unavailable for this platform.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Community Feedback */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-1 w-6 rounded-full bg-blue-500" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Community Feedback</h2>
              </div>
              <span className="text-[11px] font-bold uppercase text-slate-600 tracking-wider">Top Interactions</span>
            </div>

            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] divide-y divide-white/[0.04]">
              {analytics.commentSamples && analytics.commentSamples.length > 0 ? (
                analytics.commentSamples.map(c => <CommentItem key={c.id} comment={c} />)
              ) : (
                <div className="p-10 text-center text-slate-600 italic text-sm">No significant community feedback detected yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Intelligence Sidebar (4 columns) */}
        <div className="lg:col-span-4 space-y-10">
          {/* Compact Profile */}
          {analytics.accountInsights && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 ml-1">Creator Stream</h3>
              <CompactAccountStrip insights={analytics.accountInsights} platform={analytics.platform || 'feed'} />
            </div>
          )}

          {/* AI Highlights */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 ml-1">
              <Sparkles size={14} className="text-violet-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">AI Intelligence Highlights</h3>
            </div>
            <div className="space-y-3">
              {analysis?.highlights?.map((h, i) => (
                <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 text-xs leading-relaxed text-slate-300 hover:bg-white/[0.04] transition-colors">
                  {h}
                </div>
              ))}
              {(!analysis?.highlights || analysis.highlights.length === 0) && (
                <p className="text-[12px] text-slate-600 italic p-4">Analyzing content patterns...</p>
              )}
            </div>
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
      <div className="space-y-12 py-10">
        <div className="h-40 w-full animate-pulse rounded-[32px] bg-white/[0.03]" />
        <div className="grid grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[0.02]" />)}
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 h-96 animate-pulse rounded-3xl bg-white/[0.02]" />
          <div className="col-span-4 h-96 animate-pulse rounded-3xl bg-white/[0.02]" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className='flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center'>
        <div className='flex size-20 items-center justify-center rounded-3xl bg-white/[0.02] border border-white/[0.06] shadow-2xl'>
          <FileImage className='size-10 text-slate-700' />
        </div>
        <div className="space-y-2">
          <h2 className='text-2xl font-black text-white'>Intelligence Not Found</h2>
          <p className='text-sm text-slate-500 max-w-xs'>The requested asset or its analytics could not be retrieved from the intelligence system.</p>
        </div>
        <Button onClick={onBack} variant="outline" className='h-11 rounded-2xl border-white/10 bg-white/5 px-8 font-bold uppercase tracking-widest text-[11px]'>
          <ArrowLeft className='mr-2 size-4' /> Return to Archive
        </Button>
      </div>
    );
  }

  const publications = post.publications ?? [];
  const defaultTab = publications.length > 0 ? (publications[0].socialMediaId) : 'overview';

  return (
    <div className='space-y-8 pb-20'>
      {publications.length > 0 && (
        <Tabs defaultValue={defaultTab} className='w-full'>
          {/* Platform Stream Selector Section */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between py-4 border-b border-white/[0.04]">
            <div className="space-y-0.5">
              <h2 className='text-sm font-black uppercase tracking-widest text-white'>Intelligence Feed</h2>
              <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-violet-500 animate-pulse" />
                <span className='text-[10px] text-slate-500 font-bold uppercase tracking-widest'>Active platform stream</span>
              </div>
            </div>

            <TabsList className='bg-white/[0.03] p-1 border border-white/[0.06] rounded-xl h-11'>
              {publications.map((pub) => {
                const SocialIcon = getPlatformIcon(pub.socialMediaType);
                return (
                  <TabsTrigger
                    key={pub.id}
                    value={pub.socialMediaId}
                    className='flex items-center gap-2 rounded-lg px-6 py-2 text-[11px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-violet-600 data-[state=active]:text-white'
                  >
                    {SocialIcon && <SocialIcon size={14} />}
                    {formatPlatformName(pub.socialMediaType)}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <div className='mt-10'>
            {isLoadingAnalytics ? (
              <div className='flex flex-col items-center justify-center py-40 gap-6'>
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-2xl animate-pulse" />
                  <RefreshCw className='size-12 animate-spin text-violet-500 relative z-10' />
                </div>
                <div className="space-y-1 text-center">
                  <span className='text-sm font-black uppercase tracking-[0.2em] text-white'>Analyzing Performance</span>
                  <p className='text-xs text-slate-500'>Hang tight, we're pulling the latest data and running AI models for you.</p>
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
                        post={post}
                      />
                    ) : (
                      <div className='flex flex-col items-center gap-8 rounded-[40px] border border-dashed border-white/[0.08] bg-white/[0.01] py-32 text-center'>
                        <div className='flex size-24 items-center justify-center rounded-[32px] bg-white/[0.02] border border-white/[0.06] shadow-inner'>
                          <BarChart3 className='size-10 text-slate-700' />
                        </div>
                        <div className='space-y-2'>
                          <p className='text-xl font-black text-white uppercase tracking-tighter'>Stream Inactive</p>
                          <p className='text-sm text-slate-500 max-w-xs mx-auto'>This platform stream has no cached intelligence. Initiate a synchronization from the top to begin tracking.</p>
                        </div>
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
