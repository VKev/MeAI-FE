import { redirect, useParams, type LoaderFunctionArgs } from 'react-router';
import { WorkspaceBuilderContent } from '@/components/workspace/WorkspaceBuilderContent';
import { WorkspaceImageSidebar } from '@/components/workspace/WorkspaceImageSidebar';
import { WorkspaceVideoSidebar } from '@/components/workspace/WorkspaceVideoSidebar';
import { useGeneration } from './hooks/useGeneration';
import { useCurrentUser } from '@/utils/user-state';
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import { hasRole, requireUser } from '@/services/server/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);

  if (!hasRole(sessionUser, 'user')) {
    throw redirect('/forbidden');
  }

  return null;
}

export default function WorkspaceGeneration() {
  const { mode } = useParams();
  const user = useCurrentUser();
  const generationMode = mode === 'video' ? 'video' : 'image';
  const { prompt, setPrompt, imageConfig, videoConfig, updateImageConfig, updateVideoConfig } = useGeneration();

  return (
    <div className='min-h-screen bg-[#050507]'>
      <WorkspaceHeader key={'workspace-header'} user={user} />
      <div className='flex h-[calc(100vh-4rem)]'>
        <main className='flex-1 flex h-full w-full overflow-auto'>
          {generationMode === 'video' ? (
            <WorkspaceVideoSidebar config={videoConfig} onConfigChange={updateVideoConfig} />
          ) : (
            <WorkspaceImageSidebar config={imageConfig} onConfigChange={updateImageConfig} />
          )}
          <WorkspaceBuilderContent
            prompt={prompt}
            setPrompt={setPrompt}
            generationMode={generationMode}
            imageConfig={imageConfig}
            videoConfig={videoConfig}
          />
        </main>
      </div>
    </div>
  );
}
