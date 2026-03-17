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
    <div className='relative min-h-screen overflow-hidden bg-[#050507]'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute inset-0 landing-grid opacity-30' />
        <div className='absolute inset-0 bg-[radial-gradient(52%_44%_at_50%_-12%,rgba(132,92,235,0.3),rgba(132,92,235,0)_72%)]' />
        <div className='absolute -left-36 top-[28%] h-72 w-72 rounded-full bg-[#7a45f3]/16 blur-[110px]' />
        <div className='absolute -right-32 top-[16%] h-80 w-80 rounded-full bg-[#df83ef]/14 blur-[120px]' />
        <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,7,0.12)_0%,rgba(5,5,7,0.72)_72%,#050507_100%)]' />
      </div>

      <PostBuilderHeader />

      <main className='mx-auto grid w-full max-w-400 gap-6 px-4 py-6 lg:grid-cols-5 lg:px-6'>
        <section className='lg:col-span-2'>
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
