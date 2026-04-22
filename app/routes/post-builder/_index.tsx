import ContentCreation from '@/components/post-builder/ContentCreation';
import PostBuilderHeader from '@/components/post-builder/PostBuilderHeader';
import PreviewSection from '@/components/post-builder/PreviewSection';
import usePostBuilder, { type PostBuilderMode, type PostBuilderPlatform } from '@/routes/post-builder/hooks/usePostBuilder';
import {
  buildPlatformPublishStates,
  buildSavedMediaSelections
} from '@/routes/post-builder/hooks/publish-utils';
import { PostBuilderClientApi } from '@/services/client/post-builder.client';
import useMediaResourceStore, { type TMediaResource } from '@/store/media-resource.store';
import { hasRole, requireUser } from '@/services/server/session.server';
import { consumePublishContinuation } from '@/utils/social-workspace-autolink';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { redirect, type LoaderFunctionArgs, useParams } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  if (!hasRole(user, 'user')) {
    throw redirect('/forbidden');
  }

  return { user };
}

function PostBuilderLayout() {
  const { id, workspaceId } = useParams();
  const resetPostBuilder = usePostBuilder((state) => state.reset);
  const setPlatformPublishStates = usePostBuilder((state) => state.setPlatformPublishStates);
  const setSelectedMediaIds = usePostBuilder((state) => state.setSelectedMediaIds);
  const setPlatformContent = usePostBuilder((state) => state.setPlatformContent);
  const setActivePlatform = usePostBuilder((state) => state.setActivePlatform);
  const setMediaResources = useMediaResourceStore((state) => state.setMediaResources);
  const clearMediaResources = useMediaResourceStore((state) => state.clearMediaResources);

  // Read a pre-OAuth continuation snapshot once on mount. Capturing it in state (not a
  // ref) lets PostBuilderHeader consume the auto-open flag via prop on the first render.
  const [continuation] = useState(() => (id ? consumePublishContinuation(id) : null));

  const { data: postBuilderData } = useQuery({
    queryKey: ['post-builder', id],
    queryFn: () => PostBuilderClientApi.getPostBuilder(id!),
    enabled: !!id,
    // Always hit the server on mount so a SPA navigation in from the product grid
    // doesn't serve a stale cache that renders as an empty builder.
    refetchOnMount: 'always'
  });

  useEffect(() => {
    if (!postBuilderData?.value) return;

    const states = buildPlatformPublishStates(postBuilderData.value);
    setPlatformPublishStates(states);

    // Rehydrate per-(platform, mode) media selection so re-entering a published builder
    // shows the same chosen media it had at publish time instead of a blank gallery.
    const savedSelections = buildSavedMediaSelections(postBuilderData.value);
    for (const { platform, mode, resourceIds } of savedSelections) {
      setSelectedMediaIds(platform, mode, resourceIds);
    }
  }, [postBuilderData, setPlatformPublishStates, setSelectedMediaIds]);

  useEffect(() => {
    // NOTE: intentionally NO `resetPostBuilder()` / `clearMediaResources()` on mount.
    //
    // Children (ContentCreation.loadSavedCaptions, etc.) run their effects BEFORE
    // the parent does. If we reset here on mount, we'd wipe everything they just
    // seeded — which is exactly what made post-builder render empty on a SPA nav
    // from the product grid (React Query cache hit → children seed from cache →
    // parent resets → blank page until manual reload re-fetches).
    //
    // Cleanup (unmount OR `id` change) still wipes so the NEXT builder starts clean.
    // Since `usePostBuilder` is not persisted, the very first visit starts clean
    // too — we don't need a mount-time reset.
    if (continuation) {
      const platforms = Object.keys(continuation.platformContents) as PostBuilderPlatform[];
      for (const platform of platforms) {
        const modes = Object.keys(continuation.platformContents[platform] ?? {}) as PostBuilderMode[];
        for (const mode of modes) {
          const bucket = continuation.platformContents[platform]?.[mode];
          if (!bucket) continue;
          setPlatformContent(platform, mode, { content: bucket.text, htmlContent: bucket.html });
        }
      }
      if (continuation.activePlatform) {
        setActivePlatform(continuation.activePlatform as PostBuilderPlatform);
      }
    }

    return () => {
      resetPostBuilder();
      clearMediaResources();
    };
  }, [id, resetPostBuilder, clearMediaResources, continuation, setPlatformContent, setActivePlatform]);

  useEffect(() => {
    if (!postBuilderData?.value) return;

    const mediaMap = new Map<string, { id: string; name: string; type: string; url?: string; thumbnail_url: string }>();

    for (const group of postBuilderData.value.socialMedia) {
      for (const post of group.posts) {
        for (const media of post.media) {
          if (mediaMap.has(media.resourceId)) continue;

          const isVideo = media.contentType?.startsWith('video/') || media.resourceType === 'video';
          mediaMap.set(media.resourceId, {
            id: media.resourceId,
            name: media.resourceId,
            type: isVideo ? 'video' : 'image',
            url: media.presignedUrl,
            thumbnail_url: media.presignedUrl
          });
        }
      }
    }

    const resources = Array.from(mediaMap.values());
    if (resources.length > 0) {
      // MERGE into the existing store instead of replacing. The user may have just imported
      // new media via Import-from-Library (MediaSelection) which lives in the store but
      // isn't attached to any post yet, so `post.media` won't include it. A full replace
      // would wipe those fresh imports and make the tile flicker then disappear.
      const currentResources = useMediaResourceStore.getState().mediaResources;
      const merged = new Map<string, TMediaResource>();
      for (const r of currentResources) merged.set(r.id, r);
      for (const r of resources) merged.set(r.id, r);
      setMediaResources(Array.from(merged.values()));
    }
  }, [postBuilderData, setMediaResources]);

  return (
    <div className='min-h-screen bg-[#050507]'>
      <PostBuilderHeader workspaceId={workspaceId} autoOpenPublishDialog={!!continuation} />

      <main className='mx-auto grid w-full max-w-400 gap-6 px-4 py-6 lg:grid-cols-5 lg:items-start lg:px-6'>
        <section className='sticky top-24 lg:col-span-2 lg:self-start'>
          <ContentCreation />
        </section>
        <section className='lg:col-span-3'>
          <PreviewSection />
        </section>
      </main>
    </div>
  );
}

export default PostBuilderLayout;
