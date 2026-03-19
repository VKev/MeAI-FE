import { useState } from 'react';
import { FacebookPreview } from '@/components/preview/Facebook';
import { InstagramPreview } from '@/components/preview/Instagram';
import { TiktokPreview } from '@/components/preview/Tiktok';
import { ThreadPreview } from '@/components/preview/Thread';

type Platform = 'tiktok' | 'facebook' | 'instagram' | 'thread';

interface PlatformTab {
  id: Platform;
  label: string;
  disabled: boolean;
}

const PLATFORM_TABS: PlatformTab[] = [
  { id: 'tiktok', label: 'TikTok', disabled: false }, // video / image (slideshow)
  { id: 'facebook', label: 'Facebook', disabled: false }, // post + reel (video/image (1 img))
  { id: 'instagram', label: 'Instagram', disabled: false }, // post + reel (video/image (1 img))
  { id: 'thread', label: 'Threads', disabled: false } // post
];

const PREVIEW_COMPONENTS: Record<Platform, () => React.JSX.Element> = {
  tiktok: TiktokPreview,
  facebook: FacebookPreview,
  instagram: InstagramPreview,
  thread: ThreadPreview
};

function PreviewSection() {
  const [activeTab, setActiveTab] = useState<Platform>(PLATFORM_TABS.find((tab) => !tab.disabled)?.id || 'tiktok');

  const handleTabClick = (tabId: Platform) => {
    const tab = PLATFORM_TABS.find((t) => t.id === tabId);
    if (tab && !tab.disabled) {
      setActiveTab(tabId);
    }
  };

  const ActivePreview = PREVIEW_COMPONENTS[activeTab];

  return (
    <div className='rounded-2xl border border-white/10 bg-zinc-950'>
      <div className='border-b border-white/10 px-6 py-4'>
        <h2 className='text-lg font-semibold text-white'>Platform Preview</h2>
      </div>
      <div className='space-y-5 p-6'>
        {/* Tab List */}
        <div className='overflow-x-auto'>
          <div className='flex gap-2 border-b border-transparent pb-0 min-w-max'>
            {PLATFORM_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                disabled={tab.disabled}
                className={`px-4 py-2 font-medium text-md whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'text-purple-400 border-b-2 border-purple-500'
                    : 'text-white/60 border-b-2 border-transparent hover:text-white/80'
                } ${tab.disabled ? 'cursor-not-allowed opacity-50 text-white/30' : 'cursor-pointer'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Content */}
        <div className='mt-6'>
          <ActivePreview />
        </div>
      </div>
    </div>
  );
}

export default PreviewSection;
