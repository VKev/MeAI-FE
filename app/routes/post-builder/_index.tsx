import ContentCreation from '@/components/post-builder/ContentCreation';
import PostBuilderHeader from '@/components/post-builder/PostBuilderHeader';
import PreviewSection from '@/components/post-builder/PreviewSection';
import usePostBuilder from '@/routes/post-builder/hooks/usePostBuilder';
import usePostBuilderHydration from '@/routes/post-builder/hooks/usePostBuilderHydration';
import usePostBuilderAutoSave from '@/routes/post-builder/hooks/usePostBuilderAutoSave';
import { PostBuilderClientApi } from '@/services/client/post-builder.client';
import useMediaResourceStore from '@/store/media-resource.store';
import { hasRole, requireUser } from '@/services/server/session.server';
import { useEffect } from 'react';
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
  const clearMediaResources = useMediaResourceStore((state) => state.clearMediaResources);

  const { data: postBuilderData } = useQuery({
    queryKey: ['post-builder', id],
    queryFn: () => PostBuilderClientApi.getPostBuilder(id!),
    enabled: !!id,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  usePostBuilderHydration(postBuilderData?.value);
  usePostBuilderAutoSave({
    builder: postBuilderData?.value,
    postBuilderId: id,
    workspaceId: workspaceId ?? null,
    debounceMs: 0
  });

  useEffect(() => {
    return () => {
      resetPostBuilder();
      clearMediaResources();
    };
  }, [id, resetPostBuilder, clearMediaResources]);

  return (
    <div className='min-h-screen bg-[#050507]'>
      <PostBuilderHeader workspaceId={workspaceId} />

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
