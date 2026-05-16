import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  MessageSquare, 
  Heart, 
  Share2, 
  User, 
  Calendar, 
  ExternalLink, 
  RefreshCw,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchFeedPostAnalytics } from '@/services/client/post.client';
import { cn } from '@/lib/utils';
import { MeAiFeedIcon } from '@/components/ui/icons/social-icons';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
};

export default function FeedPostAnalyticsModal({ isOpen, onClose, postId }: Props) {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['feed-post-analytics', postId],
    queryFn: () => fetchFeedPostAnalytics(postId),
    enabled: isOpen && Boolean(postId),
    staleTime: 60_000
  });

  const analytics = data?.value;
  const post = analytics?.post;
  const stats = analytics?.stats;
  const analysis = analytics?.analysis;
  const account = analytics?.accountInsights;
  const comments = analytics?.commentSamples ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl border-white/10 bg-[#080911] p-0 text-white shadow-[0_24px_90px_-45px_rgba(124,58,237,0.55)]">
        <DialogHeader className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg">
                <MeAiFeedIcon size={20} color="white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Operational Intelligence</h2>
                <p className="text-xs font-normal text-zinc-500">Real-time performance for MeAI Feed</p>
              </div>
            </DialogTitle>
            <button 
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
              Sync Data
            </button>
          </div>
        </DialogHeader>

        <div className="custom-scrollbar max-h-[80vh] overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4">
              <div className="size-12 animate-pulse rounded-full bg-violet-500/20" />
              <p className="text-sm text-zinc-500">Decrypting performance metrics...</p>
            </div>
          ) : isError ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <p className="text-rose-400">Failed to load analytics</p>
              <button onClick={() => refetch()} className="mt-4 text-sm text-violet-400 underline">Try again</button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Post Preview Summary */}
              <section className="grid gap-6 lg:grid-cols-[160px_1fr]">
                <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-inner">
                  {post?.thumbnailUrl || post?.mediaUrl ? (
                    <img src={post.thumbnailUrl || post.mediaUrl || ''} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-700">
                      <BarChart3 size={40} />
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                      Published
                    </span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {post?.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold leading-tight">{post?.text || "Untitled Post"}</h3>
                  {account && (
                    <div className="mt-1 flex items-center gap-2 text-zinc-400">
                      <div className="size-5 rounded-full bg-zinc-800 overflow-hidden">
                        {account.metadata?.avatarUrl && <img src={account.metadata.avatarUrl} alt="" />}
                      </div>
                      <span className="text-sm">@{account.username}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Metric Grid */}
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="size-4 text-violet-400" />
                  <h4 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Core Metrics</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <MetricCard 
                    label="Likes" 
                    value={stats?.likes ?? 0} 
                    icon={<Heart size={18} />} 
                    color="rose"
                  />
                  <MetricCard 
                    label="Comments" 
                    value={stats?.comments ?? 0} 
                    icon={<MessageSquare size={18} />} 
                    color="amber"
                  />
                  <MetricCard 
                    label="Total Interaction" 
                    value={stats?.totalInteractions ?? 0} 
                    icon={<BarChart3 size={18} />} 
                    color="violet"
                  />
                  <MetricCard 
                    label="Views" 
                    value={stats?.views ?? "Soon"} 
                    icon={<TrendingUp size={18} />} 
                    color="emerald"
                    isPlaceholder={stats?.views === null}
                  />
                </div>
              </section>

              {/* AI Analysis & Insights */}
              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-violet-400" />
                      <h4 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">AI Performance</h4>
                    </div>
                    {analysis?.performanceBand && (
                      <span className={cn(
                        "rounded-lg px-2 py-1 text-[10px] font-bold uppercase",
                        analysis.performanceBand === 'insufficient_data' ? "bg-zinc-800 text-zinc-400" : "bg-violet-500 text-white"
                      )}>
                        {analysis.performanceBand.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {analysis?.highlights && analysis.highlights.length > 0 ? (
                      analysis.highlights.map((h, i) => (
                        <div key={i} className="flex gap-3 text-sm leading-relaxed text-zinc-300">
                          <div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-violet-500" />
                          {h}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-500 italic">No AI insights generated for this post yet.</p>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <User className="size-4 text-violet-400" />
                    <h4 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Audience Snapshot</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">Author Reputation</span>
                      <span className="text-sm font-semibold">High Engagement</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">Total Followers</span>
                      <span className="text-sm font-semibold">{account?.followers?.toLocaleString() || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">Platform Presence</span>
                      <div className="flex gap-1">
                        <div className="size-1.5 rounded-full bg-violet-500" />
                        <div className="size-1.5 rounded-full bg-violet-500" />
                        <div className="size-1.5 rounded-full bg-zinc-700" />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Recent Comments */}
              {comments.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="size-4 text-violet-400" />
                      <h4 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Recent Discussion</h4>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-bold">{comment.authorName || comment.authorUsername}</span>
                          <span className="text-[10px] text-zinc-500">
                            {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-300">{comment.text}</p>
                        <div className="mt-3 flex gap-4">
                           <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                             <Heart size={10} /> {comment.likeCount ?? 0}
                           </div>
                           <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                             <MessageSquare size={10} /> {comment.replyCount ?? 0}
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({ label, value, icon, color, isPlaceholder }: { 
  label: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: 'rose' | 'amber' | 'violet' | 'emerald';
  isPlaceholder?: boolean;
}) {
  const colorMap = {
    rose: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
    amber: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
    violet: 'text-violet-400 border-violet-500/20 bg-violet-500/5',
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
  };

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl border p-4 transition-all hover:scale-[1.02]",
      colorMap[color]
    )}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</span>
        <div className="opacity-50 transition-opacity group-hover:opacity-100">{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {isPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#080911]/80 backdrop-blur-[2px] opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-[10px] font-bold uppercase text-zinc-400">Tracking Soon</span>
        </div>
      )}
    </div>
  );
}
