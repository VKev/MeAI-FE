import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip
} from '@/components/ui/chart';
import type { SocialMedia } from '@/models/social-media.model';
import type { PlatformDashboardSummaryValue } from '@/models/post.model';
import {
  PLATFORM_CONFIG,
  METRIC_TREND_CONFIG,
  ANALYSIS_TREND_CONFIG,
  METRIC_TREND_KEYS,
  ANALYSIS_TREND_KEYS
} from './common/chart-types';
import { buildChartData, formatCompactTick, formatCompactValue, formatPercentValue } from './common/chart-utils';
import { TrendChart } from './common/TrendChart';

type DashboardOverviewChartsProps = {
  accounts: SocialMedia[];
  summaries: Map<string, PlatformDashboardSummaryValue | null>;
};

export function DashboardOverviewCharts({ accounts, summaries }: DashboardOverviewChartsProps) {
  const chartData = useMemo(() => buildChartData(accounts, summaries), [accounts, summaries]);

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
            <BarChart data={chartData.barData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
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
        <TrendChart
          title='Metric Trend Over Time'
          description='Daily movement across the latest synced posts from your connected accounts.'
          emptyMessage='Not enough timeline data yet.'
          emptySubtext='Publish more posts to unlock daily metric trends.'
          hasData={chartData.hasMetricTrend}
          data={chartData.metricTrendData}
          config={METRIC_TREND_CONFIG}
          dataKeys={[...METRIC_TREND_KEYS]}
          yFormatter={formatCompactTick}
          tooltipFormatter={formatCompactValue}
        />
        <TrendChart
          title='Analysis Trend Over Time'
          description='AI-derived engagement quality trends averaged by publish day.'
          emptyMessage='Analysis history is still thin.'
          emptySubtext='Recent posts with AI analysis will appear here over time.'
          hasData={chartData.hasAnalysisTrend}
          data={chartData.analysisTrendData}
          config={ANALYSIS_TREND_CONFIG}
          dataKeys={[...ANALYSIS_TREND_KEYS]}
          yFormatter={(v) => `${v}%`}
          tooltipFormatter={formatPercentValue}
        />
      </div>
    </div>
  );
}
