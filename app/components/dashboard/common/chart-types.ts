export type ChartPlatform = 'facebook' | 'instagram' | 'tiktok' | 'threads';

export type ChartRow = { metric: string } & Record<ChartPlatform, number>;

export type SeriesAccumulator = {
  sum: number;
  count: number;
};

export type TrendRow = {
  date: string;
  audience: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  engagement: number | null;
  conversation: number | null;
  amplification: number | null;
  approval: number | null;
  sampleSize: number;
};

export type TrendChartProps = {
  title: string;
  description: string;
  emptyMessage: string;
  emptySubtext: string;
  hasData: boolean;
  data: Record<string, unknown>[];
  config: Record<string, { label: string; color: string }>;
  dataKeys: string[];
  yFormatter: (value: number) => string;
  tooltipFormatter: (value: unknown) => string;
};

export const PLATFORM_CONFIG = {
  facebook: { label: 'Facebook', color: '#3b5998' },
  instagram: { label: 'Instagram', color: '#e1306c' },
  tiktok: { label: 'TikTok', color: '#25F4EE' },
  threads: { label: 'Threads', color: '#f5f5f5' }
} as const;

export const PLATFORM_KEYS = Object.keys(PLATFORM_CONFIG) as ChartPlatform[];

export const METRIC_TREND_CONFIG = {
  audience: { label: 'Audience', color: '#60a5fa' },
  likes: { label: 'Likes', color: '#fb7185' },
  comments: { label: 'Comments', color: '#f59e0b' },
  shares: { label: 'Shares', color: '#34d399' }
} as const;

export const ANALYSIS_TREND_CONFIG = {
  engagement: { label: 'Engagement Rate', color: '#818cf8' },
  conversation: { label: 'Conversation Rate', color: '#38bdf8' },
  amplification: { label: 'Amplification Rate', color: '#f472b6' },
  approval: { label: 'Approval Rate', color: '#fbbf24' }
} as const;

export const METRIC_TREND_KEYS = ['audience', 'likes', 'comments', 'shares'] as const;
export const ANALYSIS_TREND_KEYS = ['engagement', 'conversation', 'amplification', 'approval'] as const;
