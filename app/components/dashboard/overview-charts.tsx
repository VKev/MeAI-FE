import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip
} from '@/components/ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Sparkles } from 'lucide-react';
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
      <Tabs defaultValue='engagement' className='w-full'>
        <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h3 className='text-xl font-bold tracking-tight text-white'>Performance Analytics</h3>
            <p className='text-sm text-slate-400'>Deep dive into your social footprint and audience growth.</p>
          </div>
          <TabsList className='grid h-11 w-full grid-cols-3 bg-white/5 p-1 sm:w-[400px]'>
            <TabsTrigger value='engagement' className='flex items-center gap-2 text-xs font-semibold'>
              <BarChart3 className='h-3.5 w-3.5' /> Engagement
            </TabsTrigger>
            <TabsTrigger value='metrics' className='flex items-center gap-2 text-xs font-semibold'>
              <TrendingUp className='h-3.5 w-3.5' /> Trends
            </TabsTrigger>
            <TabsTrigger value='analysis' className='flex items-center gap-2 text-xs font-semibold'>
              <Sparkles className='h-3.5 w-3.5' /> AI Analysis
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value='engagement' className='mt-0 outline-none'>
          <div className='rounded-3xl border border-white/5 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_55%),linear-gradient(180deg,rgba(11,13,24,0.92)_0%,rgba(7,9,16,0.98)_100%)] p-6 shadow-2xl backdrop-blur-3xl'>
            <div className='mb-6'>
              <h4 className='text-base font-semibold text-white/90'>Aggregated Engagement</h4>
              <p className='text-xs text-slate-500 mt-1'>Comparing total metrics across your connected platforms.</p>
            </div>
            <div className='h-[240px] w-full'>
              <ChartContainer config={PLATFORM_CONFIG} className='h-full w-full'>
                <BarChart data={chartData.barData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke='#ffffff' strokeOpacity={0.05} />
                  <XAxis
                    dataKey='metric'
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    tickFormatter={formatCompactTick}
                    tick={{ fill: '#475569', fontSize: 11 }}
                    width={45}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator='dashed' />} />
                  <ChartLegend content={<ChartLegendContent className='pt-4' />} />
                  {chartData.activePlatforms.map((platform) => (
                    <Bar
                      key={platform}
                      dataKey={platform}
                      fill={`var(--color-${platform})`}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value='metrics' className='mt-0 outline-none'>
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
            height={240}
          />
        </TabsContent>

        <TabsContent value='analysis' className='mt-0 outline-none'>
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
            height={240}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
