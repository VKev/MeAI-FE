import DialogError from '@/components/common/DialogError';
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import { fetchAiRecommendationDraftPost } from '@/services/client/ai-recommendation.client';
import { hasRole, requireUser } from '@/services/server/session.server';
import { useCurrentUser } from '@/utils/user-state';
import { useQuery } from '@tanstack/react-query';
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
  const { correlationId } = useParams();
  const user = useCurrentUser();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['ai-recommendation-draft-post', correlationId],
    queryFn: () => fetchAiRecommendationDraftPost(correlationId!),
    enabled: Boolean(correlationId)
  });

  useEffect(() => {
    if (data) {
      console.log(data);
    }
  }, [data]);

  if (!correlationId) {
    return null;
  }

  return (
    <>
      <div className='min-h-screen bg-[#050507]'>
        <WorkspaceHeader key={'header'} user={user} />
        <div className='flex h-[calc(100vh-4rem)]'>
          <main className='flex-1 flex h-full w-full overflow-auto'>
            <div className='w-full p-6 text-slate-200'>
              {!isLoading && !isError && (
                <pre className='whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/3 p-4 text-sm text-slate-300'>
                  {JSON.stringify(data, null, 2)}
                </pre>
              )}
            </div>
          </main>
        </div>
      </div>
      {isError && <DialogError isOpen={isError} />}
    </>
  );
}

export default AiRecommendation;
