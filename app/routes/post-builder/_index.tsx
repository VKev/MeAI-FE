import PostBuilderHeader from '@/components/post-builder/PostBuilderHeader';
import { TiktokPreview } from '@/components/preview/Tiktok';
import { hasRole, requireUser } from '@/services/server/session.server';
import { redirect, type LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  if (!hasRole(user, 'user')) {
    throw redirect('/forbidden');
  }

  return { user };
}

function PostBuilderLayout() {
  return (
    <>
      <PostBuilderHeader />
      <TiktokPreview />
    </>
  );
}

export default PostBuilderLayout;
