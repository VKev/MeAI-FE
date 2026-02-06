import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import WorkspaceTabNavigator from '@/components/workspace/common/WorkspaceTabNavigator';

export function WorkspaceImageContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const [prompt, setPrompt] = useState('');

  const currentTab = location.pathname.includes('video-generation') ? 'video-generation' : 'image-generation';

  const handleGenerate = () => {
    console.log('Generate with prompt:', prompt);
  };

  const handleTabChange = (value: string) => {
    navigate(`/workspace/${workspaceId}/${value}`);
  };

  return (
    <div className='flex-1 flex flex-col bg-zinc-950 text-white'>
      {/* Header Section */}
      <div className='border-b border-zinc-900 p-5 space-y-4'>
        {/* Prompt Input */}
        <div className='relative'>
          <Textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
            }}
            placeholder='Type a prompt...'
            className='w-full max-w-full bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 shadow-none focus-visible:shadow-none focus:border-purple-600 focus-visible:border-purple-600 focus:ring-0 focus-visible:ring-0 min-h-15 pr-30 resize-none wrap-break-words whitespace-pre-wrap overflow-hidden'
          />
          <Button
            variant={'default'}
            onClick={handleGenerate}
            disabled={!prompt.trim()}
            className='absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white px-4 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <Sparkles className='w-4 h-4 mr-2' />
            Generate
          </Button>
        </div>

        {/* Tabs */}
        <WorkspaceTabNavigator currentTab={currentTab} handleTabChange={handleTabChange} />
      </div>

      {/* Main Content Area */}
      <div className='flex-1 flex items-center justify-center p-6'>
        <div className='bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-2xl text-center'>
          <p className='text-gray-300'>
            You still have yet to make your first AI image generation. Please type a prompt above to create your first
            image set.
          </p>
        </div>
      </div>
    </div>
  );
}
