import type { PlatformPostAnalyticsValue } from '@/models/post.model';

export const mockFacebookAnalytics: PlatformPostAnalyticsValue = {
  socialMediaId: 'fb-social-001',
  platform: 'Facebook',
  platformPostId: 'fb-post-001',
  post: {
    platformPostId: 'fb-post-001',
    title: 'Spring Coffee Collection 2026',
    text: 'Introducing our vibrant new Spring Coffee Collection! ☕🌸 Each blend is crafted to bring warmth and creativity to your morning ritual.',
    description: null,
    mediaType: 'image',
    mediaUrl: null,
    thumbnailUrl: null,
    permalink: 'https://facebook.com/post/fb-post-001',
    shareUrl: 'https://facebook.com/post/fb-post-001',
    embedUrl: null,
    durationSeconds: null,
    publishedAt: '2026-03-16T10:30:00Z',
    stats: {
      views: 2340,
      likes: 187,
      comments: 42,
      replies: 8,
      shares: 18,
      reposts: null,
      quotes: null,
      totalInteractions: 255
    }
  },
  stats: {
    views: 2340,
    likes: 187,
    comments: 42,
    replies: 8,
    shares: 18,
    reposts: null,
    quotes: null,
    totalInteractions: 255
  },
  analysis: {
    engagementRateByViews: 10.9,
    conversationRateByViews: 1.8,
    amplificationRateByViews: 0.77,
    approvalRateByViews: 7.99,
    performanceBand: 'Good',
    highlights: [
      'Strong engagement rate, above average for image posts',
      'High comment-to-like ratio indicates resonant content',
      'Peak posting time captured morning audience effectively'
    ]
  },
  retrievedAt: '2026-03-24T13:00:00Z'
};

export const mockInstagramAnalytics: PlatformPostAnalyticsValue = {
  socialMediaId: 'ig-social-001',
  platform: 'Instagram',
  platformPostId: 'ig-post-001',
  post: {
    platformPostId: 'ig-post-001',
    title: 'Spring Coffee Collection 2026',
    text: '☕ New season, new beans. Our Spring Collection just dropped. Link in bio.',
    description: null,
    mediaType: 'image',
    mediaUrl: null,
    thumbnailUrl: null,
    permalink: 'https://instagram.com/p/ig-post-001',
    shareUrl: 'https://instagram.com/p/ig-post-001',
    embedUrl: null,
    durationSeconds: null,
    publishedAt: '2026-03-16T10:35:00Z',
    stats: {
      views: 4120,
      likes: 312,
      comments: 27,
      replies: 5,
      shares: 64,
      reposts: null,
      quotes: null,
      totalInteractions: 408
    }
  },
  stats: {
    views: 4120,
    likes: 312,
    comments: 27,
    replies: 5,
    shares: 64,
    reposts: null,
    quotes: null,
    totalInteractions: 408
  },
  analysis: {
    engagementRateByViews: 9.9,
    conversationRateByViews: 0.66,
    amplificationRateByViews: 1.55,
    approvalRateByViews: 7.57,
    performanceBand: 'Good',
    highlights: [
      'Higher reach than Facebook due to hashtag discoverability',
      'Save-to-like ratio is strong — content has long-term value',
      'Story reshares drove 40% of total shares'
    ]
  },
  retrievedAt: '2026-03-24T13:05:00Z'
};

export const mockTikTokAnalytics: PlatformPostAnalyticsValue = {
  socialMediaId: 'tt-social-001',
  platform: 'TikTok',
  platformPostId: 'tt-post-001',
  post: {
    platformPostId: 'tt-post-001',
    title: 'Spring Coffee Collection 2026',
    text: 'POV: your morning coffee just got an upgrade ☕✨ #SpringCoffee #AuraBrew #MorningVibes',
    description: null,
    mediaType: 'video',
    mediaUrl: null,
    thumbnailUrl: null,
    permalink: 'https://tiktok.com/@meai/video/tt-post-001',
    shareUrl: 'https://tiktok.com/@meai/video/tt-post-001',
    embedUrl: null,
    durationSeconds: 45,
    publishedAt: '2026-03-16T11:00:00Z',
    stats: {
      views: 12800,
      likes: 1420,
      comments: 89,
      replies: 34,
      shares: 156,
      reposts: null,
      quotes: null,
      totalInteractions: 1699
    }
  },
  stats: {
    views: 12800,
    likes: 1420,
    comments: 89,
    replies: 34,
    shares: 156,
    reposts: null,
    quotes: null,
    totalInteractions: 1699
  },
  analysis: {
    engagementRateByViews: 13.27,
    conversationRateByViews: 0.7,
    amplificationRateByViews: 1.22,
    approvalRateByViews: 11.09,
    performanceBand: 'Excellent',
    highlights: [
      'Exceptional view count for a new account',
      'Video completion rate suggests strong hook in first 3 seconds',
      'Share rate well above platform average, indicating viral potential'
    ]
  },
  retrievedAt: '2026-03-24T13:00:00Z'
};

export const mockThreadsAnalytics: PlatformPostAnalyticsValue = {
  socialMediaId: 'th-social-001',
  platform: 'Threads',
  platformPostId: 'th-post-001',
  post: {
    platformPostId: 'th-post-001',
    title: 'Spring Coffee Collection 2026',
    text: 'New season calls for new flavors. Our Spring Collection is here — which blend are you starting with?',
    description: null,
    mediaType: 'image',
    mediaUrl: null,
    thumbnailUrl: null,
    permalink: 'https://threads.net/@meai/post/th-post-001',
    shareUrl: 'https://threads.net/@meai/post/th-post-001',
    embedUrl: null,
    durationSeconds: null,
    publishedAt: '2026-03-16T11:05:00Z',
    stats: {
      views: 1860,
      likes: 94,
      comments: 31,
      replies: 18,
      shares: 12,
      reposts: 8,
      quotes: 5,
      totalInteractions: 168
    }
  },
  stats: {
    views: 1860,
    likes: 94,
    comments: 31,
    replies: 18,
    shares: 12,
    reposts: 8,
    quotes: 5,
    totalInteractions: 168
  },
  analysis: {
    engagementRateByViews: 9.03,
    conversationRateByViews: 1.67,
    amplificationRateByViews: 0.65,
    approvalRateByViews: 5.05,
    performanceBand: 'Average',
    highlights: [
      'Reply rate is high — content sparked genuine conversation',
      'Quote posts indicate opinion-forming content',
      'Performance is typical for a new Threads account'
    ]
  },
  retrievedAt: '2026-03-24T13:10:00Z'
};

/** Map: socialMediaId → analytics data */
export const mockAnalyticsMap: Record<string, PlatformPostAnalyticsValue> = {
  'fb-social-001': mockFacebookAnalytics,
  'ig-social-001': mockInstagramAnalytics,
  'tt-social-001': mockTikTokAnalytics,
  'th-social-001': mockThreadsAnalytics
};
