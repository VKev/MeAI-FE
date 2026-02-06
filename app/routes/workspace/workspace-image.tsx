import { WorkspaceImageSidebar } from '@/components/workspace/WorkspaceImageSidebar';
import { WorkspaceImageContent } from '@/components/workspace/WorkspaceImageContent';

export default function WorkspaceImage() {
  return (
    <div className='flex h-[calc(100vh-4rem)]'>
      <WorkspaceImageSidebar />
      <WorkspaceImageContent />
    </div>
  );
}
