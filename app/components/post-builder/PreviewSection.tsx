import { FacebookPreview } from '@/components/preview/Facebook';
import { InstagramPreview } from '@/components/preview/Instagram';
import { TiktokPreview } from '@/components/preview/Tiktok';

function PreviewSection() {
  return (
    <div className='space-y-6'>
      <TiktokPreview />
      <FacebookPreview />
      <InstagramPreview />
    </div>
  );
}

export default PreviewSection;
