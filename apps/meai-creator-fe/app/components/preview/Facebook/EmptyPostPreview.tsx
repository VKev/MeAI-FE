import React from 'react';

function EmptyPostPreview() {
  return (
    <div className='rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 px-4 py-8 text-center text-sm text-zinc-400'>
      <p className='text-base font-semibold'>No image/video has been selected yet.</p>
      <p className='text-sm text-zinc-400'>Please select an image/video to preview the Facebook post interface.</p>
    </div>
  );
}

export default React.memo(EmptyPostPreview);
