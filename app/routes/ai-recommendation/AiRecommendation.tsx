import DialogError from '@/components/common/DialogError';
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import { hasRole, requireUser } from '@/services/server/session.server';
import { useCurrentUser } from '@/utils/user-state';
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

  if (!correlationId) {
    return null;
  }

  return (
    <>
      <div className='min-h-screen bg-[#050507]'>
        <WorkspaceHeader key={'header'} user={user} />
        <div className='flex h-[calc(100vh-4rem)]'>
          <main className='flex-1 flex h-full w-full overflow-auto'>
            <div>AiRecommendation</div>
          </main>
        </div>
      </div>
      {/* <DialogError isOpen={true} /> */}
    </>
  );
}

export default AiRecommendation;
