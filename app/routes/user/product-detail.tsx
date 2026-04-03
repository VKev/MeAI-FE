import PostDetailView from '@/components/post/PostDetailView';

import { fetchPostById, fetchPlatformPostAnalytics } from '@/services/client/post.client';
import type { PlatformPostAnalyticsValue } from '@/models/post.model';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { useState, useEffect } from 'react';

export default function ProductDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();

  const { data: postData, isLoading: isLoadingPost } = useQuery({
    queryKey: ['post', postId],
    queryFn: ({ signal }) => fetchPostById(postId!, signal),
    enabled: Boolean(postId)
  });

  const post = postData?.value ?? null;

  const [analyticsMap, setAnalyticsMap] = useState<Record<string, PlatformPostAnalyticsValue>>({});
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (post?.publications) {
      setIsLoadingAnalytics(true);
      Promise.all(
        post.publications
          .filter((pub: any) => pub.externalContentId)
          .map((pub: any) =>
            fetchPlatformPostAnalytics(pub.socialMediaId, pub.externalContentId!)
              .then((res) => ({ socialMediaId: pub.socialMediaId, data: res.value }))
              .catch(() => null)
          )
      ).then((results) => {
        const map: Record<string, PlatformPostAnalyticsValue> = {};
        results.forEach((r: any) => {
          if (r?.data) map[r.socialMediaId] = r.data;
        });
        setAnalyticsMap(map);
        setIsLoadingAnalytics(false);
      });
    }
  }, [post?.id]);

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
      isLoadingPost={isLoadingPost}
      isLoadingAnalytics={isLoadingAnalytics}
      onBack={() => navigate('/user/product')}
      onRefreshAnalytics={handleRefreshAnalytics}
    />
  );
}
