import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import WorkspaceTabNavigator from '@/components/workspace/common/WorkspaceTabNavigator';
import WorkspaceContentItem from '@/components/workspace/common/WorkspaceContentItem';
import PromptInput from '@/components/workspace/common/PromptInput';

export type TWorkspaceItem = {
  id: string;
  imageUrl: string;
  prompt: string;
  createdAt?: string;
};

const demoWorkspaceItems: TWorkspaceItem[] = [
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

const items: TWorkspaceItem[] = demoWorkspaceItems;

export function WorkspaceBuilderContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const [prompt, setPrompt] = useState('');

  const currentTab = location.pathname.includes('video-generation') ? 'video-generation' : 'image-generation';

  const handleGenerate = () => {
    console.log('Generate with prompt:', prompt);
  };

  const handleReusePrompt = (text: string) => {
    setPrompt(text);
  };

  const handleDownload = (item: TWorkspaceItem) => {
    console.log('Download item:', item.id);
  };

  const handleDelete = (item: TWorkspaceItem) => {
    console.log('Delete item:', item.id);
  };

  const handleTabChange = (value: string) => {
    navigate(`/workspace/${workspaceId}/${value}`);
  };

  const noItemWorkspace = useCallback(
    () => (
      <div className='flex h-full items-center justify-center'>
        <div className='bg-gray-900 border border-gray-800 rounded-lg p-8 text-center'>
          <p className='text-gray-300'>
            You still have yet to make your first AI generation. Please type a prompt above to create your first AI
            generation set.
          </p>
        </div>
      </div>
    ),
    []
  );

  return (
    <div className='flex-1 h-full overflow-auto bg-zinc-950 text-white border border-zinc-900'>
      {/* Header Section */}
      <div className='border-b border-zinc-900 p-5 space-y-4'>
        {/* Prompt Input */}
        <PromptInput prompt={prompt} setPrompt={setPrompt} handleGenerate={handleGenerate} />

        {/* Tabs */}
        <WorkspaceTabNavigator currentTab={currentTab} handleTabChange={handleTabChange} />
      </div>

      {/* Main Content Area */}
      <div className='p-6'>
        {items.length === 0 ? (
          noItemWorkspace()
        ) : (
          <div className='space-y-5'>
            {items.map((item) => (
              <WorkspaceContentItem
                key={item.id}
                item={item}
                handleDelete={handleDelete}
                handleDownload={handleDownload}
                handleReusePrompt={handleReusePrompt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
