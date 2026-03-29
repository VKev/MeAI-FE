import React from 'react';

function EmptyVideoPreview() {
  return (
    <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-zinc-300'>
      <p className='text-base font-semibold'>No video has been selected yet.</p>
      <p className='text-sm text-zinc-400'>Please select a video to preview the TikTok interface.</p>
    </div>
  );
}

export default React.memo(EmptyVideoPreview);
