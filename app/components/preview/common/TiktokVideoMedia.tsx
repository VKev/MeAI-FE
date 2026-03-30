import React from 'react';
import { Disc3, Heart, MessageCircle, Share2 } from 'lucide-react';

function TiktokVideoMedia() {
  return (
    <div className='flex flex-col items-center gap-4 text-white'>
      <button type='button' className='flex flex-col items-center gap-1'>
        <Heart className='h-7 w-7 fill-white text-white' />
        <span className='text-[10px]'>12.4k</span>
      </button>
      <button type='button' className='flex flex-col items-center gap-1'>
        <MessageCircle className='h-7 w-7 fill-white text-white' />
        <span className='text-[10px]'>541</span>
      </button>
      <button type='button' className='flex flex-col items-center gap-1'>
        <Share2 className='h-7 w-7 fill-white text-white' />
        <span className='text-[10px]'>Share</span>
      </button>
      <div className='rounded-full border border-white/40 p-1'>
        <Disc3 className='h-7 w-7 animate-spin animation-duration-[4s]' />
      </div>
    </div>
  );
}

export default React.memo(TiktokVideoMedia);
