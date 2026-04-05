import { useParams } from 'react-router';
import { WorkspaceBuilderContent } from '@/components/workspace/WorkspaceBuilderContent';
import { WorkspaceImageSidebar } from '@/components/workspace/WorkspaceImageSidebar';
import { WorkspaceVideoSidebar } from '@/components/workspace/WorkspaceVideoSidebar';
import { useGeneration } from './hooks/useGeneration';

export default function WorkspaceGeneration() {
  const { mode } = useParams();
  const generationMode = mode === 'video' ? 'video' : 'image';
  const { prompt, setPrompt, imageConfig, videoConfig, updateImageConfig, updateVideoConfig } = useGeneration();

  return (
    <div className='flex h-full w-full'>
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
    </div>
  );
}
