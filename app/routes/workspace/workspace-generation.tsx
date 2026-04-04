import { useMemo } from 'react';
import { useParams } from 'react-router';
import { WorkspaceBuilderContent } from '@/components/workspace/WorkspaceBuilderContent';
import { WorkspaceImageSidebar } from '@/components/workspace/WorkspaceImageSidebar';
import { WorkspaceVideoSidebar } from '@/components/workspace/WorkspaceVideoSidebar';
import { useCallback } from 'react';

export default function WorkspaceGeneration() {
  const { mode } = useParams();
  const generationMode = useMemo(() => (mode === 'video' ? 'video-generation' : 'image-generation'), [mode]);

  const renderVideoSidebar = useCallback(() => <WorkspaceVideoSidebar />, []);
  const renderImageSidebar = useCallback(() => <WorkspaceImageSidebar />, []);

  return (
    <div className='flex h-full w-full'>
      {generationMode === 'video-generation' ? renderVideoSidebar() : renderImageSidebar()}
      <WorkspaceBuilderContent />
    </div>
  );
}
