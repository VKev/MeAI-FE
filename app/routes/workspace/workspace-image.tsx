import { WorkspaceImageSidebar } from '@/components/workspace/WorkspaceImageSidebar';
import { WorkspaceBuilderContent } from '@/components/workspace/WorkspaceBuilderContent';

export default function WorkspaceImage() {
  return (
    <div className='flex h-full w-full'>
      <WorkspaceImageSidebar />
      <WorkspaceBuilderContent />
    </div>
  );
}
