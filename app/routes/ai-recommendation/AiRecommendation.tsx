import DialogError from '@/components/common/DialogError';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import { fetchPostById } from '@/services/client/post.client';
import { hasRole, requireUser } from '@/services/server/session.server';
import { useCurrentUser } from '@/utils/user-state';
import { useQuery } from '@tanstack/react-query';
import { BotIcon, RefreshCcw } from 'lucide-react';
import { useEffect } from 'react';
import { redirect, useParams, type LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  if (!hasRole(user, 'user')) {
    throw redirect('/forbidden');
  }

  return { user };
}

function AiRecommendation() {
  const { resultPostId } = useParams();
  const user = useCurrentUser();

  // const { data, isLoading, isError, error } = useQuery({
  //   queryKey: ['ai-recommendation-draft-post', correlationId],
  //   queryFn: () => fetchAiRecommendationDraftPost(correlationId!),
  //   enabled: Boolean(correlationId)
  // });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ai-recommendation-draft-post', resultPostId],
    queryFn: () => fetchPostById(resultPostId!),
    enabled: Boolean(resultPostId)
  });

  useEffect(() => {
    if (data) {
      console.log(data);
    }
  }, [data]);

  if (!resultPostId) {
    return null;
  }

  return (
    <>
      <div className='space-y-8'>
        {/* header */}
        <section className='overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8 relative flex items-center justify-between'>
          <div className='absolute top-0 right-0 w-1/3 h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none' />

          <div className='flex items-center gap-4 relative z-10'>
            <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'>
              <BotIcon className='h-7 w-7' />
            </div>

            <div className='space-y-1'>
              <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>AI Recommendation</h1>
              <p className='text-sm leading-relaxed text-slate-400'>View the AI-generated recommendation.</p>
            </div>
          </div>

          {/* <Button
            type='button'
            variant='outline'
            // onClick={handleRefresh}
            // disabled={isFetching}
            className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white px-6 relative z-10'
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${false ? 'animate-spin' : ''}`} />
            Sync Now
          </Button> */}
        </section>

        {/* breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href='/user'>Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href='/user/product'>Products</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>AI Recommendation</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {!isLoading && !isError && (
          <pre className='whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/3 p-4 text-sm text-slate-300'>
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
      {isError && <DialogError isOpen={isError} />}
    </>
  );
}

export default AiRecommendation;
