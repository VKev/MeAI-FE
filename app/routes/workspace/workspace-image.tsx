import { WorkspaceImageSidebar } from '@/components/workspace/WorkspaceImageSidebar';

export default function WorkspaceImage() {
  return (
    <div className='flex h-[calc(100vh-4rem)]'>
      <WorkspaceImageSidebar />
      <main>workspace layout</main>
    </div>
  );
}
