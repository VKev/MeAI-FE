import PostDetailView from '@/components/post/PostDetailView';
import { mockAnalyticsMap } from '@/data/mock-post-analytics';
import { mockUserPosts } from '@/data/mock-posts';
import { fetchPostById, fetchPlatformPostAnalytics } from '@/services/client/post.client';
import type { PlatformPostAnalyticsValue } from '@/models/post.model';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { useState, useEffect } from 'react';

export default function ProductDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const useMockData = true;

  const { data: postData, isLoading: isLoadingPost } = useQuery({
    queryKey: ['post', postId],
    queryFn: ({ signal }) => fetchPostById(postId!, signal),
    enabled: !useMockData && Boolean(postId)
  });

  const post = useMockData
    ? mockUserPosts.find((p) => p.id === postId) ?? mockUserPosts[0]
    : postData?.value ?? null;

  const [analyticsMap, setAnalyticsMap] = useState<Record<string, PlatformPostAnalyticsValue>>({});
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (useMockData && post) {
      const mockMap: Record<string, PlatformPostAnalyticsValue> = {};
      post.publications?.forEach((pub) => {
        const platform = pub.socialMediaType?.toLowerCase();
        if (platform === 'facebook') {
          mockMap[pub.socialMediaId] = mockAnalyticsMap['fb-social-001'];
        } else if (platform === 'instagram') {
          mockMap[pub.socialMediaId] = mockAnalyticsMap['ig-social-001'];
        } else if (platform === 'tiktok') {
          mockMap[pub.socialMediaId] = mockAnalyticsMap['tt-social-001'];
        } else if (platform === 'threads') {
          mockMap[pub.socialMediaId] = mockAnalyticsMap['th-social-001'];
        }
      });
      setAnalyticsMap(mockMap);
      return;
    }

    if (!useMockData && post?.publications) {
      setIsLoadingAnalytics(true);
      Promise.all(
        post.publications
          .filter((pub) => pub.externalContentId)
          .map((pub) =>
            fetchPlatformPostAnalytics(pub.socialMediaId, pub.externalContentId!)
              .then((res) => ({ socialMediaId: pub.socialMediaId, data: res.value }))
              .catch(() => null)
          )
      ).then((results) => {
        const map: Record<string, PlatformPostAnalyticsValue> = {};
        results.forEach((r) => {
          if (r?.data) map[r.socialMediaId] = r.data;
        });
        setAnalyticsMap(map);
        setIsLoadingAnalytics(false);
      });
    }
  }, [post?.id, useMockData]);

  const handleRefreshAnalytics = async (socialMediaId: string, platformPostId: string) => {
    try {
      const res = await fetchPlatformPostAnalytics(socialMediaId, platformPostId, true);
      if (res.value) {
        setAnalyticsMap((prev) => ({ ...prev, [socialMediaId]: res.value! }));
      }
    } catch {
    }
  };

  return (
    <PostDetailView
      post={post as any}
      analyticsMap={analyticsMap}
      isLoadingPost={useMockData ? false : isLoadingPost}
      isLoadingAnalytics={isLoadingAnalytics}
      onBack={() => navigate('/user/product')}
      onRefreshAnalytics={useMockData ? undefined : handleRefreshAnalytics}
    />
  );
}
