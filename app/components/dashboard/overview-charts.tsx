import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import type { SocialMedia } from '@/models/social-media.model';
import type { PlatformDashboardSummaryValue } from '@/models/post.model';

type DashboardOverviewChartsProps = {
  accounts: SocialMedia[];
  summaries: Map<string, PlatformDashboardSummaryValue | null>;
};

const chartConfig = {
  views: { label: 'Views', color: 'var(--color-views)' },
  likes: { label: 'Likes', color: 'var(--color-likes)' },
  comments: { label: 'Comments', color: 'var(--color-comments)' },
  shares: { label: 'Shares', color: 'var(--color-shares)' }
};

export function DashboardOverviewCharts({ accounts, summaries }: DashboardOverviewChartsProps) {
  const chartData = useMemo(() => {
    let facebookActive = false;
    let instagramActive = false;
    let tiktokActive = false;

    let viewsFb = 0,
      viewsIg = 0,
      viewsTt = 0;
    let likesFb = 0,
      likesIg = 0,
      likesTt = 0;
    let commentsFb = 0,
      commentsIg = 0,
      commentsTt = 0;
    let sharesFb = 0,
      sharesIg = 0,
      sharesTt = 0;

    for (const account of accounts) {
      const summary = summaries.get(account.id);
      if (!summary) continue;

      const stats = summary.aggregatedStats;
      const type = account.type.toLowerCase();

      if (type === 'facebook') {
        facebookActive = true;
        viewsFb += stats.views || 0;
        likesFb += stats.likes || 0;
        commentsFb += stats.comments || 0;
        sharesFb += stats.shares || 0;
      } else if (type === 'instagram') {
        instagramActive = true;
        viewsIg += stats.views || 0;
        likesIg += stats.likes || 0;
        commentsIg += stats.comments || 0;
        sharesIg += stats.shares || 0;
      } else if (type === 'tiktok') {
        tiktokActive = true;
        viewsTt += stats.views || 0;
        likesTt += stats.likes || 0;
        commentsTt += stats.comments || 0;
        sharesTt += stats.shares || 0;
      }
    }

    const data = [
      { metric: 'Views', facebook: viewsFb, instagram: viewsIg, tiktok: viewsTt },
      { metric: 'Likes', facebook: likesFb, instagram: likesIg, tiktok: likesTt },
      { metric: 'Comments', facebook: commentsFb, instagram: commentsIg, tiktok: commentsTt },
      { metric: 'Shares', facebook: sharesFb, instagram: sharesIg, tiktok: sharesTt }
    ];

    // Check if there is any data to show
    const isDataEmpty = data.every((row) => row.facebook === 0 && row.instagram === 0 && row.tiktok === 0);

    return { data, isDataEmpty, facebookActive, instagramActive, tiktokActive };
  }, [accounts, summaries]);

  // Adjust config for dynamic legend matching platforms
  const platformConfig = {
    facebook: { label: 'Facebook', color: '#3b5998' },
    instagram: { label: 'Instagram', color: '#e1306c' },
    tiktok: { label: 'TikTok', color: '#25F4EE' }
  };

  if (chartData.isDataEmpty) {
    return (
      <div className='flex h-[320px] items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-3xl'>
        <div className='text-center'>
          <p className='text-sm font-medium text-slate-300'>No cross-platform data yet.</p>
          <p className='mt-1 text-xs text-slate-500'>
            Wait for analytics to finish loading or connect active accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='rounded-2xl border border-indigo-500/10 bg-indigo-500/[0.02] p-5 shadow-2xl backdrop-blur-3xl lg:p-6'>
      <div className='mb-6'>
        <h3 className='text-lg font-semibold tracking-tight text-white/90'>Aggregated Engagement</h3>
        <p className='text-sm text-slate-400'>Comparing total metrics across your connected platforms.</p>
      </div>
      <div className='h-[300px] w-full'>
        <ChartContainer config={platformConfig} className='h-full w-full'>
          <BarChart data={chartData.data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke='#ffffff' strokeOpacity={0.05} />
            <XAxis
              dataKey='metric'
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => new Intl.NumberFormat('en', { notation: 'compact' }).format(value)}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator='dashed' />} />
            <ChartLegend content={<ChartLegendContent />} />

            {chartData.facebookActive && (
              <Bar dataKey='facebook' fill='var(--color-facebook)' radius={[4, 4, 0, 0]} maxBarSize={40} />
            )}
            {chartData.instagramActive && (
              <Bar dataKey='instagram' fill='var(--color-instagram)' radius={[4, 4, 0, 0]} maxBarSize={40} />
            )}
            {chartData.tiktokActive && (
              <Bar dataKey='tiktok' fill='var(--color-tiktok)' radius={[4, 4, 0, 0]} maxBarSize={40} />
            )}
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
