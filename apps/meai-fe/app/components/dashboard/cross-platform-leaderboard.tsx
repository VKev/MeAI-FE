import { useMemo } from 'react';
import { Trophy, Users, Heart, Award, Sparkles, TrendingUp, HelpCircle, Crown, Info } from 'lucide-react';
import type { SocialMedia } from '@/models/social-media.model';
import type { PlatformDashboardSummaryValue, PlatformPostItem } from '@/models/post.model';
import { FacebookIcon, InstagramIcon, ThreadsIcon, TiktokIcon } from '@/components/ui/icons/social-icons';
import { formatCompactValue } from './common/chart-utils';
import { isChartPlatform, getAudienceMetric } from './common/chart-utils';
import type { ChartPlatform } from './common/chart-types';

type CrossPlatformLeaderboardProps = {
  accounts: SocialMedia[];
  summaries: Map<string, PlatformDashboardSummaryValue | null>;
};

type LeaderboardItem = {
  platform: ChartPlatform;
  label: string;
  totalAudience: number;
  totalEngagement: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  postCount: number;
  efficiencyRate: number;
  rankedScore: number;
  topPost: PlatformPostItem | null;
  topPostReach: number;
  topPostLikes: number;
};

export function CrossPlatformLeaderboard({ accounts, summaries }: CrossPlatformLeaderboardProps) {
  const leaderboardData = useMemo(() => {
    const platformDataMap = new Map<ChartPlatform, {
      totalAudience: number;
      totalLikes: number;
      totalComments: number;
      totalShares: number;
      postCount: number;
      posts: PlatformPostItem[];
    }>();

    for (const account of accounts) {
      const summary = summaries.get(account.id);
      if (!summary) continue;

      const type = account.type.toLowerCase();
      if (!isChartPlatform(type)) continue;

      const platformData = platformDataMap.get(type) ?? {
        totalAudience: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        postCount: 0,
        posts: []
      };

      const stats = summary.aggregatedStats;
      let accountAudience = stats.reach || stats.views || 0;
      
      for (const item of summary.posts) {
        platformData.posts.push(item.post);
        const postStats = item.post.stats;
        if (postStats) {
          platformData.totalLikes += postStats.likes || 0;
          platformData.totalComments += postStats.comments || 0;
          platformData.totalShares += postStats.shares || 0;
          
          if (!stats.reach && !stats.views) {
            accountAudience += getAudienceMetric(postStats) || 0;
          }
        }
      }

      platformData.totalAudience += accountAudience;
      platformData.postCount += summary.posts.length;

      platformDataMap.set(type, platformData);
    }

    const list: LeaderboardItem[] = [];

    platformDataMap.forEach((data, platform) => {
      const totalEngagement = data.totalLikes + data.totalComments + data.totalShares;
      const efficiencyRate = data.totalAudience > 0 
        ? (totalEngagement / data.totalAudience) * 100 
        : 0;

      let topPost: PlatformPostItem | null = null;
      let maxEngagement = -1;
      let topPostReach = 0;
      let topPostLikes = 0;

      for (const post of data.posts) {
        const postStats = post.stats;
        const postEngagement = (postStats?.likes || 0) + (postStats?.comments || 0) + (postStats?.shares || 0);
        if (postEngagement > maxEngagement) {
          maxEngagement = postEngagement;
          topPost = post;
          topPostReach = getAudienceMetric(postStats) || 0;
          topPostLikes = postStats?.likes || 0;
        }
      }

      const labels: Record<ChartPlatform, string> = {
        facebook: 'Facebook',
        instagram: 'Instagram',
        tiktok: 'TikTok',
        threads: 'Threads'
      };

      list.push({
        platform,
        label: labels[platform],
        totalAudience: data.totalAudience,
        totalEngagement,
        totalLikes: data.totalLikes,
        totalComments: data.totalComments,
        totalShares: data.totalShares,
        postCount: data.postCount,
        efficiencyRate,
        rankedScore: totalEngagement,
        topPost,
        topPostReach,
        topPostLikes
      });
    });

    return list.sort((a, b) => b.totalEngagement - a.totalEngagement || b.totalAudience - a.totalAudience);
  }, [accounts, summaries]);

  const maxEngagement = useMemo(() => {
    const engagements = leaderboardData.map(item => item.totalEngagement);
    return Math.max(...engagements, 1);
  }, [leaderboardData]);

  if (leaderboardData.length === 0) {
    return null;
  }

  const renderSocialIcon = (platform: ChartPlatform, size = 16) => {
    switch (platform) {
      case 'facebook':
        return <FacebookIcon size={size} className="text-[#0866FF]" />;
      case 'instagram':
        return <InstagramIcon size={size} className="text-[#E4405F]" />;
      case 'tiktok':
        return <TiktokIcon size={size} className="text-white" />;
      case 'threads':
        return <ThreadsIcon size={size} className="text-[#00f7ffff]" />;
      default:
        return <HelpCircle size={size} className="text-slate-400" />;
    }
  };

  const renderRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="flex items-center justify-center size-8 rounded-xl bg-gradient-to-br from-amber-400/20 via-yellow-500/10 to-transparent border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.25)] text-yellow-400 shrink-0 font-extrabold text-sm relative">
            <Crown size={12} className="absolute -top-1.5 -right-1 text-yellow-400 filter drop-shadow-[0_2px_4px_rgba(234,179,8,0.4)] animate-pulse" />
            1
          </div>
        );
      case 1:
        return (
          <div className="flex items-center justify-center size-8 rounded-xl bg-gradient-to-br from-slate-300/20 via-slate-400/10 to-transparent border border-slate-400/30 shadow-[0_0_12px_rgba(148,163,184,0.15)] text-slate-300 shrink-0 font-extrabold text-sm relative">
            <Trophy size={11} className="absolute -top-1.5 -right-1 text-slate-300 filter drop-shadow-[0_2px_4px_rgba(148,163,184,0.3)]" />
            2
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center size-8 rounded-xl bg-gradient-to-br from-amber-700/20 via-orange-600/10 to-transparent border border-orange-600/30 shadow-[0_0_12px_rgba(194,65,12,0.12)] text-orange-500 shrink-0 font-extrabold text-sm relative">
            <Award size={11} className="absolute -top-1.5 -right-1 text-orange-500 filter drop-shadow-[0_2px_4px_rgba(194,65,12,0.3)]" />
            3
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center size-8 rounded-xl bg-white/5 border border-white/[0.04] text-slate-500 shrink-0 font-mono text-xs font-semibold">
            {index + 1}
          </div>
        );
    }
  };

  const getPlatformBorderClass = (index: number) => {
    if (index === 0) return 'border-amber-500/20 bg-gradient-to-r from-white/[0.02] to-amber-500/[0.01] hover:border-amber-500/30';
    return 'border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08]';
  };

  const getProgressBarColor = (platform: ChartPlatform) => {
    switch (platform) {
      case 'facebook':
        return 'bg-[#0866FF]';
      case 'instagram':
        return 'bg-gradient-to-r from-[#8a3ab9] via-[#e95950] to-[#fccc63]';
      case 'tiktok':
        return 'bg-gradient-to-r from-[#00f2fe] to-[#4facfe]';
      case 'threads':
        return 'bg-[#00f7ffff]';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div className='relative'>
      <div className='absolute -right-24 -top-24 size-48 rounded-full bg-violet-600/5 blur-3xl pointer-events-none' />
      <div className='absolute -left-24 -bottom-24 size-48 rounded-full bg-emerald-600/5 blur-3xl pointer-events-none' />

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {leaderboardData.map((item, index) => {
          const progressWidth = maxEngagement > 0 ? `${(item.totalEngagement / maxEngagement) * 100}%` : '0%';
          
          return (
            <div
              key={item.platform}
              className={`group flex flex-col justify-between rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 ${getPlatformBorderClass(index)}`}
            >
              <div>
                <div className='flex items-center mb-3.5'>
                  <div className='flex items-center gap-3 min-w-0 w-full'>
                    {renderRankBadge(index)}
                    
                    <div className='flex items-center gap-2 min-w-0'>
                      {renderSocialIcon(item.platform, 18)}
                      <span className='font-bold text-sm text-slate-200 group-hover:text-white transition-colors truncate'>
                        {item.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='mb-3'>
                  <div className='flex items-baseline gap-1.5'>
                    <span className='font-mono font-bold text-2xl text-white'>
                      {formatCompactValue(item.totalEngagement)}
                    </span>
                    <span className='text-[10px] font-bold uppercase tracking-widest text-slate-500'>Interactions</span>
                  </div>
                </div>

                {maxEngagement > 0 && (
                  <div className='w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-4 border border-white/[0.02]'>
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressBarColor(item.platform)}`}
                      style={{ width: progressWidth }}
                    />
                  </div>
                )}

                <div className='grid grid-cols-3 gap-2 border-t border-white/[0.04] pt-3 mb-4'>
                  <div className='flex flex-col rounded-xl bg-white/[0.01] border border-white/[0.02] p-2 hover:bg-white/[0.02] transition-colors'>
                    <span className='font-mono text-xs font-bold text-slate-200 leading-tight mb-0.5 truncate'>
                      {formatCompactValue(item.totalAudience)}
                    </span>
                    <span className='text-[8px] text-slate-500 font-semibold uppercase tracking-wider'>Audience</span>
                  </div>

                  <div className='flex flex-col rounded-xl bg-white/[0.01] border border-white/[0.02] p-2 hover:bg-white/[0.02] transition-colors'>
                    <span className='font-mono text-xs font-bold text-emerald-400 leading-tight mb-0.5 truncate'>
                      {formatCompactValue(item.totalEngagement)}
                    </span>
                    <span className='text-[8px] text-slate-500 font-semibold uppercase tracking-wider'>Interact</span>
                  </div>

                  <div className='flex flex-col rounded-xl bg-white/[0.01] border border-white/[0.02] p-2 hover:bg-white/[0.02] transition-colors'>
                    <span className='font-mono text-xs font-bold text-violet-400 leading-tight mb-0.5 truncate'>
                      {item.postCount}
                    </span>
                    <span className='text-[8px] text-slate-500 font-semibold uppercase tracking-wider'>Posts</span>
                  </div>
                </div>
              </div>

              {item.topPost && (
                <div className='mt-auto rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 transition-colors hover:bg-white/[0.04]'>
                  <div className='flex items-center gap-1.5 mb-1'>
                    <Trophy className='size-3 text-yellow-500' />
                    <span className='text-[9px] font-bold text-yellow-500 uppercase tracking-wider'>
                      Best Post
                    </span>
                  </div>
                  <p className='text-xs text-slate-300 line-clamp-2 italic leading-relaxed mb-1.5'>
                    &quot;{item.topPost.text || item.topPost.title || item.topPost.description || 'Untitled post'}&quot;
                  </p>
                  <div className='flex items-center gap-2 text-[9px] text-slate-500 font-medium'>
                    <span className='flex items-center gap-0.5'>
                      <Users className='size-2.5' />
                      {formatCompactValue(item.topPostReach)}
                    </span>
                    <span>•</span>
                    <span className='flex items-center gap-0.5'>
                      <Heart className='size-2.5 text-rose-500/80' />
                      {formatCompactValue(item.topPostLikes)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
