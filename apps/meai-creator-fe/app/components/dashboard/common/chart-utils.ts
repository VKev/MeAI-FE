import type { PlatformDashboardSummaryValue, PlatformPostStats } from '@/models/post.model';
import type { SocialMedia } from '@/models/social-media.model';
import type { ChartPlatform, ChartRow, SeriesAccumulator, TrendRow } from './chart-types';
import { PLATFORM_KEYS } from './chart-types';

export function isChartPlatform(value: string): value is ChartPlatform {
  return PLATFORM_KEYS.includes(value as ChartPlatform);
}

export function createAccumulator(): SeriesAccumulator {
  return { sum: 0, count: 0 };
}

export function addNullableValue(acc: SeriesAccumulator, value: number | null | undefined) {
  if (value != null) {
    acc.sum += value;
    acc.count += 1;
  }
}

export function getSummedValue(acc: SeriesAccumulator) {
  return acc.count > 0 ? acc.sum : null;
}

export function getAverageValue(acc: SeriesAccumulator) {
  return acc.count > 0 ? Number((acc.sum / acc.count).toFixed(1)) : null;
}

export function getAudienceMetric(stats: PlatformPostStats | null | undefined) {
  if (!stats) return null;
  return stats.reach != null && (stats.views == null || stats.views === stats.reach) ? stats.reach : stats.views;
}

function hasDistinctViewMetric(summary: PlatformDashboardSummaryValue | null) {
  const stats = summary?.aggregatedStats;
  return stats?.views != null && (stats.reach == null || stats.views !== stats.reach);
}

function toDateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
}

function formatTrendDate(dateKey: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${dateKey}T00:00:00`));
}

export function formatCompactTick(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatCompactValue(value: unknown) {
  return typeof value === 'number'
    ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
    : 'N/A';
}

export function formatPercentValue(value: unknown) {
  return typeof value === 'number' ? `${value.toFixed(1)}%` : 'N/A';
}

export function hasAnyTrendData(rows: Record<string, unknown>[], keys: readonly string[]) {
  return rows.some((row) => keys.some((key) => typeof row[key] === 'number'));
}

function createEmptyTrendBucket() {
  return {
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
}

export function buildChartData(accounts: SocialMedia[], summaries: Map<string, PlatformDashboardSummaryValue | null>) {
  let showViewsMetric = false;
  const activePlatforms = new Set<ChartPlatform>();
  const totals = {
    views: Object.fromEntries(PLATFORM_KEYS.map((p) => [p, 0])) as Record<ChartPlatform, number>,
    likes: Object.fromEntries(PLATFORM_KEYS.map((p) => [p, 0])) as Record<ChartPlatform, number>,
    comments: Object.fromEntries(PLATFORM_KEYS.map((p) => [p, 0])) as Record<ChartPlatform, number>,
    shares: Object.fromEntries(PLATFORM_KEYS.map((p) => [p, 0])) as Record<ChartPlatform, number>
  };
  const trendBuckets = new Map<string, ReturnType<typeof createEmptyTrendBucket>>();

  for (const account of accounts) {
    const summary = summaries.get(account.id);
    if (!summary) continue;

    const type = account.type.toLowerCase();
    if (!isChartPlatform(type)) continue;

    const distinctViews = hasDistinctViewMetric(summary);
    showViewsMetric = showViewsMetric || distinctViews;
    activePlatforms.add(type);

    const stats = summary.aggregatedStats;
    totals.views[type] += distinctViews ? stats.views || 0 : 0;
    totals.likes[type] += stats.likes || 0;
    totals.comments[type] += stats.comments || 0;
    totals.shares[type] += stats.shares || 0;

    for (const item of summary.posts) {
      if (!item.post.publishedAt) continue;
      const dateKey = toDateKey(item.post.publishedAt);
      if (!dateKey) continue;

      const bucket = trendBuckets.get(dateKey) ?? createEmptyTrendBucket();
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

  const buildRow = (metric: string, metricTotals: Record<ChartPlatform, number>): ChartRow => ({
    metric,
    ...(Object.fromEntries(PLATFORM_KEYS.map((p) => [p, metricTotals[p]])) as Record<ChartPlatform, number>)
  });

  const barData: ChartRow[] = [
    ...(showViewsMetric ? [buildRow('Views', totals.views)] : []),
    buildRow('Likes', totals.likes),
    buildRow('Comments', totals.comments),
    buildRow('Shares', totals.shares)
  ];

  const sortedTrends: TrendRow[] = Array.from(trendBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
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

  const metricTrendData = sortedTrends.filter(
    (r) => r.audience != null || r.likes != null || r.comments != null || r.shares != null
  );
  const analysisTrendData = sortedTrends.filter(
    (r) => r.engagement != null || r.conversation != null || r.amplification != null || r.approval != null
  );

  return {
    barData,
    isDataEmpty: barData.every((row) => PLATFORM_KEYS.every((p) => row[p] === 0)),
    activePlatforms: Array.from(activePlatforms),
    metricTrendData,
    analysisTrendData,
    hasMetricTrend: hasAnyTrendData(metricTrendData, ['audience', 'likes', 'comments', 'shares']),
    hasAnalysisTrend: hasAnyTrendData(analysisTrendData, ['engagement', 'conversation', 'amplification', 'approval'])
  };
}
