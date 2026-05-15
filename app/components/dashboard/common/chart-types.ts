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
  facebook: { label: 'Facebook', color: '#0866FF' },
  instagram: { label: 'Instagram', color: '#E4405F' },
  tiktok: { label: 'TikTok', color: '#ffffffff' },
  threads: { label: 'Threads', color: '#00f7ffff' }
} as const;

export const PLATFORM_KEYS = Object.keys(PLATFORM_CONFIG) as ChartPlatform[];

export const METRIC_TREND_CONFIG = {
  audience: { label: 'Audience', color: '#3B82F6' },
  likes: { label: 'Likes', color: '#F43F5E' },
  comments: { label: 'Comments', color: '#F59E0B' },
  shares: { label: 'Shares', color: '#10B981' }
} as const;

export const ANALYSIS_TREND_CONFIG = {
  engagement: { label: 'Engagement Rate', color: '#8B5CF6' },
  conversation: { label: 'Conversation Rate', color: '#06B6D4' },
  amplification: { label: 'Amplification Rate', color: '#EC4899' },
  approval: { label: 'Approval Rate', color: '#FACC15' }
} as const;

export const METRIC_TREND_KEYS = ['audience', 'likes', 'comments', 'shares'] as const;
export const ANALYSIS_TREND_KEYS = ['engagement', 'conversation', 'amplification', 'approval'] as const;
