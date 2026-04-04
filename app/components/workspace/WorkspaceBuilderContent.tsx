import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import WorkspaceTabNavigator from '@/components/workspace/common/WorkspaceTabNavigator';
import WorkspaceContentItem from '@/components/workspace/common/WorkspaceContentItem';
import PromptInput from '@/components/workspace/common/PromptInput';
import { ArrowRightIcon, Filter } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export type TWorkspaceItem = {
  id: string;
  imageUrl: string;
  prompt: string;
  createdAt?: string;
  type?: 'image' | 'video';
};

const demoWorkspaceItems: TWorkspaceItem[] = [
  {
    id: 'demo-1',
    imageUrl:
      'https://cdn.leonardo.ai/users/61b12163-b5db-448c-9fc7-816eba537f81/generations/17fe4c94-9560-4e79-8468-f70f08e95b10/segments/1:1:1/Lucid_Origin_bmw_530i_with_sleek_red_metal_color_featuring_a_p_0.jpg',
    prompt:
      'BMW 530i in deep red metallic paint, studio lighting, clean minimal backdrop, sharp reflections, 85mm lens, high detail.',
    createdAt: 'Tuesday, 13 January 2026',
    type: 'image'
  },
  {
    id: 'demo-2',
    imageUrl:
      'https://cdn.leonardo.ai/users/61b12163-b5db-448c-9fc7-816eba537f81/generations/17fe4c94-9560-4e79-8468-f70f08e95b10/segments/1:1:1/Lucid_Origin_bmw_530i_with_sleek_red_metal_color_featuring_a_p_0.jpg',
    prompt:
      'A stylish man driving a futuristic BMW M3, golden hour light, cinematic interior, ultra-realistic, 35mm lens.',
    createdAt: 'Monday, 12 January 2026',
    type: 'image'
  },
  {
    id: 'demo-3',
    imageUrl:
      'https://cdn.leonardo.ai/users/61b12163-b5db-448c-9fc7-816eba537f81/generations/17fe4c94-9560-4e79-8468-f70f08e95b10/segments/1:1:1/Lucid_Origin_bmw_530i_with_sleek_red_metal_color_featuring_a_p_0.jpg',
    prompt:
      'Luxury BMW interior detail shot, ambient lighting, premium materials, shallow depth of field, editorial style.',
    createdAt: 'Sunday, 11 January 2026',
    type: 'image'
  }
];

const RESOURCE_TYPE_OPTIONS = ['ALL', 'IMAGE', 'VIDEO'] as const;

const items: TWorkspaceItem[] = demoWorkspaceItems;

export function WorkspaceBuilderContent() {
  const navigate = useNavigate();
  const { workspaceId, sessionId, mode } = useParams();

  const [prompt, setPrompt] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<(typeof RESOURCE_TYPE_OPTIONS)[number]>('ALL');
  const [selectedItems, setSelectedItems] = useState<TWorkspaceItem[]>([]);

  const currentTab = mode === 'video' ? 'video' : 'image';

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

  const handleToggleSelect = (item: TWorkspaceItem) => {
    setSelectedItems((prev) =>
      prev.some((s) => s.id === item.id) ? prev.filter((s) => s.id !== item.id) : [...prev, item]
    );
  };

  const handleProcessPostBuilder = () => {
    console.log('Process to Post Builder:', selectedItems);
  };

  const filteredItems = items.filter((item) => {
    if (resourceTypeFilter === 'ALL') return true;
    if (resourceTypeFilter === 'IMAGE') return item.type === 'image';
    if (resourceTypeFilter === 'VIDEO') return item.type === 'video';
    return true;
  });

  const handleTabChange = (value: string) => {
    if (!workspaceId || !sessionId) return;

    if (value === 'video') {
      navigate(`/workspace/${workspaceId}/ai-generation/${sessionId}/video`);
      return;
    }

    navigate(`/workspace/${workspaceId}/ai-generation/${sessionId}`);
  };

  const renderItem = useCallback(
    (item: any, index: number) => {
      return (
        <WorkspaceContentItem
          key={index}
          item={item}
          isSelected={selectedItems.some((s) => s.id === item.id)}
          onToggleSelect={handleToggleSelect}
          handleDelete={handleDelete}
          handleDownload={handleDownload}
          handleReusePrompt={handleReusePrompt}
        />
      );
    },
    [selectedItems]
  );

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
      <div className='p-6 space-y-5'>
        <section className='rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,20,0.82)_0%,rgba(8,10,16,0.9)_100%)] p-4 sm:p-5'>
          <div className='flex items-center justify-between'>
            <div className='flex flex-wrap items-center gap-2'>
              <Label className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium tracking-wide text-slate-300 uppercase'>
                <Filter className='h-3.5 w-3.5' />
                Filter Type
              </Label>

              {RESOURCE_TYPE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type='button'
                  onClick={() => setResourceTypeFilter(option)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    resourceTypeFilter === option
                      ? 'bg-violet-500/25 text-violet-100 ring-1 ring-violet-300/40'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <Button
              variant={'default'}
              onClick={handleProcessPostBuilder}
              disabled={selectedItems.length === 0}
              className='cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Process to Post Builder ({selectedItems.length})
              <ArrowRightIcon className='w-5 h-5' />
            </Button>
          </div>
        </section>
        {filteredItems.length === 0 ? (
          noItemWorkspace()
        ) : (
          <div className='space-y-5'>{filteredItems.map(renderItem)}</div>
        )}
      </div>
    </div>
  );
}
