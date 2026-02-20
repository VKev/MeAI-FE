import { WorkspaceBuilderContent } from '@/components/workspace/WorkspaceBuilderContent';
import { WorkspaceVideoSidebar } from '@/components/workspace/WorkspaceVideoSidebar';

export default function WorkspaceVideo() {
  return (
    <div className='flex h-full w-full'>
      <WorkspaceVideoSidebar />
      <WorkspaceBuilderContent />
    </div>
  );
}
