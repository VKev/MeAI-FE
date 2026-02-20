import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Video } from 'lucide-react';

export default function WorkspaceTabNavigator({
  currentTab,
  handleTabChange
}: {
  currentTab: string;
  handleTabChange: (value: string) => void;
}) {
  return (
    <Tabs value={currentTab} onValueChange={handleTabChange}>
      <TabsList className='bg-gray-900 border-none p-0 h-auto gap-2'>
        <TabsTrigger
          value='image-generation'
          className='flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent text-gray-300 hover:text-white hover:bg-gray-800/50 border-none ring-1 ring-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:ring-1 data-[state=active]:ring-purple-600'
        >
          <Image className='w-4 h-4' />
          <span>Image</span>
        </TabsTrigger>
        <TabsTrigger
          value='video-generation'
          className='flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent text-gray-300 hover:text-white hover:bg-gray-800/50 border-none ring-1 ring-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:ring-1 data-[state=active]:ring-purple-600'
        >
          <Video className='w-4 h-4' />
          <span>Video</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
