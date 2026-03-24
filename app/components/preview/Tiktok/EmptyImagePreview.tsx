import React from 'react';

function EmptyImagePreview() {
  return (
    <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-zinc-300'>
      <p className='text-base font-semibold'>No image has been selected yet.</p>
      <p className='text-sm text-zinc-400'>Please select an image to preview the TikTok interface.</p>
    </div>
  );
}

export default React.memo(EmptyImagePreview);
