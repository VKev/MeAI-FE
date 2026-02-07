import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Copy, Download, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import WorkspaceTabNavigator from '@/components/workspace/common/WorkspaceTabNavigator';

type WorkspaceItem = {
  id: string;
  imageUrl: string;
  prompt: string;
  createdAt?: string;
};

const demoWorkspaceItems: WorkspaceItem[] = [
  {
    id: 'demo-1',
    imageUrl:
      'https://cdn.leonardo.ai/users/61b12163-b5db-448c-9fc7-816eba537f81/generations/17fe4c94-9560-4e79-8468-f70f08e95b10/segments/1:1:1/Lucid_Origin_bmw_530i_with_sleek_red_metal_color_featuring_a_p_0.jpg',
    prompt:
      'BMW 530i in deep red metallic paint, studio lighting, clean minimal backdrop, sharp reflections, 85mm lens, high detail.',
    createdAt: 'Tuesday, 13 January 2026'
  },
  {
    id: 'demo-2',
    imageUrl:
      'https://cdn.leonardo.ai/users/61b12163-b5db-448c-9fc7-816eba537f81/generations/17fe4c94-9560-4e79-8468-f70f08e95b10/segments/1:1:1/Lucid_Origin_bmw_530i_with_sleek_red_metal_color_featuring_a_p_0.jpg',
    prompt:
      'A stylish man driving a futuristic BMW M3, golden hour light, cinematic interior, ultra-realistic, 35mm lens.',
    createdAt: 'Monday, 12 January 2026'
  },
  {
    id: 'demo-3',
    imageUrl:
      'https://cdn.leonardo.ai/users/61b12163-b5db-448c-9fc7-816eba537f81/generations/17fe4c94-9560-4e79-8468-f70f08e95b10/segments/1:1:1/Lucid_Origin_bmw_530i_with_sleek_red_metal_color_featuring_a_p_0.jpg',
    prompt:
      'Luxury BMW interior detail shot, ambient lighting, premium materials, shallow depth of field, editorial style.',
    createdAt: 'Sunday, 11 January 2026'
  }
];

const items: WorkspaceItem[] = demoWorkspaceItems;

export function WorkspaceBuilderContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const [prompt, setPrompt] = useState('');

  const currentTab = location.pathname.includes('video-generation') ? 'video-generation' : 'image-generation';

  const handleGenerate = () => {
    console.log('Generate with prompt:', prompt);
  };

  const handleCopyPrompt = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  };

  const handleReusePrompt = (text: string) => {
    setPrompt(text);
  };

  const handleDownload = (item: WorkspaceItem) => {
    console.log('Download item:', item.id);
  };

  const handleDelete = (item: WorkspaceItem) => {
    console.log('Delete item:', item.id);
  };

  const handleTabChange = (value: string) => {
    navigate(`/workspace/${workspaceId}/${value}`);
  };

  return (
    <div className='flex-1 h-full overflow-auto bg-zinc-950 text-white border border-zinc-900'>
      {/* Header Section */}
      <div className='border-b border-zinc-900 p-5 space-y-4'>
        {/* Prompt Input */}
        <div className='relative'>
          <Textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
            }}
            maxLength={600}
            placeholder='Type a prompt...'
            className='w-full bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 shadow-none focus-visible:shadow-none focus:border-purple-600 focus-visible:border-purple-600 focus:ring-0 focus-visible:ring-0 min-h-13 pr-31 resize-none wrap-break-words whitespace-pre-wrap overflow-hidden'
          />
          <Button
            variant={'default'}
            onClick={handleGenerate}
            disabled={!prompt.trim()}
            className='absolute right-2 bottom-2 cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <Sparkles className='w-4 h-4 mr-2' />
            Generate
          </Button>
        </div>

        {/* Tabs */}
        <WorkspaceTabNavigator currentTab={currentTab} handleTabChange={handleTabChange} />
      </div>

      {/* Main Content Area */}
      <div className='p-6'>
        {items.length === 0 ? (
          <div className='flex h-full items-center justify-center'>
            <div className='bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-2xl text-center'>
              <p className='text-gray-300'>
                You still have yet to make your first AI image generation. Please type a prompt above to create your
                first image set.
              </p>
            </div>
          </div>
        ) : (
          <div className='space-y-5'>
            {items.map((item) => (
              <div key={item.id} className='rounded-2xl border border-zinc-800 bg-zinc-950 p-4 max-h-100'>
                <div className='grid gap-5 md:grid-cols-4'>
                  <div className='col-span-2 rounded-2xl'>
                    <img
                      src={item.imageUrl}
                      alt='Generated item'
                      className='max-w-full max-h-90 object-cover rounded-lg'
                    />
                  </div>

                  <div className='bg-transparent' />

                  <div className='space-y-4'>
                    <div className='space-y-3'>
                      <div className='flex justify-between items-center gap-2'>
                        {item.createdAt ? <span className='text-xs text-zinc-400'>{item.createdAt}</span> : null}
                        <div className='flex justify-center items-center gap-2'>
                          <Button
                            variant='secondary'
                            size='sm'
                            onClick={() => handleCopyPrompt(item.prompt)}
                            className='h-7 w-7 rounded-full p-0'
                            aria-label='Copy prompt'
                            title='Copy prompt'
                          >
                            <Copy className='h-3.5 w-3.5' />
                          </Button>
                          <Button
                            variant='secondary'
                            size='sm'
                            onClick={() => handleReusePrompt(item.prompt)}
                            className='h-7 w-7 rounded-full p-0'
                            aria-label='Reuse prompt'
                            title='Reuse prompt'
                          >
                            <RotateCcw className='h-3.5 w-3.5' />
                          </Button>
                        </div>
                      </div>
                      <p className='text-sm leading-relaxed text-zinc-200'>{item.prompt}</p>
                    </div>

                    <div className='flex justify-end items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleDownload(item)}
                        className='h-8 w-8 border-zinc-700 p-0 bg-zinc-900 hover:bg-zinc-800'
                        aria-label='Download'
                        title='Download'
                      >
                        <Download className='h-4 w-4 text-zinc-100' />
                      </Button>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => handleDelete(item)}
                        className='h-8 w-8 p-0'
                        aria-label='Delete'
                        title='Delete'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
