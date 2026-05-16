import React from 'react';
import { Heart, MessageCircle, MoreHorizontal, Share2 } from 'lucide-react';

function MetaVideoMedia() {
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
      <button type='button' className='flex flex-col items-center gap-1'>
        <MoreHorizontal className='h-7 w-7' />
        <span className='text-[10px]'>More</span>
      </button>
    </div>
  );
}

export default React.memo(MetaVideoMedia);
