import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip
} from '@/components/ui/chart';
import type { SocialMedia } from '@/models/social-media.model';
import type { PlatformDashboardSummaryValue, PlatformPostStats } from '@/models/post.model';

type DashboardOverviewChartsProps = {
  accounts: SocialMedia[];
  summaries: Map<string, PlatformDashboardSummaryValue | null>;
};

const PLATFORM_CONFIG = {
  facebook: { label: 'Facebook', color: '#3b5998' },
  instagram: { label: 'Instagram', color: '#e1306c' },
  tiktok: { label: 'TikTok', color: '#25F4EE' },
  threads: { label: 'Threads', color: '#f5f5f5' }
} as const;

const PLATFORM_KEYS = Object.keys(PLATFORM_CONFIG) as Array<keyof typeof PLATFORM_CONFIG>;

type ChartPlatform = keyof typeof PLATFORM_CONFIG;
type ChartRow = { metric: string } & Record<ChartPlatform, number>;
type MetricTrendKey = 'audience' | 'likes' | 'comments' | 'shares';
type AnalysisTrendKey = 'engagement' | 'conversation' | 'amplification' | 'approval';
type MetricTrendRow = {
  date: string;
  audience: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  sampleSize: number;
};
type AnalysisTrendRow = {
  date: string;
  engagement: number | null;
  conversation: number | null;
  amplification: number | null;
  approval: number | null;
  sampleSize: number;
};
type SeriesAccumulator = {
  sum: number;
  count: number;
};

const METRIC_TREND_CONFIG = {
  audience: { label: 'Audience', color: '#60a5fa' },
  likes: { label: 'Likes', color: '#fb7185' },
  comments: { label: 'Comments', color: '#f59e0b' },
  shares: { label: 'Shares', color: '#34d399' }
} as const;

const ANALYSIS_TREND_CONFIG = {
  engagement: { label: 'Engagement Rate', color: '#818cf8' },
  conversation: { label: 'Conversation Rate', color: '#38bdf8' },
  amplification: { label: 'Amplification Rate', color: '#f472b6' },
  approval: { label: 'Approval Rate', color: '#fbbf24' }
} as const;

function hasDistinctViewMetric(summary: PlatformDashboardSummaryValue | null) {
  const stats = summary?.aggregatedStats;
  return stats?.views != null && (stats.reach == null || stats.views !== stats.reach);
}

function isChartPlatform(value: string): value is ChartPlatform {
  return PLATFORM_KEYS.includes(value as ChartPlatform);
}

function createAccumulator(): SeriesAccumulator {
  return { sum: 0, count: 0 };
}

function addNullableValue(accumulator: SeriesAccumulator, value: number | null | undefined) {
  if (value == null) {
    return;
  }

  accumulator.sum += value;
  accumulator.count += 1;
}

function getSummedValue(accumulator: SeriesAccumulator) {
  return accumulator.count > 0 ? accumulator.sum : null;
}

function getAverageValue(accumulator: SeriesAccumulator) {
  return accumulator.count > 0 ? Number((accumulator.sum / accumulator.count).toFixed(1)) : null;
}

function getAudienceMetric(stats: PlatformPostStats | null | undefined) {
  if (!stats) {
    return null;
  }

  return stats.reach != null && (stats.views == null || stats.views === stats.reach) ? stats.reach : stats.views;
}

function toDateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatTrendDate(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function hasAnyTrendData<T extends Record<string, number | string | null>>(rows: T[], keys: Array<keyof T>) {
  return rows.some((row) => keys.some((key) => typeof row[key] === 'number'));
}

function formatCompactTick(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function formatMetricTooltipValue(value: unknown) {
  if (typeof value !== 'number') {
    return 'N/A';
  }

  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function formatPercentTooltipValue(value: unknown) {
  if (typeof value !== 'number') {
    return 'N/A';
  }

  return `${value.toFixed(1)}%`;
}

export function DashboardOverviewCharts({ accounts, summaries }: DashboardOverviewChartsProps) {
  const chartData = useMemo(() => {
    let showViewsMetric = false;

    const activePlatforms = new Set<ChartPlatform>();
    const totals = {
      views: Object.fromEntries(PLATFORM_KEYS.map((platform) => [platform, 0])) as Record<ChartPlatform, number>,
      likes: Object.fromEntries(PLATFORM_KEYS.map((platform) => [platform, 0])) as Record<ChartPlatform, number>,
      comments: Object.fromEntries(PLATFORM_KEYS.map((platform) => [platform, 0])) as Record<ChartPlatform, number>,
      shares: Object.fromEntries(PLATFORM_KEYS.map((platform) => [platform, 0])) as Record<ChartPlatform, number>
    };
    const trendBuckets = new Map<
      string,
      {
        audience: SeriesAccumulator;
        likes: SeriesAccumulator;
        comments: SeriesAccumulator;
        shares: SeriesAccumulator;
        engagement: SeriesAccumulator;
        conversation: SeriesAccumulator;
        amplification: SeriesAccumulator;
        approval: SeriesAccumulator;
        sampleSize: number;
      }
    >();
    const buildRow = (metric: string, metricTotals: Record<ChartPlatform, number>): ChartRow => ({
      metric,
      ...(Object.fromEntries(PLATFORM_KEYS.map((platform) => [platform, metricTotals[platform]])) as Record<
        ChartPlatform,
        number
      >)
    });

    for (const account of accounts) {
      const summary = summaries.get(account.id);
      if (!summary) continue;

      const stats = summary.aggregatedStats;
      const type = account.type.toLowerCase();
      if (!isChartPlatform(type)) {
        continue;
      }

      const distinctViews = hasDistinctViewMetric(summary);
      showViewsMetric = showViewsMetric || distinctViews;
      activePlatforms.add(type);

      totals.views[type] += distinctViews ? stats.views || 0 : 0;
      totals.likes[type] += stats.likes || 0;
      totals.comments[type] += stats.comments || 0;
      totals.shares[type] += stats.shares || 0;

      for (const item of summary.posts) {
        const publishedAt = item.post.publishedAt;
        if (!publishedAt) {
          continue;
        }

        const dateKey = toDateKey(publishedAt);
        if (!dateKey) {
          continue;
        }

        const bucket = trendBuckets.get(dateKey) ?? {
          audience: createAccumulator(),
          likes: createAccumulator(),
          comments: createAccumulator(),
          shares: createAccumulator(),
          engagement: createAccumulator(),
          conversation: createAccumulator(),
          amplification: createAccumulator(),
          approval: createAccumulator(),
          sampleSize: 0
        };
        const postStats = item.post.stats;

        addNullableValue(bucket.audience, getAudienceMetric(postStats));
        addNullableValue(bucket.likes, postStats?.likes);
        addNullableValue(bucket.comments, postStats?.comments);
        addNullableValue(bucket.shares, postStats?.shares);
        addNullableValue(bucket.engagement, item.analysis?.engagementRateByViews);
        addNullableValue(bucket.conversation, item.analysis?.conversationRateByViews);
        addNullableValue(bucket.amplification, item.analysis?.amplificationRateByViews);
        addNullableValue(bucket.approval, item.analysis?.approvalRateByViews);
        bucket.sampleSize += 1;
        trendBuckets.set(dateKey, bucket);
      }
    }

    const data: ChartRow[] = [
      ...(showViewsMetric ? [buildRow('Views', totals.views)] : []),
      buildRow('Likes', totals.likes),
      buildRow('Comments', totals.comments),
      buildRow('Shares', totals.shares)
    ];

    const sortedTrendRows = Array.from(trendBuckets.entries())
      .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
      .map(([dateKey, bucket]) => ({
        date: formatTrendDate(dateKey),
        audience: getSummedValue(bucket.audience),
        likes: getSummedValue(bucket.likes),
        comments: getSummedValue(bucket.comments),
        shares: getSummedValue(bucket.shares),
        engagement: getAverageValue(bucket.engagement),
        conversation: getAverageValue(bucket.conversation),
        amplification: getAverageValue(bucket.amplification),
        approval: getAverageValue(bucket.approval),
        sampleSize: bucket.sampleSize
      }));

    const metricTrendData: MetricTrendRow[] = sortedTrendRows
      .filter((row) => row.audience != null || row.likes != null || row.comments != null || row.shares != null)
      .map((row) => ({
        date: row.date,
        audience: row.audience,
        likes: row.likes,
        comments: row.comments,
        shares: row.shares,
        sampleSize: row.sampleSize
      }));

    const analysisTrendData: AnalysisTrendRow[] = sortedTrendRows
      .filter((row) => row.engagement != null || row.conversation != null || row.amplification != null || row.approval != null)
      .map((row) => ({
        date: row.date,
        engagement: row.engagement,
        conversation: row.conversation,
        amplification: row.amplification,
        approval: row.approval,
        sampleSize: row.sampleSize
      }));

    const isDataEmpty = data.every((row) => PLATFORM_KEYS.every((platform) => row[platform] === 0));
    const hasMetricTrend = hasAnyTrendData(metricTrendData, ['audience', 'likes', 'comments', 'shares']);
    const hasAnalysisTrend = hasAnyTrendData(analysisTrendData, [
      'engagement',
      'conversation',
      'amplification',
      'approval'
    ]);

    return {
      data,
      isDataEmpty,
      activePlatforms: Array.from(activePlatforms),
      metricTrendData,
      analysisTrendData,
      hasMetricTrend,
      hasAnalysisTrend
    };
  }, [accounts, summaries]);

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
    <div className='space-y-6'>
      <div className='rounded-2xl border border-indigo-500/10 bg-indigo-500/[0.02] p-5 shadow-2xl backdrop-blur-3xl lg:p-6'>
        <div className='mb-6'>
          <h3 className='text-lg font-semibold tracking-tight text-white/90'>Aggregated Engagement</h3>
          <p className='text-sm text-slate-400'>
            Comparing total metrics across your connected accounts and platforms.
          </p>
        </div>
        <div className='h-[300px] w-full'>
          <ChartContainer config={PLATFORM_CONFIG} className='h-full w-full'>
            <BarChart data={chartData.data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
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
                tickMargin={6}
                tickFormatter={formatCompactTick}
                tick={{ fill: '#64748b', fontSize: 11 }}
                width={45}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator='dashed' />} />
              <ChartLegend content={<ChartLegendContent />} />
              {chartData.activePlatforms.map((platform) => (
                <Bar
                  key={platform}
                  dataKey={platform}
                  fill={`var(--color-${platform})`}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              ))}
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <div className='rounded-2xl border border-white/5 bg-white/[0.02] p-5 shadow-2xl backdrop-blur-3xl lg:p-6'>
          <div className='mb-6'>
            <h3 className='text-lg font-semibold tracking-tight text-white/90'>Metric Trend Over Time</h3>
            <p className='text-sm text-slate-400'>
              Daily movement across the latest synced posts from your connected accounts.
            </p>
          </div>

          {chartData.hasMetricTrend ? (
            <div className='h-[300px] w-full'>
              <ChartContainer config={METRIC_TREND_CONFIG} className='h-full w-full'>
                <LineChart data={chartData.metricTrendData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke='#ffffff' strokeOpacity={0.05} />
                  <XAxis
                    dataKey='date'
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    tickFormatter={formatCompactTick}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    width={45}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator='line'
                        formatter={(value, name) => (
                          <div className='flex w-full items-center justify-between gap-3'>
                            <span className='text-muted-foreground'>
                              {METRIC_TREND_CONFIG[name as MetricTrendKey]?.label ?? name}
                            </span>
                            <span className='font-mono font-medium text-foreground'>
                              {formatMetricTooltipValue(value)}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type='monotone'
                    dataKey='audience'
                    stroke='var(--color-audience)'
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line type='monotone' dataKey='likes' stroke='var(--color-likes)' strokeWidth={2.5} dot={false} />
                  <Line
                    type='monotone'
                    dataKey='comments'
                    stroke='var(--color-comments)'
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line type='monotone' dataKey='shares' stroke='var(--color-shares)' strokeWidth={2.5} dot={false} />
                </LineChart>
              </ChartContainer>
            </div>
          ) : (
            <div className='flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-white/8 bg-white/[0.015]'>
              <div className='text-center'>
                <p className='text-sm font-medium text-slate-300'>Not enough timeline data yet.</p>
                <p className='mt-1 text-xs text-slate-500'>Publish more posts to unlock daily metric trends.</p>
              </div>
            </div>
          )}
        </div>

        <div className='rounded-2xl border border-white/5 bg-white/[0.02] p-5 shadow-2xl backdrop-blur-3xl lg:p-6'>
          <div className='mb-6'>
            <h3 className='text-lg font-semibold tracking-tight text-white/90'>Analysis Trend Over Time</h3>
            <p className='text-sm text-slate-400'>AI-derived engagement quality trends averaged by publish day.</p>
          </div>

          {chartData.hasAnalysisTrend ? (
            <div className='h-[300px] w-full'>
              <ChartContainer config={ANALYSIS_TREND_CONFIG} className='h-full w-full'>
                <LineChart data={chartData.analysisTrendData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke='#ffffff' strokeOpacity={0.05} />
                  <XAxis
                    dataKey='date'
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    width={45}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator='line'
                        formatter={(value, name) => (
                          <div className='flex w-full items-center justify-between gap-3'>
                            <span className='text-muted-foreground'>
                              {ANALYSIS_TREND_CONFIG[name as AnalysisTrendKey]?.label ?? name}
                            </span>
                            <span className='font-mono font-medium text-foreground'>
                              {formatPercentTooltipValue(value)}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type='monotone'
                    dataKey='engagement'
                    stroke='var(--color-engagement)'
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type='monotone'
                    dataKey='conversation'
                    stroke='var(--color-conversation)'
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type='monotone'
                    dataKey='amplification'
                    stroke='var(--color-amplification)'
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type='monotone'
                    dataKey='approval'
                    stroke='var(--color-approval)'
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          ) : (
            <div className='flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-white/8 bg-white/[0.015]'>
              <div className='text-center'>
                <p className='text-sm font-medium text-slate-300'>Analysis history is still thin.</p>
                <p className='mt-1 text-xs text-slate-500'>Recent posts with AI analysis will appear here over time.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
