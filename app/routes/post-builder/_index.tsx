import ContentCreation from '@/components/post-builder/ContentCreation';
import PostBuilderHeader from '@/components/post-builder/PostBuilderHeader';
import PreviewSection from '@/components/post-builder/PreviewSection';
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
    <div className='min-h-screen bg-[#050507]'>
      <PostBuilderHeader />

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
